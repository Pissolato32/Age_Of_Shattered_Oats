/**
 * MEM-002 — RelationshipStore Tests
 */

import { describe, it, expect } from 'vitest';
import { RelationshipStore, applyRelationshipDelta, createRelationshipStoreFromRecords } from '../../src/memory/RelationshipStore';

describe('RelationshipStore', () => {
  it('should create relationships', () => {
    const store = new RelationshipStore();

    const record = store.create({
      sourceId: 'player',
      targetId: 'house_1',
      dimensions: { trust: 5, loyalty: 3, hostility: 0, debt: 0, influence: 2, kinship: 1 },
      type: 'LORD_VASSAL',
      turn: 1,
    });

    expect(record.id).toBeDefined();
    expect(record.sourceId).toBe('player');
    expect(record.targetId).toBe('house_1');
    expect(record.type).toBe('LORD_VASSAL');
    expect(record.history).toHaveLength(0);
    expect(store.size()).toBe(1);
  });

  it('should clamp dimensions to [-10, +10]', () => {
    const store = new RelationshipStore();

    const record = store.create({
      sourceId: 'player',
      targetId: 'house_1',
      dimensions: { trust: 100, loyalty: -100, hostility: 0, debt: 0, influence: 0, kinship: 0 },
      type: 'NEUTRAL',
      turn: 1,
    });

    expect(record.dimensions.trust).toBe(10);
    expect(record.dimensions.loyalty).toBe(-10);
  });

  it('should retrieve by source/target', () => {
    const store = new RelationshipStore();

    store.create({ sourceId: 'player', targetId: 'house_1', dimensions: { trust: 0, loyalty: 0, hostility: 0, debt: 0, influence: 0, kinship: 0 }, type: 'ALLY', turn: 1 });
    store.create({ sourceId: 'player', targetId: 'house_2', dimensions: { trust: 0, loyalty: 0, hostility: 0, debt: 0, influence: 0, kinship: 0 }, type: 'ENEMY', turn: 1 });
    store.create({ sourceId: 'house_1', targetId: 'player', dimensions: { trust: 0, loyalty: 0, hostility: 0, debt: 0, influence: 0, kinship: 0 }, type: 'ALLY', turn: 1 });

    const playerToHouse1 = store.get('player', 'house_1');
    expect(playerToHouse1).toBeDefined();
    expect(playerToHouse1!.type).toBe('ALLY');

    const house1ToPlayer = store.get('house_1', 'player');
    expect(house1ToPlayer).toBeDefined();
  });

  it('should apply deltas atomically', () => {
    const store = new RelationshipStore();

    const initial = store.create({
      sourceId: 'player',
      targetId: 'house_1',
      dimensions: { trust: 5, loyalty: 3, hostility: 0, debt: 0, influence: 2, kinship: 1 },
      type: 'LORD_VASSAL',
      turn: 1,
    });

    const updated = store.applyDelta(
      initial,
      { trust: 2, hostility: -1 },
      2,
      'Player helped the house',
      'PLAYER_ACTION',
    );

    expect(updated.id).toBe(initial.id);
    expect(updated.dimensions.trust).toBe(7);
    expect(updated.dimensions.hostility).toBe(-1);
    expect(updated.dimensions.loyalty).toBe(3); // unchanged
    expect(updated.history).toHaveLength(1);
    expect(updated.history[0].reason).toBe('Player helped the house');
  });

  it('should clamp delta results', () => {
    const store = new RelationshipStore();

    const initial = store.create({
      sourceId: 'player',
      targetId: 'house_1',
      dimensions: { trust: 8, loyalty: 0, hostility: 0, debt: 0, influence: 0, kinship: 0 },
      type: 'ALLY',
      turn: 1,
    });

    const updated = store.applyDelta(
      initial,
      { trust: 10 }, // 8 + 10 = 18, should clamp to 10
      2,
      'Too much trust',
      'PLAYER_ACTION',
    );

    expect(updated.dimensions.trust).toBe(10);
  });

  it('should set relationships atomically', () => {
    const store = new RelationshipStore();

    store.create({
      sourceId: 'player',
      targetId: 'house_1',
      dimensions: { trust: 5, loyalty: 0, hostility: 0, debt: 0, influence: 0, kinship: 0 },
      type: 'ALLY',
      turn: 1,
    });

    const newRecord = {
      id: 'custom_id',
      sourceId: 'player',
      targetId: 'house_1',
      dimensions: { trust: 10, loyalty: 10, hostility: 0, debt: 0, influence: 0, kinship: 0 },
      type: 'ALLY' as const,
      history: [],
      lastUpdatedTurn: 2,
    };

    store.set(newRecord);

    expect(store.size()).toBe(1);
    const retrieved = store.get('player', 'house_1');
    expect(retrieved!.dimensions.trust).toBe(10);
  });

  it('should retrieve by agent', () => {
    const store = new RelationshipStore();

    store.create({ sourceId: 'player', targetId: 'house_1', dimensions: { trust: 0, loyalty: 0, hostility: 0, debt: 0, influence: 0, kinship: 0 }, type: 'ALLY', turn: 1 });
    store.create({ sourceId: 'player', targetId: 'house_2', dimensions: { trust: 0, loyalty: 0, hostility: 0, debt: 0, influence: 0, kinship: 0 }, type: 'ENEMY', turn: 1 });
    store.create({ sourceId: 'house_1', targetId: 'house_2', dimensions: { trust: 0, loyalty: 0, hostility: 0, debt: 0, influence: 0, kinship: 0 }, type: 'RIVAL', turn: 1 });

    const playerRelationships = store.getByAgent('player');
    expect(playerRelationships).toHaveLength(2);

    const house1Relationships = store.getByAgent('house_1');
    expect(house1Relationships).toHaveLength(2);
  });

  it('should create from existing records', () => {
    const original = new RelationshipStore();
    original.create({ sourceId: 'player', targetId: 'house_1', dimensions: { trust: 5, loyalty: 0, hostility: 0, debt: 0, influence: 0, kinship: 0 }, type: 'ALLY', turn: 1 });
    original.create({ sourceId: 'player', targetId: 'house_2', dimensions: { trust: -3, loyalty: 0, hostility: 5, debt: 0, influence: 0, kinship: 0 }, type: 'ENEMY', turn: 1 });

    const records = original.toArray();
    const restored = createRelationshipStoreFromRecords(records);

    expect(restored.size()).toBe(2);
  });
});

describe('applyRelationshipDelta (pure function)', () => {
  it('should apply delta without side effects', () => {
    const current = { trust: 5, loyalty: 3, hostility: 0, debt: 0, influence: 2, kinship: 1 };

    const result = applyRelationshipDelta(current, { trust: 2 });

    expect(result.trust).toBe(7);
    expect(current.trust).toBe(5); // original unchanged
  });

  it('should clamp results', () => {
    const current = { trust: 8, loyalty: 0, hostility: 0, debt: 0, influence: 0, kinship: 0 };

    const result = applyRelationshipDelta(current, { trust: 5 });

    expect(result.trust).toBe(10);
  });

  it('should handle negative deltas', () => {
    const current = { trust: 5, loyalty: 3, hostility: 0, debt: 0, influence: 0, kinship: 0 };

    const result = applyRelationshipDelta(current, { loyalty: -5 });

    expect(result.loyalty).toBe(-2);
  });

  it('should handle multiple dimensions', () => {
    const current = { trust: 5, loyalty: 3, hostility: 0, debt: 0, influence: 2, kinship: 1 };

    const result = applyRelationshipDelta(current, { trust: 1, loyalty: -2, hostility: 3 });

    expect(result.trust).toBe(6);
    expect(result.loyalty).toBe(1);
    expect(result.hostility).toBe(3);
  });
});

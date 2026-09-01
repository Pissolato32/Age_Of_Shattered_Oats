/**
 * MEM-002 — MemoryStore Tests
 */

import { describe, it, expect } from 'vitest';
import { MemoryStore, createMemoryStoreFromRecords } from '../../src/memory/MemoryStore';

describe('MemoryStore', () => {
  it('should add memory records', () => {
    const store = new MemoryStore();

    const record = store.add({
      ownerId: 'player',
      subjectId: 'event_1',
      eventType: 'PLAYER_ACTION',
      description: 'Test memory',
      importance: 5,
      tickRegistered: 1,
      source: 'OBSERVED',
    });

    expect(record.id).toBeDefined();
    expect(record.ownerId).toBe('player');
    expect(record.subjectId).toBe('event_1');
    expect(record.importance).toBe(5);
    expect(record.decayed).toBe(false);
    expect(store.size()).toBe(1);
  });

  it('should clamp importance to [1, 10]', () => {
    const store = new MemoryStore();

    const low = store.add({
      ownerId: 'player',
      subjectId: 'event_1',
      eventType: 'PLAYER_ACTION',
      description: 'Test',
      importance: -5,
      tickRegistered: 1,
      source: 'OBSERVED',
    });

    const high = store.add({
      ownerId: 'player',
      subjectId: 'event_2',
      eventType: 'PLAYER_ACTION',
      description: 'Test',
      importance: 100,
      tickRegistered: 1,
      source: 'OBSERVED',
    });

    expect(low.importance).toBe(1);
    expect(high.importance).toBe(10);
  });

  it('should retrieve by owner', () => {
    const store = new MemoryStore();

    store.add({ ownerId: 'player', subjectId: 'a', eventType: 'PLAYER_ACTION', description: 'Test', importance: 5, tickRegistered: 1, source: 'OBSERVED' });
    store.add({ ownerId: 'npc_1', subjectId: 'b', eventType: 'ENGINE_TURN', description: 'Test', importance: 5, tickRegistered: 1, source: 'REPORTED' });
    store.add({ ownerId: 'player', subjectId: 'c', eventType: 'PLAYER_ACTION', description: 'Test', importance: 5, tickRegistered: 1, source: 'OBSERVED' });

    const playerMemories = store.getByOwner('player');
    expect(playerMemories).toHaveLength(2);
  });

  it('should retrieve by subject', () => {
    const store = new MemoryStore();

    store.add({ ownerId: 'player', subjectId: 'event_1', eventType: 'PLAYER_ACTION', description: 'Test', importance: 5, tickRegistered: 1, source: 'OBSERVED' });
    store.add({ ownerId: 'npc_1', subjectId: 'event_1', eventType: 'ENGINE_TURN', description: 'Test', importance: 5, tickRegistered: 1, source: 'REPORTED' });
    store.add({ ownerId: 'player', subjectId: 'event_2', eventType: 'PLAYER_ACTION', description: 'Test', importance: 5, tickRegistered: 1, source: 'OBSERVED' });

    const event1Memories = store.getBySubject('event_1');
    expect(event1Memories).toHaveLength(2);
  });

  it('should evaluate decay', () => {
    const store = new MemoryStore();

    // Importance 1: decays after 30 ticks
    store.add({ ownerId: 'player', subjectId: 'a', eventType: 'PLAYER_ACTION', description: 'Test', importance: 1, tickRegistered: 1, source: 'OBSERVED' });

    // Importance 5: decays after 150 ticks
    store.add({ ownerId: 'player', subjectId: 'b', eventType: 'PLAYER_ACTION', description: 'Test', importance: 5, tickRegistered: 1, source: 'OBSERVED' });

    // At tick 30, importance 1 should decay
    const decayed1 = store.evaluateDecay(31);
    expect(decayed1).toBe(1);

    const memories = store.getByOwner('player');
    expect(memories[0].decayed).toBe(true);
    expect(memories[1].decayed).toBe(false);

    // At tick 151, importance 5 should decay
    const decayed2 = store.evaluateDecay(151);
    expect(decayed2).toBe(1);

    const memories2 = store.getByOwner('player');
    expect(memories2[0].decayed).toBe(true);
    expect(memories2[1].decayed).toBe(true);
  });

  it('should create correction records', () => {
    const store = new MemoryStore();

    const original = store.add({
      ownerId: 'player',
      subjectId: 'event_1',
      eventType: 'PLAYER_ACTION',
      description: 'Original memory',
      importance: 5,
      tickRegistered: 1,
      source: 'OBSERVED',
    });

    const corrected = store.correctionOf({
      ownerId: 'player',
      subjectId: 'event_1',
      eventType: 'PLAYER_ACTION',
      description: 'Corrected memory',
      importance: 7,
      tickRegistered: 2,
      source: 'INFERRED',
    }, original.id);

    expect(corrected.correctionOf).toBe(original.id);
    expect(corrected.description).toBe('Corrected memory');
    expect(store.size()).toBe(2);

    const corrections = store.getCorrections(original.id);
    expect(corrections).toHaveLength(1);
    expect(corrections[0].id).toBe(corrected.id);
  });

  it('should throw when correcting non-existent memory', () => {
    const store = new MemoryStore();

    expect(() => store.correctionOf({
      ownerId: 'player',
      subjectId: 'event_1',
      eventType: 'PLAYER_ACTION',
      description: 'Test',
      importance: 5,
      tickRegistered: 1,
      source: 'OBSERVED',
    }, 'non_existent_id')).toThrow('Memory non_existent_id not found');
  });

  it('should create from existing records', () => {
    const original = new MemoryStore();
    original.add({ ownerId: 'player', subjectId: 'a', eventType: 'PLAYER_ACTION', description: 'Test', importance: 5, tickRegistered: 1, source: 'OBSERVED' });
    original.add({ ownerId: 'npc_1', subjectId: 'b', eventType: 'ENGINE_TURN', description: 'Test', importance: 5, tickRegistered: 1, source: 'REPORTED' });

    const records = original.toArray();
    const restored = createMemoryStoreFromRecords(records);

    expect(restored.size()).toBe(2);
  });
});

/**
 * MEM-004 — MemoryStore Query Tests
 */

import { describe, it, expect } from 'vitest';
import { MemoryStore } from '../../../src/memory/MemoryStore';

describe('MemoryStore queries', () => {
  it('should query by subject', () => {
    const store = new MemoryStore();
    store.add({ ownerId: 'player', subjectId: 'house_1', eventType: 'PLAYER_ACTION', description: 'Test', importance: 5, tickRegistered: 1, source: 'OBSERVED' });
    store.add({ ownerId: 'player', subjectId: 'house_2', eventType: 'PLAYER_ACTION', description: 'Test', importance: 5, tickRegistered: 1, source: 'OBSERVED' });
    store.add({ ownerId: 'npc_1', subjectId: 'house_1', eventType: 'ENGINE_TURN', description: 'Test', importance: 5, tickRegistered: 1, source: 'REPORTED' });

    const results = store.queryBySubject('house_1');
    expect(results).toHaveLength(2);
  });

  it('should query by tags', () => {
    const store = new MemoryStore();
    store.add({ ownerId: 'player', subjectId: 'a', eventType: 'PLAYER_ACTION', description: 'Test', importance: 5, tickRegistered: 1, source: 'OBSERVED', tags: ['diplomacy', 'alliance'] });
    store.add({ ownerId: 'player', subjectId: 'b', eventType: 'PLAYER_ACTION', description: 'Test', importance: 5, tickRegistered: 1, source: 'OBSERVED', tags: ['war', 'battle'] });
    store.add({ ownerId: 'player', subjectId: 'c', eventType: 'PLAYER_ACTION', description: 'Test', importance: 5, tickRegistered: 1, source: 'OBSERVED', tags: ['diplomacy'] });

    const results = store.queryByTags(['diplomacy']);
    expect(results).toHaveLength(2);
  });

  it('should query by temporal scope - CURRENT_STATE', () => {
    const store = new MemoryStore();
    store.add({ ownerId: 'player', subjectId: 'a', eventType: 'PLAYER_ACTION', description: 'Active', importance: 5, tickRegistered: 1, source: 'OBSERVED' });
    store.add({ ownerId: 'player', subjectId: 'b', eventType: 'PLAYER_ACTION', description: 'Decayed', importance: 1, tickRegistered: 1, source: 'OBSERVED' });

    // Mark one as decayed
    store.evaluateDecay(100);

    const results = store.queryByTemporalScope({ mode: 'CURRENT_STATE' });
    expect(results).toHaveLength(1);
    expect(results[0].description).toBe('Active');
  });

  it('should query by temporal scope - HISTORICAL_POINT', () => {
    const store = new MemoryStore();
    store.add({ ownerId: 'player', subjectId: 'a', eventType: 'PLAYER_ACTION', description: 'Old', importance: 5, tickRegistered: 1, source: 'OBSERVED' });
    store.add({ ownerId: 'player', subjectId: 'b', eventType: 'PLAYER_ACTION', description: 'New', importance: 5, tickRegistered: 10, source: 'OBSERVED' });

    const results = store.queryByTemporalScope({ mode: 'HISTORICAL_POINT', targetTurn: 5 });
    expect(results).toHaveLength(1);
    expect(results[0].description).toBe('Old');
  });

  it('should query by temporal scope - TEMPORAL_EVOLUTION', () => {
    const store = new MemoryStore();
    store.add({ ownerId: 'player', subjectId: 'a', eventType: 'PLAYER_ACTION', description: 'Active', importance: 5, tickRegistered: 1, source: 'OBSERVED' });
    store.add({ ownerId: 'player', subjectId: 'b', eventType: 'PLAYER_ACTION', description: 'Decayed', importance: 1, tickRegistered: 1, source: 'OBSERVED' });

    store.evaluateDecay(100);

    const results = store.queryByTemporalScope({ mode: 'TEMPORAL_EVOLUTION' });
    expect(results).toHaveLength(2);
  });

  it('should apply temporal filter to queryBySubject', () => {
    const store = new MemoryStore();
    store.add({ ownerId: 'player', subjectId: 'a', eventType: 'PLAYER_ACTION', description: 'Old', importance: 5, tickRegistered: 1, source: 'OBSERVED' });
    store.add({ ownerId: 'player', subjectId: 'a', eventType: 'PLAYER_ACTION', description: 'New', importance: 5, tickRegistered: 10, source: 'OBSERVED' });

    const results = store.queryBySubject('a', { mode: 'HISTORICAL_POINT', targetTurn: 5 });
    expect(results).toHaveLength(1);
    expect(results[0].description).toBe('Old');
  });
});

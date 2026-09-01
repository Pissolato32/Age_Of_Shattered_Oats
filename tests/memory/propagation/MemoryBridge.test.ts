/**
 * MEM-003 — MemoryBridge Tests
 */

import { describe, it, expect } from 'vitest';
import { MemoryBridge } from '../../../src/memory/propagation/MemoryBridge';
import { KnowledgeStore } from '../../../src/memory/KnowledgeStore';

describe('MemoryBridge', () => {
  it('should migrate legacy memories to KnowledgeStore', () => {
    const store = new KnowledgeStore();
    const bridge = new MemoryBridge(store);

    const legacyMemories = [
      { id: 'mem_1', ownerId: 'player', subjectId: 'event_1', description: 'Test memory', importance: 5, tickRegistered: 1, decayed: false },
      { id: 'mem_2', ownerId: 'player', subjectId: 'event_2', description: 'Another memory', importance: 7, tickRegistered: 2, decayed: false },
    ];

    const result = bridge.migrateMemories(legacyMemories);

    expect(result.migratedCount).toBe(2);
    expect(result.skippedCount).toBe(0);
    expect(store.size()).toBe(2);
  });

  it('should skip decayed memories', () => {
    const store = new KnowledgeStore();
    const bridge = new MemoryBridge(store);

    const legacyMemories = [
      { id: 'mem_1', ownerId: 'player', subjectId: 'event_1', description: 'Active memory', importance: 5, tickRegistered: 1, decayed: false },
      { id: 'mem_2', ownerId: 'player', subjectId: 'event_2', description: 'Decayed memory', importance: 5, tickRegistered: 1, decayed: true },
    ];

    const result = bridge.migrateMemories(legacyMemories);

    expect(result.migratedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(store.size()).toBe(1);
  });

  it('should skip already migrated memories', () => {
    const store = new KnowledgeStore();
    const bridge = new MemoryBridge(store);

    const legacyMemories = [
      { id: 'mem_1', ownerId: 'player', subjectId: 'event_1', description: 'Test memory', importance: 5, tickRegistered: 1, decayed: false },
    ];

    // First migration
    bridge.migrateMemories(legacyMemories);
    expect(store.size()).toBe(1);

    // Second migration should skip
    const result = bridge.migrateMemories(legacyMemories);
    expect(result.migratedCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(store.size()).toBe(1);
  });

  it('should track migrated IDs', () => {
    const store = new KnowledgeStore();
    const bridge = new MemoryBridge(store);

    const legacyMemories = [
      { id: 'mem_1', ownerId: 'player', subjectId: 'event_1', description: 'Test', importance: 5, tickRegistered: 1, decayed: false },
    ];

    bridge.migrateMemories(legacyMemories);

    expect(bridge.isMigrated('mem_1')).toBe(true);
    expect(bridge.isMigrated('mem_2')).toBe(false);
    expect(bridge.getMigratedCount()).toBe(1);
  });

  it('should reset migration tracking', () => {
    const store = new KnowledgeStore();
    const bridge = new MemoryBridge(store);

    const legacyMemories = [
      { id: 'mem_1', ownerId: 'player', subjectId: 'event_1', description: 'Test', importance: 5, tickRegistered: 1, decayed: false },
    ];

    bridge.migrateMemories(legacyMemories);
    expect(bridge.getMigratedCount()).toBe(1);

    bridge.reset();
    expect(bridge.getMigratedCount()).toBe(0);
    expect(bridge.isMigrated('mem_1')).toBe(false);
  });

  it('should handle empty array', () => {
    const store = new KnowledgeStore();
    const bridge = new MemoryBridge(store);

    const result = bridge.migrateMemories([]);

    expect(result.migratedCount).toBe(0);
    expect(result.skippedCount).toBe(0);
    expect(store.size()).toBe(0);
  });

  it('should create correct KnowledgeRecords', () => {
    const store = new KnowledgeStore();
    const bridge = new MemoryBridge(store);

    const legacyMemories = [
      { id: 'mem_1', ownerId: 'player', subjectId: 'event_1', description: 'Test memory', importance: 5, tickRegistered: 1, decayed: false },
    ];

    bridge.migrateMemories(legacyMemories);

    const records = store.getByAgent('player');
    expect(records).toHaveLength(1);
    expect(records[0].value).toBe('Test memory');
    expect(records[0].source).toBe('DIRECT_OBSERVATION');
    expect(records[0].certainty).toBe('CONFIRMED');
    expect(records[0].visibility).toBe('PRIVATE');
  });
});

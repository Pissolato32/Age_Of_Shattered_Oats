/**
 * MEM-002 — Migration Tests
 */

import { describe, it, expect } from 'vitest';
import { migrateMemories, migrateEvents } from '../../src/memory/migration';

describe('migrateMemories', () => {
  it('should migrate legacy memories to MemoryRecord format', () => {
    const legacy = [
      {
        id: 'mem_1',
        ownerId: 'player',
        subjectId: 'event_1',
        description: 'Test memory',
        importance: 5,
        tickRegistered: 1,
        decayed: false,
      },
      {
        id: 'mem_2',
        ownerId: 'npc_1',
        subjectId: 'event_2',
        description: 'Another memory',
        importance: 8,
        tickRegistered: 3,
        decayed: true,
      },
    ];

    const migrated = migrateMemories(legacy);

    expect(migrated).toHaveLength(2);

    expect(migrated[0].id).toBe('mem_1');
    expect(migrated[0].ownerId).toBe('player');
    expect(migrated[0].description).toBe('Test memory');
    expect(migrated[0].importance).toBe(5);
    expect(migrated[0].decayed).toBe(false);
    expect(migrated[0].source).toBe('OBSERVED');

    expect(migrated[1].id).toBe('mem_2');
    expect(migrated[1].decayed).toBe(true);
  });

  it('should handle empty array', () => {
    const migrated = migrateMemories([]);
    expect(migrated).toHaveLength(0);
  });
});

describe('migrateEvents', () => {
  it('should migrate legacy events to CampaignEvent format', () => {
    const legacy = [
      {
        id: 'evt_1',
        sequence: 1,
        type: 'WEEKLY_TURN_RESOLVED',
        payload: { turn: 1, week: 1 },
        timestamp: '2026-01-01T00:00:00Z',
        week: 1,
        hash: 'hash_1',
      },
      {
        id: 'evt_2',
        sequence: 2,
        type: 'COMMAND_RESOLVED',
        payload: { commandId: 'cmd_1', action: 'recruit', status: 'SUCCESS' },
        timestamp: '2026-01-01T00:00:01Z',
        week: 1,
        hash: 'hash_2',
      },
    ];

    const migrated = migrateEvents(legacy);

    expect(migrated).toHaveLength(2);

    expect(migrated[0].id).toBe('evt_1');
    expect(migrated[0].sequence).toBe(1);
    expect(migrated[0].type).toBe('ENGINE_TURN');
    expect(migrated[0].turn).toBe(1);
    expect(migrated[0].outcome).toBe('SUCCESS');

    expect(migrated[1].id).toBe('evt_2');
    expect(migrated[1].type).toBe('PLAYER_ACTION');
    expect(migrated[1].action).toBe('recruit');
    expect(migrated[1].actorIds).toContain('cmd_1');
  });

  it('should map unknown event types to ENGINE_TURN', () => {
    const legacy = [
      {
        id: 'evt_1',
        sequence: 1,
        type: 'UNKNOWN_TYPE',
        payload: {},
        timestamp: '2026-01-01T00:00:00Z',
        week: 1,
        hash: 'hash_1',
      },
    ];

    const migrated = migrateEvents(legacy);
    expect(migrated[0].type).toBe('ENGINE_TURN');
  });

  it('should handle empty array', () => {
    const migrated = migrateEvents([]);
    expect(migrated).toHaveLength(0);
  });
});

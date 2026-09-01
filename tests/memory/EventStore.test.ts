/**
 * MEM-002 — EventStore Tests
 */

import { describe, it, expect } from 'vitest';
import { EventStore, createEventStoreFromEvents } from '../../src/memory/EventStore';

describe('EventStore', () => {
  it('should record events with sequential IDs', () => {
    const store = new EventStore();

    const event1 = store.record({
      type: 'PLAYER_ACTION',
      turn: 1,
      actorIds: ['player'],
      subjectIds: [],
      action: 'test',
      outcome: 'SUCCESS',
      summary: 'Test event 1',
    });

    const event2 = store.record({
      type: 'ENGINE_TURN',
      turn: 1,
      actorIds: [],
      subjectIds: [],
      action: 'weekly_turn',
      outcome: 'SUCCESS',
      summary: 'Test event 2',
    });

    expect(event1.sequence).toBe(1);
    expect(event2.sequence).toBe(2);
    expect(event1.id).not.toBe(event2.id);
  });

  it('should compute deterministic hashes', () => {
    const store = new EventStore();

    const event1 = store.record({
      type: 'PLAYER_ACTION',
      turn: 1,
      actorIds: ['player'],
      subjectIds: [],
      action: 'test',
      outcome: 'SUCCESS',
      summary: 'Test event',
    });

    // Record same data again
    const event2 = store.record({
      type: 'PLAYER_ACTION',
      turn: 1,
      actorIds: ['player'],
      subjectIds: [],
      action: 'test',
      outcome: 'SUCCESS',
      summary: 'Test event',
    });

    // Different sequences produce different hashes
    expect(event1.hash).not.toBe(event2.hash);
    expect(event1.hash).toMatch(/^evt_1_/);
    expect(event2.hash).toMatch(/^evt_2_/);
  });

  it('should retrieve events by type', () => {
    const store = new EventStore();

    store.record({
      type: 'PLAYER_ACTION',
      turn: 1,
      actorIds: [],
      subjectIds: [],
      action: 'test',
      outcome: 'SUCCESS',
      summary: 'Test',
    });

    store.record({
      type: 'ENGINE_TURN',
      turn: 1,
      actorIds: [],
      subjectIds: [],
      action: 'test',
      outcome: 'SUCCESS',
      summary: 'Test',
    });

    store.record({
      type: 'PLAYER_ACTION',
      turn: 2,
      actorIds: [],
      subjectIds: [],
      action: 'test',
      outcome: 'SUCCESS',
      summary: 'Test',
    });

    const playerActions = store.getEventsByType('PLAYER_ACTION');
    expect(playerActions).toHaveLength(2);

    const engineTurns = store.getEventsByType('ENGINE_TURN');
    expect(engineTurns).toHaveLength(1);
  });

  it('should retrieve events since a turn', () => {
    const store = new EventStore();

    store.record({ type: 'PLAYER_ACTION', turn: 1, actorIds: [], subjectIds: [], action: 'test', outcome: 'SUCCESS', summary: 'Test' });
    store.record({ type: 'PLAYER_ACTION', turn: 2, actorIds: [], subjectIds: [], action: 'test', outcome: 'SUCCESS', summary: 'Test' });
    store.record({ type: 'PLAYER_ACTION', turn: 3, actorIds: [], subjectIds: [], action: 'test', outcome: 'SUCCESS', summary: 'Test' });

    const sinceTurn2 = store.getEventsSinceTurn(2);
    expect(sinceTurn2).toHaveLength(2);
    expect(sinceTurn2[0].turn).toBe(2);
    expect(sinceTurn2[1].turn).toBe(3);
  });

  it('should verify integrity', () => {
    const store = new EventStore();

    store.record({ type: 'PLAYER_ACTION', turn: 1, actorIds: [], subjectIds: [], action: 'test', outcome: 'SUCCESS', summary: 'Test' });
    store.record({ type: 'ENGINE_TURN', turn: 2, actorIds: [], subjectIds: [], action: 'test', outcome: 'SUCCESS', summary: 'Test' });

    expect(store.verifyIntegrity()).toBe(true);
  });

  it('should create from existing events', () => {
    const original = new EventStore();
    original.record({ type: 'PLAYER_ACTION', turn: 1, actorIds: [], subjectIds: [], action: 'test', outcome: 'SUCCESS', summary: 'Test' });
    original.record({ type: 'ENGINE_TURN', turn: 2, actorIds: [], subjectIds: [], action: 'test', outcome: 'SUCCESS', summary: 'Test' });

    const events = original.toArray();
    const restored = createEventStoreFromEvents(events);

    expect(restored.size()).toBe(2);
    expect(restored.verifyIntegrity()).toBe(true);
  });

  it('should support iteration', () => {
    const store = new EventStore();
    store.record({ type: 'PLAYER_ACTION', turn: 1, actorIds: [], subjectIds: [], action: 'test', outcome: 'SUCCESS', summary: 'Test' });
    store.record({ type: 'ENGINE_TURN', turn: 2, actorIds: [], subjectIds: [], action: 'test', outcome: 'SUCCESS', summary: 'Test' });

    const types: string[] = [];
    for (const event of store) {
      types.push(event.type);
    }

    expect(types).toEqual(['PLAYER_ACTION', 'ENGINE_TURN']);
  });
});

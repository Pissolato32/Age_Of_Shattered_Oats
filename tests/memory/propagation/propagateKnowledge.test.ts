/**
 * MEM-003 — propagateKnowledge Tests
 */

import { describe, it, expect } from 'vitest';
import { propagateKnowledge, propagateKnowledgeFromEvents } from '../../../src/memory/propagation/propagateKnowledge';
import { AgentRegistry } from '../../../src/memory/propagation/AgentRegistry';
import { KnowledgeStore } from '../../../src/memory/KnowledgeStore';
import { DefaultPropagationPolicy } from '../../../src/memory/propagation/DefaultPropagationPolicy';
import type { CampaignEvent } from '../../../src/memory/contracts';

function createEvent(overrides: Partial<CampaignEvent> = {}): CampaignEvent {
  return {
    id: 'evt_1',
    sequence: 1,
    turn: 1,
    type: 'PLAYER_ACTION',
    actorIds: ['player'],
    subjectIds: [],
    action: 'test',
    outcome: 'SUCCESS',
    stateChanges: [],
    significance: 'MEDIUM',
    visibility: 'PUBLIC',
    summary: 'Test event',
    timestamp: '2026-01-01T00:00:00Z',
    hash: 'hash_1',
    ...overrides,
  };
}

describe('propagateKnowledge', () => {
  it('should propagate knowledge and write to store', () => {
    const registry = new AgentRegistry();
    const store = new KnowledgeStore();
    const event = createEvent();

    const result = propagateKnowledge(event, registry, store, 1);

    expect(result.eventId).toBe('evt_1');
    expect(result.recordsCreated).toBeGreaterThan(0);
    expect(store.size()).toBe(result.recordsCreated);
  });

  it('should use default policy when none provided', () => {
    const registry = new AgentRegistry();
    const store = new KnowledgeStore();
    const event = createEvent();

    const result = propagateKnowledge(event, registry, store, 1);

    expect(result.recordsCreated).toBe(1); // Only player for PUBLIC event
  });

  it('should use custom policies when provided', () => {
    const registry = new AgentRegistry();
    const store = new KnowledgeStore();
    const event = createEvent();

    const customPolicy = new DefaultPropagationPolicy();
    const result = propagateKnowledge(event, registry, store, 1, {
      policies: [customPolicy],
    });

    expect(result.recordsCreated).toBeGreaterThan(0);
  });

  it('should return empty result for trivial events', () => {
    const registry = new AgentRegistry();
    const store = new KnowledgeStore();
    const event = createEvent({ significance: 'TRIVIAL' });

    const result = propagateKnowledge(event, registry, store, 1);

    expect(result.recordsCreated).toBe(0);
    expect(store.size()).toBe(0);
  });

  it('should create records with correct structure', () => {
    const registry = new AgentRegistry();
    const store = new KnowledgeStore();
    const event = createEvent();

    const result = propagateKnowledge(event, registry, store, 1);

    expect(result.records[0].agentId).toBe('player');
    expect(result.records[0].factId).toBe('fact_event_evt_1');
    expect(result.records[0].value).toBe('Test event');
    expect(result.records[0].obtainedTurn).toBe(1);
  });
});

describe('propagateKnowledgeFromEvents', () => {
  it('should propagate multiple events', () => {
    const registry = new AgentRegistry();
    const store = new KnowledgeStore();

    const events = [
      createEvent({ id: 'evt_1' }),
      createEvent({ id: 'evt_2' }),
      createEvent({ id: 'evt_3' }),
    ];

    const results = propagateKnowledgeFromEvents(events, registry, store, 1);

    expect(results).toHaveLength(3);
    expect(store.size()).toBe(3);
  });

  it('should handle empty events array', () => {
    const registry = new AgentRegistry();
    const store = new KnowledgeStore();

    const results = propagateKnowledgeFromEvents([], registry, store, 1);

    expect(results).toHaveLength(0);
    expect(store.size()).toBe(0);
  });
});

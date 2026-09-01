/**
 * MEM-003 — DefaultPropagationPolicy Tests
 */

import { describe, it, expect } from 'vitest';
import { DefaultPropagationPolicy } from '../../../src/memory/propagation/DefaultPropagationPolicy';
import type { CampaignEvent, KnowledgePropagationContext } from '../../../src/memory/contracts';

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

function createContext(overrides: Partial<KnowledgePropagationContext> = {}): KnowledgePropagationContext {
  return {
    agents: [
      { agentId: 'player', knowledgeAccess: 'FULL' },
      { agentId: 'advisor_counselor', knowledgeAccess: 'DOMAIN' },
      { agentId: 'house_1', knowledgeAccess: 'LIMITED' },
    ],
    currentTurn: 1,
    ...overrides,
  };
}

describe('DefaultPropagationPolicy', () => {
  it('should propagate PUBLIC events to all agents', () => {
    const policy = new DefaultPropagationPolicy();
    const event = createEvent({ visibility: 'PUBLIC' });
    const context = createContext();

    const records = policy.evaluate(event, context);

    expect(records).toHaveLength(3);
    expect(records[0].agentId).toBe('player');
    expect(records[1].agentId).toBe('advisor_counselor');
    expect(records[2].agentId).toBe('house_1');
  });

  it('should propagate PRIVATE events only to FULL access agents', () => {
    const policy = new DefaultPropagationPolicy();
    const event = createEvent({ visibility: 'PRIVATE' });
    const context = createContext();

    const records = policy.evaluate(event, context);

    expect(records).toHaveLength(1);
    expect(records[0].agentId).toBe('player');
  });

  it('should propagate SECRET events only to FULL access agents', () => {
    const policy = new DefaultPropagationPolicy();
    const event = createEvent({ visibility: 'SECRET' });
    const context = createContext();

    const records = policy.evaluate(event, context);

    expect(records).toHaveLength(1);
    expect(records[0].agentId).toBe('player');
  });

  it('should propagate CLASSIFIED events to FULL and DOMAIN agents', () => {
    const policy = new DefaultPropagationPolicy();
    const event = createEvent({ visibility: 'RUMOR' }); // RUMOR maps to CLASSIFIED
    const context = createContext();

    const records = policy.evaluate(event, context);

    expect(records).toHaveLength(2);
    expect(records[0].agentId).toBe('player');
    expect(records[1].agentId).toBe('advisor_counselor');
  });

  it('should skip TRIVIAL events', () => {
    const policy = new DefaultPropagationPolicy();
    const event = createEvent({ significance: 'TRIVIAL' });
    const context = createContext();

    const records = policy.evaluate(event, context);

    expect(records).toHaveLength(0);
  });

  it('should propagate world events to player', () => {
    const policy = new DefaultPropagationPolicy();
    const event = createEvent({
      type: 'ENGINE_TURN',
      actorIds: [],
      subjectIds: [],
    });
    const context = createContext();

    const records = policy.evaluate(event, context);

    expect(records).toHaveLength(1);
    expect(records[0].agentId).toBe('player');
  });

  it('should propagate events to subjects', () => {
    const policy = new DefaultPropagationPolicy();
    const event = createEvent({
      subjectIds: ['house_1'],
    });
    const context = createContext();

    const records = policy.evaluate(event, context);

    // house_1 is a subject, so it should know
    const house1Record = records.find(r => r.agentId === 'house_1');
    expect(house1Record).toBeDefined();
  });

  it('should set correct source based on event type', () => {
    const policy = new DefaultPropagationPolicy();
    const event = createEvent({ type: 'PLAYER_ACTION' });
    const context = createContext();

    const records = policy.evaluate(event, context);

    expect(records[0].source).toBe('DIRECT_OBSERVATION');
  });

  it('should set correct certainty based on significance', () => {
    const policy = new DefaultPropagationPolicy();
    const event = createEvent({ significance: 'CRITICAL' });
    const context = createContext();

    const records = policy.evaluate(event, context);

    expect(records[0].certainty).toBe('CONFIRMED');
  });

  it('should set correct visibility from event', () => {
    const policy = new DefaultPropagationPolicy();
    const event = createEvent({ visibility: 'SECRET' });
    const context = createContext();

    const records = policy.evaluate(event, context);

    expect(records[0].visibility).toBe('SECRET');
  });
});

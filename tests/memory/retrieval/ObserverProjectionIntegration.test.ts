/**
 * MEM-004 — ObserverProjection Retrieval Integration Tests
 */

import { describe, it, expect } from 'vitest';
import { createObserverProjection } from '../../../src/lib/narrativeProjection';
import type { RetrievalResult } from '../../../src/memory/retrieval/ContextRetrievalService';
import type { MemoryRecord } from '../../../src/memory/contracts';

function createMockState(): any {
  return {
    character: {
      name: 'Aldric',
      house: 'Stormborn',
      archetype: 'Noble Ruler',
      location: {
        landmark: 'Iron Keep',
        region: 'Central Plains',
      },
    },
    weeklyLedger: {
      year: 1247,
      week: 1,
      season: 'Thawtide',
      weather: 'Cold',
      silverdew: 500,
      food: 200,
    },
    worldLedger: {
      currentDate: { year: 1247, week: 1 },
      activeConflicts: [],
      majorEvents: [],
      nobleHouses: [],
    },
    sessionLog: {
      pendingConsequences: [],
    },
    eventStore: [],
  };
}

describe('createObserverProjection with retrieval', () => {
  it('should include retrieved memories as facts', () => {
    const state = createMockState();

    const memories: MemoryRecord[] = [{
      id: 'mem_1',
      ownerId: 'player',
      subjectId: 'house_1',
      eventType: 'PLAYER_ACTION',
      description: 'Memory about house',
      importance: 5,
      tickRegistered: 1,
      decayed: false,
      source: 'OBSERVED',
      tags: [],
    }];

    const retrievalResult: RetrievalResult = {
      memories,
      knowledge: [],
      status: 'PARTIAL',
      query: { agentId: 'player' },
    };

    const projection = createObserverProjection(
      state,
      { kind: 'PLAYER', observerId: 'player' },
      undefined,
      retrievalResult,
    );

    // Should have at least one fact from the memory
    const memoryFact = projection.knownFacts.find(f => f.factId === 'memory_mem_1');
    expect(memoryFact).toBeDefined();
    expect(memoryFact!.statement).toBe('Memory about house');
    expect(memoryFact!.tier).toBe('CHARACTER_KNOWLEDGE');
  });

  it('should work without retrieval result', () => {
    const state = createMockState();

    const projection = createObserverProjection(
      state,
      { kind: 'PLAYER', observerId: 'player' },
    );

    expect(projection.knownFacts).toBeDefined();
    expect(projection.knownFacts.length).toBeGreaterThanOrEqual(0);
  });

  it('should include multiple memories as facts', () => {
    const state = createMockState();

    const memories: MemoryRecord[] = [
      {
        id: 'mem_1',
        ownerId: 'player',
        subjectId: 'house_1',
        eventType: 'PLAYER_ACTION',
        description: 'Memory 1',
        importance: 5,
        tickRegistered: 1,
        decayed: false,
        source: 'OBSERVED',
        tags: [],
      },
      {
        id: 'mem_2',
        ownerId: 'player',
        subjectId: 'house_2',
        eventType: 'PLAYER_ACTION',
        description: 'Memory 2',
        importance: 5,
        tickRegistered: 2,
        decayed: false,
        source: 'OBSERVED',
        tags: [],
      },
    ];

    const retrievalResult: RetrievalResult = {
      memories,
      knowledge: [],
      status: 'PARTIAL',
      query: { agentId: 'player' },
    };

    const projection = createObserverProjection(
      state,
      { kind: 'PLAYER', observerId: 'player' },
      undefined,
      retrievalResult,
    );

    const memoryFact1 = projection.knownFacts.find(f => f.factId === 'memory_mem_1');
    const memoryFact2 = projection.knownFacts.find(f => f.factId === 'memory_mem_2');

    expect(memoryFact1).toBeDefined();
    expect(memoryFact2).toBeDefined();
    expect(memoryFact1!.statement).toBe('Memory 1');
    expect(memoryFact2!.statement).toBe('Memory 2');
  });
});

/**
 * MEM-004 — NarrativeContext Extension Tests
 */

import { describe, it, expect } from 'vitest';
import { createNarrativeContext } from '../../../src/lib/narrativeContracts';
import type { ObserverProjection, ExecutionReport } from '../../../src/lib/narrativeContracts';
import type { MemoryRecord as MemRecord, KnowledgeRecord as KnowRecord } from '../../../src/memory/contracts';

function createMockProjection(): ObserverProjection {
  return {
    contractVersion: 1,
    observer: { kind: 'PLAYER', observerId: 'player' },
    scene: {
      locationId: 'loc_1',
      regionName: 'Region',
      environment: 'Environment',
      weather: 'Weather',
      season: 'Thawtide',
    },
    actors: [],
    relationships: [],
    knownFacts: [],
    recentEvents: [],
    narrativeConstraints: [],
  };
}

function createMockExecutionReport(): ExecutionReport {
  return {
    contractVersion: 1,
    reportId: 'report_1',
    command: { commandId: 'cmd_1', actorId: 'player', action: 'INFORMATION' },
    status: 'ACCEPTED',
    actionExecuted: 'INFORMATION',
    affectedEntities: [],
    stateChanges: [],
    consequences: [],
    discoveredInformation: [],
    hiddenInformationIds: [],
    events: [],
    reasonCode: 'TEST',
  };
}

describe('NarrativeContext extension', () => {
  it('should create context with retrieved memories', () => {
    const projection = createMockProjection();
    const report = createMockExecutionReport();

    const memories: MemRecord[] = [{
      id: 'mem_1',
      ownerId: 'player',
      subjectId: 'house_1',
      eventType: 'PLAYER_ACTION',
      description: 'Test memory',
      importance: 5,
      tickRegistered: 1,
      decayed: false,
      source: 'OBSERVED',
      tags: [],
    }];

    const context = {
      ...createNarrativeContext(projection, report),
      retrievedMemories: memories,
      retrievedKnowledge: [],
      retrievalStatus: 'PARTIAL' as const,
    };

    expect(context.retrievedMemories).toHaveLength(1);
    expect(context.retrievalStatus).toBe('PARTIAL');
  });

  it('should create context with retrieved knowledge', () => {
    const projection = createMockProjection();
    const report = createMockExecutionReport();

    const knowledge: KnowRecord[] = [{
      id: 'kno_1',
      agentId: 'player',
      factId: 'fact_1',
      value: 'test',
      source: 'DIRECT_OBSERVATION',
      certainty: 'CONFIRMED',
      obtainedTurn: 1,
      lastVerifiedTurn: 1,
      visibility: 'PUBLIC',
    }];

    const context = {
      ...createNarrativeContext(projection, report),
      retrievedMemories: [],
      retrievedKnowledge: knowledge,
      retrievalStatus: 'PARTIAL' as const,
    };

    expect(context.retrievedKnowledge).toHaveLength(1);
    expect(context.retrievalStatus).toBe('PARTIAL');
  });

  it('should create context with both memories and knowledge', () => {
    const projection = createMockProjection();
    const report = createMockExecutionReport();

    const memories: MemRecord[] = [{
      id: 'mem_1',
      ownerId: 'player',
      subjectId: 'house_1',
      eventType: 'PLAYER_ACTION',
      description: 'Test memory',
      importance: 5,
      tickRegistered: 1,
      decayed: false,
      source: 'OBSERVED',
      tags: [],
    }];

    const knowledge: KnowRecord[] = [{
      id: 'kno_1',
      agentId: 'player',
      factId: 'fact_1',
      value: 'test',
      source: 'DIRECT_OBSERVATION',
      certainty: 'CONFIRMED',
      obtainedTurn: 1,
      lastVerifiedTurn: 1,
      visibility: 'PUBLIC',
    }];

    const context = {
      ...createNarrativeContext(projection, report),
      retrievedMemories: memories,
      retrievedKnowledge: knowledge,
      retrievalStatus: 'FOUND' as const,
    };

    expect(context.retrievedMemories).toHaveLength(1);
    expect(context.retrievedKnowledge).toHaveLength(1);
    expect(context.retrievalStatus).toBe('FOUND');
  });
});

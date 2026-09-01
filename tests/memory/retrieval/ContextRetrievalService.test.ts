/**
 * MEM-004 — ContextRetrievalService Tests
 */

import { describe, it, expect } from 'vitest';
import { ContextRetrievalService } from '../../../src/memory/retrieval/ContextRetrievalService';
import { MemoryStore } from '../../../src/memory/MemoryStore';
import { KnowledgeStore } from '../../../src/memory/KnowledgeStore';

describe('ContextRetrievalService', () => {
  it('should retrieve memories by subject', () => {
    const memoryStore = new MemoryStore();
    const knowledgeStore = new KnowledgeStore();
    const service = new ContextRetrievalService(memoryStore, knowledgeStore);

    memoryStore.add({ ownerId: 'player', subjectId: 'house_1', eventType: 'PLAYER_ACTION', description: 'Test', importance: 5, tickRegistered: 1, source: 'OBSERVED' });

    const result = service.retrieve({ agentId: 'player', subjectId: 'house_1' });

    expect(result.memories).toHaveLength(1);
    expect(result.knowledge).toHaveLength(0);
    expect(result.status).toBe('PARTIAL');
  });

  it('should retrieve knowledge by agent and subject', () => {
    const memoryStore = new MemoryStore();
    const knowledgeStore = new KnowledgeStore();
    const service = new ContextRetrievalService(memoryStore, knowledgeStore);

    knowledgeStore.add({ agentId: 'player', factId: 'fact_1', value: 'test', source: 'DIRECT_OBSERVATION', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PUBLIC' });

    const result = service.retrieve({ agentId: 'player', subjectId: 'fact_1' });

    expect(result.memories).toHaveLength(0);
    expect(result.knowledge).toHaveLength(1);
    expect(result.status).toBe('PARTIAL');
  });

  it('should retrieve both memories and knowledge', () => {
    const memoryStore = new MemoryStore();
    const knowledgeStore = new KnowledgeStore();
    const service = new ContextRetrievalService(memoryStore, knowledgeStore);

    memoryStore.add({ ownerId: 'player', subjectId: 'house_1', eventType: 'PLAYER_ACTION', description: 'Memory', importance: 5, tickRegistered: 1, source: 'OBSERVED' });
    knowledgeStore.add({ agentId: 'player', factId: 'house_1', value: 'Knowledge', source: 'DIRECT_OBSERVATION', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PUBLIC' });

    const result = service.retrieve({ agentId: 'player', subjectId: 'house_1' });

    expect(result.memories).toHaveLength(1);
    expect(result.knowledge).toHaveLength(1);
    expect(result.status).toBe('FOUND');
  });

  it('should return NONE when no results', () => {
    const memoryStore = new MemoryStore();
    const knowledgeStore = new KnowledgeStore();
    const service = new ContextRetrievalService(memoryStore, knowledgeStore);

    const result = service.retrieve({ agentId: 'player', subjectId: 'nonexistent' });

    expect(result.memories).toHaveLength(0);
    expect(result.knowledge).toHaveLength(0);
    expect(result.status).toBe('NONE');
  });

  it('should retrieve by tags', () => {
    const memoryStore = new MemoryStore();
    const knowledgeStore = new KnowledgeStore();
    const service = new ContextRetrievalService(memoryStore, knowledgeStore);

    memoryStore.add({ ownerId: 'player', subjectId: 'a', eventType: 'PLAYER_ACTION', description: 'Test', importance: 5, tickRegistered: 1, source: 'OBSERVED', tags: ['diplomacy'] });

    const result = service.retrieve({ agentId: 'player', tags: ['diplomacy'] });

    expect(result.memories).toHaveLength(1);
    expect(result.status).toBe('PARTIAL');
  });

  it('should apply limit', () => {
    const memoryStore = new MemoryStore();
    const knowledgeStore = new KnowledgeStore();
    const service = new ContextRetrievalService(memoryStore, knowledgeStore);

    memoryStore.add({ ownerId: 'player', subjectId: 'a', eventType: 'PLAYER_ACTION', description: 'Test1', importance: 5, tickRegistered: 1, source: 'OBSERVED', tags: ['tag'] });
    memoryStore.add({ ownerId: 'player', subjectId: 'b', eventType: 'PLAYER_ACTION', description: 'Test2', importance: 5, tickRegistered: 1, source: 'OBSERVED', tags: ['tag'] });
    memoryStore.add({ ownerId: 'player', subjectId: 'c', eventType: 'PLAYER_ACTION', description: 'Test3', importance: 5, tickRegistered: 1, source: 'OBSERVED', tags: ['tag'] });

    const result = service.retrieve({ agentId: 'player', tags: ['tag'], limit: 2 });

    expect(result.memories).toHaveLength(2);
  });

  it('should apply temporal scope', () => {
    const memoryStore = new MemoryStore();
    const knowledgeStore = new KnowledgeStore();
    const service = new ContextRetrievalService(memoryStore, knowledgeStore);

    memoryStore.add({ ownerId: 'player', subjectId: 'a', eventType: 'PLAYER_ACTION', description: 'Old', importance: 5, tickRegistered: 1, source: 'OBSERVED' });
    memoryStore.add({ ownerId: 'player', subjectId: 'b', eventType: 'PLAYER_ACTION', description: 'New', importance: 5, tickRegistered: 10, source: 'OBSERVED' });

    const result = service.retrieve({
      agentId: 'player',
      temporalScope: { mode: 'HISTORICAL_POINT', targetTurn: 5 },
    });

    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].description).toBe('Old');
  });
});

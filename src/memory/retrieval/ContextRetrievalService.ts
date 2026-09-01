/**
 * MEM-004 — ContextRetrievalService
 *
 * Orchestrates retrieval of memories and knowledge from stores.
 * Given a query context, retrieves relevant data and returns a structured result.
 */

import type {
  MemoryRecord,
  KnowledgeRecord,
} from '../contracts';
import type { MemoryStore } from '../MemoryStore';
import type { KnowledgeStore } from '../KnowledgeStore';

export interface RetrievalQuery {
  readonly agentId: string;
  readonly subjectId?: string;
  readonly tags?: readonly string[];
  readonly temporalScope?: {
    mode: 'CURRENT_STATE' | 'HISTORICAL_POINT' | 'TEMPORAL_EVOLUTION';
    targetTurn?: number;
  };
  readonly limit?: number;
}

export interface RetrievalResult {
  readonly memories: readonly MemoryRecord[];
  readonly knowledge: readonly KnowledgeRecord[];
  readonly status: 'FOUND' | 'PARTIAL' | 'NONE';
  readonly query: RetrievalQuery;
}

/**
 * ContextRetrievalService — orchestrates memory and knowledge retrieval.
 *
 * This service is deterministic: given the same stores and query,
 * it always returns the same result.
 */
export class ContextRetrievalService {
  private _memoryStore: MemoryStore;
  private _knowledgeStore: KnowledgeStore;

  constructor(memoryStore: MemoryStore, knowledgeStore: KnowledgeStore) {
    this._memoryStore = memoryStore;
    this._knowledgeStore = knowledgeStore;
  }

  /**
   * Retrieve memories and knowledge for a query.
   */
  retrieve(query: RetrievalQuery): RetrievalResult {
    const memories = this.retrieveMemories(query);
    const knowledge = this.retrieveKnowledge(query);

    const status = this.determineStatus(memories, knowledge);

    return {
      memories,
      knowledge,
      status,
      query,
    };
  }

  /**
   * Retrieve memories based on query parameters.
   */
  private retrieveMemories(query: RetrievalQuery): readonly MemoryRecord[] {
    let results: readonly MemoryRecord[] = [];

    // Query by subject if specified
    if (query.subjectId) {
      results = this._memoryStore.queryBySubject(query.subjectId, query.temporalScope);
    }

    // Query by tags if specified
    if (query.tags && query.tags.length > 0) {
      const tagResults = this._memoryStore.queryByTags(query.tags, query.temporalScope);
      // Merge with existing results, deduplicating by ID
      const existingIds = new Set(results.map(r => r.id));
      const merged = [...results];
      for (const record of tagResults) {
        if (!existingIds.has(record.id)) {
          merged.push(record);
        }
      }
      results = merged;
    }

    // If no subject or tags, filter by owner
    if (!query.subjectId && (!query.tags || query.tags.length === 0)) {
      results = this._memoryStore.getByOwner(query.agentId);
      // Apply temporal filter
      if (query.temporalScope) {
        const allResults = results;
        switch (query.temporalScope.mode) {
          case 'HISTORICAL_POINT':
            results = allResults.filter(r =>
              r.tickRegistered <= (query.temporalScope!.targetTurn ?? 0)
            );
            break;
          case 'TEMPORAL_EVOLUTION':
            // All results
            break;
          case 'CURRENT_STATE':
          default:
            results = allResults.filter(r => !r.decayed);
            break;
        }
      }
    }

    // Apply limit
    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Retrieve knowledge based on query parameters.
   */
  private retrieveKnowledge(query: RetrievalQuery): readonly KnowledgeRecord[] {
    let results: readonly KnowledgeRecord[] = [];

    // Query by agent and subject if specified
    if (query.subjectId) {
      results = this._knowledgeStore.queryByAgentAndSubject(
        query.agentId,
        query.subjectId,
        query.temporalScope,
      );
    } else {
      // Query all knowledge for agent
      results = this._knowledgeStore.getByAgent(query.agentId);
      // Apply temporal filter
      if (query.temporalScope) {
        const allResults = results;
        switch (query.temporalScope.mode) {
          case 'HISTORICAL_POINT':
            results = allResults.filter(r =>
              r.obtainedTurn <= (query.temporalScope!.targetTurn ?? 0)
            );
            break;
          case 'TEMPORAL_EVOLUTION':
            // All results
            break;
          case 'CURRENT_STATE':
          default:
            // Filter out superseded
            const supersededIds = new Set(
              allResults.filter(r => r.supersedes).map(r => r.supersedes!)
            );
            results = allResults.filter(r => !supersededIds.has(r.id));
            break;
        }
      }
    }

    // Apply limit
    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Determine retrieval status based on results.
   */
  private determineStatus(
    memories: readonly MemoryRecord[],
    knowledge: readonly KnowledgeRecord[],
  ): 'FOUND' | 'PARTIAL' | 'NONE' {
    const total = memories.length + knowledge.length;
    if (total === 0) return 'NONE';
    if (memories.length === 0 || knowledge.length === 0) return 'PARTIAL';
    return 'FOUND';
  }
}

/**
 * Create a ContextRetrievalService.
 */
export function createContextRetrievalService(
  memoryStore: MemoryStore,
  knowledgeStore: KnowledgeStore,
): ContextRetrievalService {
  return new ContextRetrievalService(memoryStore, knowledgeStore);
}

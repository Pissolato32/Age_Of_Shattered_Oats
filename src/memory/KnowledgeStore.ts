/**
 * MEM-002 — KnowledgeStore
 *
 * Store for KnowledgeRecords with supersedes versioning.
 * Follows the MEM-001 contract: knowledge records are immutable after creation.
 */

import type {
  KnowledgeRecord,
  KnowledgeSource,
  KnowledgeCertainty,
  KnowledgeVisibility,
  StateValue,
} from './contracts';

let knowledgeIdCounter = 0;

function generateKnowledgeId(): string {
  return `kno_${++knowledgeIdCounter}_${Date.now()}`;
}

export interface KnowledgeStoreInit {
  readonly records?: readonly KnowledgeRecord[];
  readonly idCounter?: number;
}

/**
 * KnowledgeStore — manages what agents know about the world.
 *
 * Invariants:
 * - Knowledge records are immutable after creation.
 * - supersedes creates a new record, never mutates the old.
 * - Only one "current" record per (agentId, factId) pair.
 */
export class KnowledgeStore implements Iterable<KnowledgeRecord> {
  private _records: KnowledgeRecord[] = [];

  constructor(init?: KnowledgeStoreInit) {
    if (init?.records) {
      this._records = [...init.records];
    }
    if (init?.idCounter) {
      knowledgeIdCounter = init.idCounter;
    }
  }

  /**
   * Add a new knowledge record.
   */
  add(params: {
    agentId: string;
    factId: string;
    value: StateValue;
    source: KnowledgeSource;
    certainty: KnowledgeCertainty;
    obtainedTurn: number;
    lastVerifiedTurn: number;
    visibility: KnowledgeVisibility;
  }): KnowledgeRecord {
    const record: KnowledgeRecord = {
      id: generateKnowledgeId(),
      agentId: params.agentId,
      factId: params.factId,
      value: params.value,
      source: params.source,
      certainty: params.certainty,
      obtainedTurn: params.obtainedTurn,
      lastVerifiedTurn: params.lastVerifiedTurn,
      visibility: params.visibility,
    };

    this._records.push(record);
    return record;
  }

  /**
   * Get all knowledge records for a given agent.
   */
  getByAgent(agentId: string): readonly KnowledgeRecord[] {
    return this._records.filter(r => r.agentId === agentId);
  }

  /**
   * Get all knowledge records for a given fact.
   */
  getByFact(factId: string): readonly KnowledgeRecord[] {
    return this._records.filter(r => r.factId === factId);
  }

  /**
   * Get the current (most recent) knowledge record for an agent about a fact.
   * A record is "current" if no other record supersedes it.
   */
  getCorrente(agentId: string, factId: string): KnowledgeRecord | undefined {
    const forFact = this._records.filter(r => r.agentId === agentId && r.factId === factId);

    // Find the most recent record that is not superseded
    const supersededIds = new Set(
      forFact.filter(r => r.supersedes).map(r => r.supersedes!)
    );

    const current = forFact.filter(r => !supersededIds.has(r.id));

    // Return the most recent one
    if (current.length === 0) return undefined;
    return current.reduce((a, b) =>
      a.obtainedTurn >= b.obtainedTurn ? a : b
    );
  }

  /**
   * Create a new knowledge record that supersedes a previous one.
   * The previous record is NOT modified.
   */
  supersedes(
    newRecord: {
      agentId: string;
      factId: string;
      value: StateValue;
      source: KnowledgeSource;
      certainty: KnowledgeCertainty;
      obtainedTurn: number;
      lastVerifiedTurn: number;
      visibility: KnowledgeVisibility;
    },
    previousId: string
  ): KnowledgeRecord {
    const previous = this.getById(previousId);
    if (!previous) {
      throw new Error(`Knowledge record ${previousId} not found for supersession`);
    }

    if (previous.agentId !== newRecord.agentId || previous.factId !== newRecord.factId) {
      throw new Error(`Supersession requires matching agentId and factId`);
    }

    const record: KnowledgeRecord = {
      id: generateKnowledgeId(),
      agentId: newRecord.agentId,
      factId: newRecord.factId,
      value: newRecord.value,
      source: newRecord.source,
      certainty: newRecord.certainty,
      obtainedTurn: newRecord.obtainedTurn,
      lastVerifiedTurn: newRecord.lastVerifiedTurn,
      visibility: newRecord.visibility,
      supersedes: previousId,
    };

    this._records.push(record);
    return record;
  }

  /**
   * Get all knowledge records in a chain (original + supersessions).
   */
  getChain(factId: string, agentId: string): readonly KnowledgeRecord[] {
    const forFact = this._records.filter(r => r.agentId === agentId && r.factId === factId);
    if (forFact.length === 0) return [];

    // Find the root (record with no supersedes)
    const roots = forFact.filter(r => !r.supersedes);
    if (roots.length === 0) return forFact;

    // Build chain from root
    const chain: KnowledgeRecord[] = [];
    const current = roots[0];
    chain.push(current);

    let next = forFact.find(r => r.supersedes === current.id);
    while (next) {
      chain.push(next);
      next = forFact.find(r => r.supersedes === next!.id);
    }

    return chain;
  }

  /**
   * Get a knowledge record by its ID.
   */
  getById(id: string): KnowledgeRecord | undefined {
    return this._records.find(r => r.id === id);
  }

  /**
   * Get the number of records.
   */
  size(): number {
    return this._records.length;
  }

  /**
   * Clear all records.
   */
  clear(): void {
    this._records = [];
  }

  /**
   * Convert to plain array (for serialization).
   */
  toArray(): readonly KnowledgeRecord[] {
    return [...this._records];
  }

  /**
   * Iterator support.
   */
  [Symbol.iterator](): Iterator<KnowledgeRecord> {
    return this._records[Symbol.iterator]();
  }
}

/**
 * Create a KnowledgeStore from an array of KnowledgeRecords.
 * Used for deserialization.
 */
export function createKnowledgeStoreFromRecords(records: readonly KnowledgeRecord[]): KnowledgeStore {
  return new KnowledgeStore({ records });
}

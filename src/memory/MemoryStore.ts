/**
 * MEM-002 — MemoryStore
 *
 * Store for MemoryRecords with decay and correctionOf versioning.
 * Follows the MEM-001 contract: memories are immutable after creation.
 */

import type {
  MemoryRecord,
  MemorySource,
  EventType,
} from './contracts';

let memoryIdCounter = 0;

function generateMemoryId(): string {
  return `mem_${++memoryIdCounter}_${Date.now()}`;
}

export interface MemoryStoreInit {
  readonly records?: readonly MemoryRecord[];
  readonly idCounter?: number;
}

/**
 * MemoryStore — manages agent memories.
 *
 * Invariants:
 * - Memories are immutable after creation.
 * - correctionOf creates a new record, never mutates the original.
 * - Decay is computed as importance × 30 ticks.
 */
export class MemoryStore implements Iterable<MemoryRecord> {
  private _records: MemoryRecord[] = [];

  constructor(init?: MemoryStoreInit) {
    if (init?.records) {
      this._records = [...init.records];
    }
    if (init?.idCounter) {
      memoryIdCounter = init.idCounter;
    }
  }

  /**
   * Add a new memory record.
   */
  add(params: {
    ownerId: string;
    subjectId: string;
    eventType: EventType;
    description: string;
    importance: number;
    tickRegistered: number;
    source: MemorySource;
    tags?: readonly string[];
    structuredData?: MemoryRecord['structuredData'];
  }): MemoryRecord {
    const record: MemoryRecord = {
      id: generateMemoryId(),
      ownerId: params.ownerId,
      subjectId: params.subjectId,
      eventType: params.eventType,
      description: params.description,
      importance: Math.max(1, Math.min(10, params.importance)),
      tickRegistered: params.tickRegistered,
      decayed: false,
      source: params.source,
      tags: params.tags ?? [],
      structuredData: params.structuredData,
    };

    this._records.push(record);
    return record;
  }

  /**
   * Get all memories for a given owner.
   */
  getByOwner(ownerId: string): readonly MemoryRecord[] {
    return this._records.filter(r => r.ownerId === ownerId);
  }

  /**
   * Get all memories about a given subject.
   */
  getBySubject(subjectId: string): readonly MemoryRecord[] {
    return this._records.filter(r => r.subjectId === subjectId);
  }

  /**
   * Get all memories for a given owner about a given subject.
   */
  getByOwnerAndSubject(ownerId: string, subjectId: string): readonly MemoryRecord[] {
    return this._records.filter(r => r.ownerId === ownerId && r.subjectId === subjectId);
  }

  /**
   * Get all non-decayed memories for an owner.
   */
  getActive(ownerId: string): readonly MemoryRecord[] {
    return this._records.filter(r => r.ownerId === ownerId && !r.decayed);
  }

  /**
   * Get a memory by its ID.
   */
  getById(id: string): MemoryRecord | undefined {
    return this._records.find(r => r.id === id);
  }

  /**
   * Evaluate decay for all memories at the current tick.
   * Returns the number of newly decayed memories.
   */
  evaluateDecay(currentTick: number): number {
    let newlyDecayed = 0;

    for (const record of this._records) {
      if (record.decayed) continue;

      const elapsed = currentTick - record.tickRegistered;
      const limit = record.importance * 30;

      if (elapsed >= limit) {
        // We need to create a new record since the type is immutable
        const index = this._records.indexOf(record);
        if (index !== -1) {
          const decayedRecord: MemoryRecord = { ...record, decayed: true };
          this._records[index] = decayedRecord;
          newlyDecayed++;
        }
      }
    }

    return newlyDecayed;
  }

  /**
   * Create a correction record that supersedes an original.
   * The original is NOT modified.
   */
  correctionOf(
    correction: {
      ownerId: string;
      subjectId: string;
      eventType: EventType;
      description: string;
      importance: number;
      tickRegistered: number;
      source: MemorySource;
      tags?: readonly string[];
      structuredData?: MemoryRecord['structuredData'];
    },
    originalId: string
  ): MemoryRecord {
    const original = this.getById(originalId);
    if (!original) {
      throw new Error(`Memory ${originalId} not found for correction`);
    }

    const correctedRecord: MemoryRecord = {
      id: generateMemoryId(),
      ownerId: correction.ownerId,
      subjectId: correction.subjectId,
      eventType: correction.eventType,
      description: correction.description,
      importance: Math.max(1, Math.min(10, correction.importance)),
      tickRegistered: correction.tickRegistered,
      decayed: false,
      source: correction.source,
      tags: correction.tags ?? [],
      structuredData: correction.structuredData,
      correctionOf: originalId,
    };

    this._records.push(correctedRecord);
    return correctedRecord;
  }

  /**
   * Get all memories that are corrections of a given original.
   */
  getCorrections(originalId: string): readonly MemoryRecord[] {
    return this._records.filter(r => r.correctionOf === originalId);
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
  toArray(): readonly MemoryRecord[] {
    return [...this._records];
  }

  /**
   * Iterator support.
   */
  [Symbol.iterator](): Iterator<MemoryRecord> {
    return this._records[Symbol.iterator]();
  }
}

/**
 * Create a MemoryStore from an array of MemoryRecords.
 * Used for deserialization.
 */
export function createMemoryStoreFromRecords(records: readonly MemoryRecord[]): MemoryStore {
  return new MemoryStore({ records });
}

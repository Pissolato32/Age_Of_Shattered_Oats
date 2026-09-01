/**
 * MEM-002 — RelationshipStore
 *
 * Store for RelationshipRecords with atomic replacement and delta application.
 * Follows the MEM-001 contract: relationships are replaced atomically, never mutated.
 */

import type {
  RelationshipRecord,
  RelationshipDimensions,
  RelationshipType,
  RelationshipEvent,
} from './contracts';

let relationshipIdCounter = 0;

function generateRelationshipId(sourceId: string, targetId: string): string {
  return `rel_${sourceId}_${targetId}_${++relationshipIdCounter}`;
}

export interface RelationshipStoreInit {
  readonly records?: readonly RelationshipRecord[];
  readonly idCounter?: number;
}

const DIMENSION_KEYS: readonly (keyof RelationshipDimensions)[] = [
  'trust', 'loyalty', 'hostility', 'debt', 'influence', 'kinship'
];

const DIMENSION_LIMITS: Record<keyof RelationshipDimensions, { min: number; max: number }> = {
  trust: { min: -10, max: 10 },
  loyalty: { min: -10, max: 10 },
  hostility: { min: -10, max: 10 },
  debt: { min: -10, max: 10 },
  influence: { min: -10, max: 10 },
  kinship: { min: -10, max: 10 },
};

/**
 * Clamp a value to its allowed range.
 */
function clampDimension(value: number, dim: keyof RelationshipDimensions): number {
  const limits = DIMENSION_LIMITS[dim];
  return Math.max(limits.min, Math.min(limits.max, Math.round(value)));
}

/**
 * Apply a delta to a set of dimensions, clamping each.
 */
export function applyRelationshipDelta(
  current: RelationshipDimensions,
  delta: Partial<RelationshipDimensions>,
): RelationshipDimensions {
  const result = { ...current };

  for (const key of DIMENSION_KEYS) {
    if (key in delta && delta[key] !== undefined) {
      result[key] = clampDimension(current[key] + delta[key]!, key as keyof RelationshipDimensions);
    }
  }

  return result;
}

/**
 * RelationshipStore — manages structured relationships between agents.
 *
 * Invariants:
 * - Relationships are replaced atomically, never mutated in place.
 * - All dimension values are clamped to [-10, +10].
 * - applyRelationshipDelta is a pure function.
 */
export class RelationshipStore implements Iterable<RelationshipRecord> {
  private _records: RelationshipRecord[] = [];

  constructor(init?: RelationshipStoreInit) {
    if (init?.records) {
      this._records = [...init.records];
    }
    if (init?.idCounter) {
      relationshipIdCounter = init.idCounter;
    }
  }

  /**
   * Get a relationship record between two agents.
   */
  get(sourceId: string, targetId: string): RelationshipRecord | undefined {
    return this._records.find(
      r => r.sourceId === sourceId && r.targetId === targetId
    );
  }

  /**
   * Get all relationships for an agent (as source).
   */
  getByAgent(agentId: string): readonly RelationshipRecord[] {
    return this._records.filter(r => r.sourceId === agentId || r.targetId === agentId);
  }

  /**
   * Apply a delta to a relationship. Returns a new record (atomic replacement).
   */
  applyDelta(
    current: RelationshipRecord,
    delta: Partial<RelationshipDimensions>,
    turn: number,
    reason: string,
    source: RelationshipEvent['source'],
  ): RelationshipRecord {
    const newDimensions = applyRelationshipDelta(current.dimensions, delta);

    const event: RelationshipEvent = {
      turn,
      dimension: Object.keys(delta)[0] as keyof RelationshipDimensions,
      delta: Object.values(delta)[0] as number,
      reason,
      source,
    };

    const newRecord: RelationshipRecord = {
      ...current,
      dimensions: newDimensions,
      history: [...current.history, event],
      lastUpdatedTurn: turn,
    };

    // Replace in store
    const index = this._records.findIndex(r => r.id === current.id);
    if (index !== -1) {
      this._records[index] = newRecord;
    } else {
      this._records.push(newRecord);
    }

    return newRecord;
  }

  /**
   * Set a relationship record (atomic replace or insert).
   */
  set(record: RelationshipRecord): void {
    const index = this._records.findIndex(
      r => r.sourceId === record.sourceId && r.targetId === record.targetId
    );

    if (index !== -1) {
      this._records[index] = record;
    } else {
      this._records.push(record);
    }
  }

  /**
   * Create a new relationship record.
   */
  create(params: {
    sourceId: string;
    targetId: string;
    dimensions: RelationshipDimensions;
    type: RelationshipType;
    turn: number;
  }): RelationshipRecord {
    const id = generateRelationshipId(params.sourceId, params.targetId);

    const record: RelationshipRecord = {
      id,
      sourceId: params.sourceId,
      targetId: params.targetId,
      dimensions: {
        trust: clampDimension(params.dimensions.trust, 'trust'),
        loyalty: clampDimension(params.dimensions.loyalty, 'loyalty'),
        hostility: clampDimension(params.dimensions.hostility, 'hostility'),
        debt: clampDimension(params.dimensions.debt, 'debt'),
        influence: clampDimension(params.dimensions.influence, 'influence'),
        kinship: clampDimension(params.dimensions.kinship, 'kinship'),
      },
      type: params.type,
      history: [],
      lastUpdatedTurn: params.turn,
    };

    this._records.push(record);
    return record;
  }

  /**
   * Get a relationship by its ID.
   */
  getById(id: string): RelationshipRecord | undefined {
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
  toArray(): readonly RelationshipRecord[] {
    return [...this._records];
  }

  /**
   * Iterator support.
   */
  [Symbol.iterator](): Iterator<RelationshipRecord> {
    return this._records[Symbol.iterator]();
  }
}

/**
 * Create a RelationshipStore from an array of RelationshipRecords.
 * Used for deserialization.
 */
export function createRelationshipStoreFromRecords(records: readonly RelationshipRecord[]): RelationshipStore {
  return new RelationshipStore({ records });
}

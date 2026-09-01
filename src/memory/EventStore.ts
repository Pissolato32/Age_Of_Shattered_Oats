/**
 * MEM-002 — EventStore
 *
 * Append-only store for CampaignEvents with deterministic hashing.
 * Follows the MEM-001 contract: events are immutable after creation.
 */

import type {
  CampaignEvent,
  EventType,
  EventOutcome,
  EventSignificance,
  EventVisibility,
  StateChange,
} from './contracts';

/**
 * Generate a deterministic hash for a CampaignEvent.
 * Uses a simple but stable hash suitable for integrity checks.
 */
function computeEventHash(sequence: number, type: string, turn: number, content: string): string {
  const raw = JSON.stringify({ seq: sequence, type, turn, content });
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) - h + raw.charCodeAt(i)) | 0;
  }
  return `evt_${sequence}_${Math.abs(h)}`;
}

/**
 * Generate a unique ID for a CampaignEvent.
 */
function generateEventId(sequence: number): string {
  return `campaign_event_${sequence}`;
}

export interface EventStoreInit {
  readonly events?: readonly CampaignEvent[];
}

/**
 * EventStore — append-only store for CampaignEvents.
 *
 * Invariants:
 * - Events are immutable after creation.
 * - Sequence numbers are monotonically increasing.
 * - Hashes are deterministically computed from event content.
 */
export class EventStore implements Iterable<CampaignEvent> {
  private _events: CampaignEvent[] = [];
  private _sequenceCounter: number = 0;

  constructor(init?: EventStoreInit) {
    if (init?.events && init.events.length > 0) {
      this._events = [...init.events];
      this._sequenceCounter = Math.max(...init.events.map(e => e.sequence));
    }
  }

  /**
   * Record a new event. Returns the complete event with computed hash.
   */
  record(params: {
    type: EventType;
    turn: number;
    actorIds: readonly string[];
    subjectIds: readonly string[];
    action: string;
    outcome: EventOutcome;
    stateChanges?: readonly StateChange[];
    significance?: EventSignificance;
    visibility?: EventVisibility;
    summary: string;
    narrativeHint?: string;
  }): CampaignEvent {
    const sequence = this._sequenceCounter + 1;
    this._sequenceCounter = sequence;

    const id = generateEventId(sequence);
    const timestamp = new Date().toISOString();

    const event: CampaignEvent = {
      id,
      sequence,
      turn: params.turn,
      type: params.type,
      actorIds: params.actorIds,
      subjectIds: params.subjectIds,
      action: params.action,
      outcome: params.outcome,
      stateChanges: params.stateChanges ?? [],
      significance: params.significance ?? 'LOW',
      visibility: params.visibility ?? 'PUBLIC',
      summary: params.summary,
      narrativeHint: params.narrativeHint,
      timestamp,
      hash: '', // placeholder, computed below
    };

    const content = JSON.stringify({
      sequence,
      type: params.type,
      turn: params.turn,
      actorIds: params.actorIds,
      subjectIds: params.subjectIds,
      action: params.action,
      outcome: params.outcome,
      summary: params.summary,
    });

    const hash = computeEventHash(sequence, params.type, params.turn, content);
    const completeEvent: CampaignEvent = { ...event, hash };

    this._events.push(completeEvent);
    return completeEvent;
  }

  /**
   * Get all events (read-only copy).
   */
  getEvents(): readonly CampaignEvent[] {
    return [...this._events];
  }

  /**
   * Get events filtered by type.
   */
  getEventsByType(type: EventType): readonly CampaignEvent[] {
    return this._events.filter(e => e.type === type);
  }

  /**
   * Get events from a given turn onwards.
   */
  getEventsSinceTurn(turn: number): readonly CampaignEvent[] {
    return this._events.filter(e => e.turn >= turn);
  }

  /**
   * Get an event by its ID.
   */
  getEventById(id: string): CampaignEvent | undefined {
    return this._events.find(e => e.id === id);
  }

  /**
   * Get an event by its sequence number.
   */
  getEventBySequence(sequence: number): CampaignEvent | undefined {
    return this._events.find(e => e.sequence === sequence);
  }

  /**
   * Get the current sequence counter.
   */
  getCurrentSequence(): number {
    return this._sequenceCounter;
  }

  /**
   * Get the number of events.
   */
  size(): number {
    return this._events.length;
  }

  /**
   * Verify the hash chain integrity.
   * Returns true if all events have valid hashes.
   */
  verifyIntegrity(): boolean {
    for (const event of this._events) {
      const content = JSON.stringify({
        sequence: event.sequence,
        type: event.type,
        turn: event.turn,
        actorIds: event.actorIds,
        subjectIds: event.subjectIds,
        action: event.action,
        outcome: event.outcome,
        summary: event.summary,
      });

      const expectedHash = computeEventHash(event.sequence, event.type, event.turn, content);
      if (event.hash !== expectedHash) {
        return false;
      }
    }
    return true;
  }

  /**
   * Clear all events.
   */
  clear(): void {
    this._events = [];
    this._sequenceCounter = 0;
  }

  /**
   * Convert to plain array (for serialization).
   */
  toArray(): readonly CampaignEvent[] {
    return [...this._events];
  }

  /**
   * Iterator support.
   */
  [Symbol.iterator](): Iterator<CampaignEvent> {
    return this._events[Symbol.iterator]();
  }
}

/**
 * Create an EventStore from an array of CampaignEvents.
 * Used for deserialization.
 */
export function createEventStoreFromEvents(events: readonly CampaignEvent[]): EventStore {
  return new EventStore({ events });
}

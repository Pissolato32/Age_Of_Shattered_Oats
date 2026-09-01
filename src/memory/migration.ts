/**
 * MEM-002 — Migration
 *
 * Handles migration of existing CampaignState data into the new memory stores.
 * This module is used during initialization to preserve existing data.
 */

import type {
  MemoryRecord,
  CampaignEvent,
} from './contracts';

/**
 * Legacy memory format from character.memories
 */
interface LegacyMemory {
  id: string;
  ownerId: string;
  subjectId: string;
  description: string;
  importance: number;
  tickRegistered: number;
  decayed?: boolean;
}

/**
 * Legacy event format from eventStore
 */
interface LegacyEvent {
  id: string;
  sequence: number;
  type: string;
  payload: any;
  timestamp: string;
  week: number;
  hash: string;
}

/**
 * Migrate legacy memories to MemoryRecord format.
 */
export function migrateMemories(legacyMemories: readonly LegacyMemory[]): readonly MemoryRecord[] {
  return legacyMemories.map(m => ({
    id: m.id,
    ownerId: m.ownerId,
    subjectId: m.subjectId,
    eventType: 'PLAYER_ACTION' as const,
    description: m.description,
    importance: m.importance,
    tickRegistered: m.tickRegistered,
    decayed: m.decayed ?? false,
    source: 'OBSERVED' as const,
    tags: [],
  }));
}

/**
 * Migrate legacy events to CampaignEvent format.
 */
export function migrateEvents(legacyEvents: readonly LegacyEvent[]): readonly CampaignEvent[] {
  return legacyEvents.map(e => ({
    id: e.id,
    sequence: e.sequence,
    turn: e.week,
    type: mapEventType(e.type),
    actorIds: extractActorIds(e.payload),
    subjectIds: extractSubjectIds(e.payload),
    action: e.payload?.action ?? e.type,
    outcome: mapOutcome(e.payload?.status),
    stateChanges: [],
    significance: 'LOW' as const,
    visibility: 'PUBLIC' as const,
    summary: generateSummary(e),
    timestamp: e.timestamp,
    hash: e.hash,
  }));
}

/**
 * Map legacy event type to new EventType.
 */
function mapEventType(type: string): CampaignEvent['type'] {
  const typeMap: Record<string, CampaignEvent['type']> = {
    'WEEKLY_TURN_RESOLVED': 'ENGINE_TURN',
    'COMMAND_RESOLVED': 'PLAYER_ACTION',
    'SCENE_RESOLVED': 'SCENE_RESOLVED',
    'POLITICAL_EVENT': 'POLITICAL_EVENT',
    'MILITARY_EVENT': 'MILITARY_EVENT',
    'ECONOMIC_EVENT': 'ECONOMIC_EVENT',
  };

  return typeMap[type] ?? 'ENGINE_TURN';
}

/**
 * Map legacy status to EventOutcome.
 */
function mapOutcome(status: string | undefined): CampaignEvent['outcome'] {
  const outcomeMap: Record<string, CampaignEvent['outcome']> = {
    'SUCCESS': 'SUCCESS',
    'FAILURE': 'FAILURE',
    'PARTIAL': 'PARTIAL',
    'REJECTED': 'REJECTED',
  };

  return outcomeMap[status ?? ''] ?? 'SUCCESS';
}

/**
 * Extract actor IDs from legacy payload.
 */
function extractActorIds(payload: any): readonly string[] {
  const ids: string[] = [];
  if (payload?.actorId) ids.push(payload.actorId);
  if (payload?.commandId) ids.push(payload.commandId);
  return ids;
}

/**
 * Extract subject IDs from legacy payload.
 */
function extractSubjectIds(payload: any): readonly string[] {
  const ids: string[] = [];
  if (payload?.targetId) ids.push(payload.targetId);
  if (payload?.subjectId) ids.push(payload.subjectId);
  return ids;
}

/**
 * Generate a summary from a legacy event.
 */
function generateSummary(event: LegacyEvent): string {
  if (event.type === 'WEEKLY_TURN_RESOLVED') {
    return `Turno semanal resolvido: semana ${event.payload?.week ?? event.week}`;
  }
  if (event.type === 'COMMAND_RESOLVED') {
    return `Comando resolvido: ${event.payload?.action ?? 'unknown'}`;
  }
  return `Evento: ${event.type}`;
}

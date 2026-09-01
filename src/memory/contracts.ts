/**
 * MEM-001 — Canonical World & Event Memory Architecture
 *
 * This file defines the canonical contracts for the memory system.
 * These contracts are CLOSED and must not be modified without
 * explicit architectural authorization.
 */

// =============================================================================
// WORLD FACT — Truth derived from CampaignState
// =============================================================================

export type WorldCategory =
  | 'LOCATION'
  | 'CHARACTER'
  | 'ARMY'
  | 'RESOURCE'
  | 'STRUCTURE'
  | 'RELATIONSHIP'
  | 'FACTION'
  | 'CONFLICT'
  | 'POLITICAL'
  | 'ECONOMIC'
  | 'SOCIAL';

export type StateValue = string | number | boolean | null;

/**
 * WorldFact represents a truth derived from the current CampaignState.
 * It is READ-ONLY — never written directly, always derived.
 */
export interface WorldFact {
  readonly factId: string;
  readonly category: WorldCategory;
  readonly subjectId: string;
  readonly predicate: string;
  readonly value: StateValue;
  readonly unit?: string;
  readonly source: 'ENGINE';
  readonly certainty: 'CONFIRMED';
  readonly validFromTurn: number;
  readonly validToTurn?: number;
}

// =============================================================================
// CAMPAIGN EVENT — Historical event (append-only, immutable)
// =============================================================================

export type EventType =
  | 'PLAYER_ACTION'
  | 'ENGINE_TURN'
  | 'POLITICAL_EVENT'
  | 'MILITARY_EVENT'
  | 'ECONOMIC_EVENT'
  | 'SOCIAL_EVENT'
  | 'RELATIONSHIP_EVENT'
  | 'DISCOVERY_EVENT'
  | 'INCIDENT_EVENT'
  | 'SCENE_RESOLVED';

export type EventOutcome = 'SUCCESS' | 'FAILURE' | 'PARTIAL' | 'REJECTED' | 'PENDING';

export type EventSignificance = 'TRIVIAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EventVisibility = 'PUBLIC' | 'PRIVATE' | 'SECRET' | 'RUMOR';

/**
 * CampaignEvent represents a historical event in the campaign.
 * It is APPEND-ONLY and IMMUTABLE after creation.
 */
export interface CampaignEvent {
  readonly id: string;
  readonly sequence: number;
  readonly turn: number;
  readonly type: EventType;
  readonly actorIds: readonly string[];
  readonly subjectIds: readonly string[];
  readonly action: string;
  readonly outcome: EventOutcome;
  readonly stateChanges: readonly StateChange[];
  readonly significance: EventSignificance;
  readonly visibility: EventVisibility;
  readonly summary: string;
  readonly narrativeHint?: string;
  readonly timestamp: string;
  readonly hash: string;
}

/**
 * StateChange represents a mechanical change to the world.
 */
export interface StateChange {
  readonly path: string;
  readonly before: StateValue;
  readonly after: StateValue;
  readonly delta?: number;
}

// =============================================================================
// MEMORY RECORD — Semantic memory of an agent
// =============================================================================

export type MemorySource =
  | 'OBSERVED'
  | 'REPORTED'
  | 'INFERRED'
  | 'RUMOR'
  | 'ENGINE';

/**
 * MemoryRecord represents a persistent memory/belief of an agent.
 * Memories use correctionOf for versioning (never mutate old records).
 */
export interface MemoryRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly subjectId: string;
  readonly eventType: EventType;
  readonly description: string;
  readonly structuredData?: {
    readonly factId?: string;
    readonly eventId?: string;
    readonly relationshipDim?: string;
    readonly delta?: Partial<Record<string, number>>;
  };
  readonly importance: number;
  readonly tickRegistered: number;
  readonly decayed: boolean;
  readonly source: MemorySource;
  readonly tags: readonly string[];
  readonly correctionOf?: string;
}

// =============================================================================
// KNOWLEDGE RECORD — What an agent knows about the world
// =============================================================================

export type KnowledgeSource =
  | 'DIRECT_OBSERVATION'
  | 'ENGINE_REPORT'
  | 'NPC_REPORT'
  | 'PLAYER_INFERENCE'
  | 'RUMOR'
  | 'SCRYING'
  | 'ESPIONAGE';

export type KnowledgeCertainty = 'CONFIRMED' | 'UNCERTAIN' | 'INFERRED' | 'FALSE';

export type KnowledgeVisibility =
  | 'PUBLIC'
  | 'PRIVATE'
  | 'CLASSIFIED'
  | 'SECRET';

/**
 * KnowledgeRecord represents what an agent knows about a fact.
 * Uses supersedes for versioning (never mutate old records).
 */
export interface KnowledgeRecord {
  readonly id: string;
  readonly agentId: string;
  readonly factId: string;
  readonly value: StateValue;
  readonly source: KnowledgeSource;
  readonly certainty: KnowledgeCertainty;
  readonly obtainedTurn: number;
  readonly lastVerifiedTurn: number;
  readonly supersedes?: string;
  readonly visibility: KnowledgeVisibility;
}

// =============================================================================
// RELATIONSHIP RECORD — Structured relationship between two agents
// =============================================================================

export type RelationshipType =
  | 'LORD_VASSAL'
  | 'ALLY'
  | 'ENEMY'
  | 'FAMILY'
  | 'ADVISOR'
  | 'MERCHANT'
  | 'RIVAL'
  | 'NEUTRAL';

export interface RelationshipDimensions {
  readonly trust: number;
  readonly loyalty: number;
  readonly hostility: number;
  readonly debt: number;
  readonly influence: number;
  readonly kinship: number;
}

export interface RelationshipEvent {
  readonly turn: number;
  readonly dimension: keyof RelationshipDimensions;
  readonly delta: number;
  readonly reason: string;
  readonly source: 'ENGINE' | 'PLAYER_ACTION' | 'NPC_ACTION' | 'EVENT';
}

/**
 * RelationshipRecord represents the current state of a relationship.
 * Uses atomic replacement (never mutate in place).
 */
export interface RelationshipRecord {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly dimensions: RelationshipDimensions;
  readonly type: RelationshipType;
  readonly history: readonly RelationshipEvent[];
  readonly lastUpdatedTurn: number;
}

// =============================================================================
// KNOWLEDGE PROPAGATION
// =============================================================================

export interface AgentKnowledgeProfile {
  readonly agentId: string;
  readonly knowledgeAccess: 'FULL' | 'DOMAIN' | 'LIMITED';
}

export interface KnowledgePropagationContext {
  readonly agents: readonly AgentKnowledgeProfile[];
  readonly currentTurn: number;
}

export interface KnowledgePropagationPolicy {
  evaluate(
    event: CampaignEvent,
    context: KnowledgePropagationContext
  ): readonly KnowledgeRecord[];
}

// =============================================================================
// STORE INTERFACES
// =============================================================================

export interface EventStore {
  record(event: Omit<CampaignEvent, 'hash' | 'sequence'>): CampaignEvent;
  getEvents(): readonly CampaignEvent[];
  getEventsByType(type: EventType): readonly CampaignEvent[];
  getEventsSinceWeek(turn: number): readonly CampaignEvent[];
  getEventById(id: string): CampaignEvent | undefined;
  size(): number;
}

export interface MemoryStore {
  add(record: Omit<MemoryRecord, 'id'>): MemoryRecord;
  getByOwner(ownerId: string): readonly MemoryRecord[];
  getBySubject(subjectId: string): readonly MemoryRecord[];
  getByOwnerAndSubject(ownerId: string, subjectId: string): readonly MemoryRecord[];
  evaluateDecay(currentTick: number): number;
  correctionOf(correction: Omit<MemoryRecord, 'id'>, originalId: string): MemoryRecord;
  size(): number;
}

export interface KnowledgeStore {
  add(record: Omit<KnowledgeRecord, 'id'>): KnowledgeRecord;
  getByAgent(agentId: string): readonly KnowledgeRecord[];
  getByFact(factId: string): readonly KnowledgeRecord[];
  getCorrente(agentId: string, factId: string): KnowledgeRecord | undefined;
  supersedes(newRecord: Omit<KnowledgeRecord, 'id'>, previousId: string): KnowledgeRecord;
  size(): number;
}

export interface RelationshipStore {
  get(sourceId: string, targetId: string): RelationshipRecord | undefined;
  applyDelta(current: RelationshipRecord, delta: Partial<RelationshipDimensions>, turn: number, reason: string, source: RelationshipEvent['source']): RelationshipRecord;
  set(record: RelationshipRecord): void;
  getByAgent(agentId: string): readonly RelationshipRecord[];
  size(): number;
}

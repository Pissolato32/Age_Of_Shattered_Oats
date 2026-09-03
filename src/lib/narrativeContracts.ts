export const NARRATIVE_CONTRACT_VERSION = 1 as const;

import type { MemoryRecord, KnowledgeRecord } from '../memory/contracts';

export type NarrativeAction =
  | 'RECRUIT'
  | 'BUILD'
  | 'TRAVEL'
  | 'TRADE'
  | 'DIPLOMACY'
  | 'ESPIONAGE'
  | 'MILITARY'
  | 'SOCIAL'
  | 'INTRIGUE'
  | 'EXPLORATION'
  | 'CRAFT'
  | 'THREAT'
  | 'INVESTIGATE'
  | 'INFORMATION'
  | 'FLAVOR_QUERY'
  | 'UNKNOWN';

export type NarrativeObserverKind = 'PLAYER' | 'CHARACTER' | 'NPC' | 'OBSERVER';
export type KnowledgeTier =
  | 'WORLD_TRUTH'
  | 'CHARACTER_KNOWLEDGE'
  | 'PLAYER_KNOWLEDGE'
  | 'RUMOR'
  | 'INFERENCE'
  | 'SECRET';
export type PublicKnowledgeTier = Exclude<KnowledgeTier, 'WORLD_TRUTH'>;
export type KnowledgeCertainty = 'CONFIRMED' | 'UNCONFIRMED' | 'INFERRED';
export type ExecutionStatus = 'ACCEPTED' | 'REJECTED' | 'AMBIGUOUS';
export type StateValue = string | number | boolean | null;

/**
 * Magnitude resolution modes (MRS v0.1):
 *  - ENGINE_DETERMINED: the Engine derives the magnitude from the state;
 *  - FIXED: an explicit player-provided number (never clamped, rejected if the
 *    rule layer cannot permit it);
 *  - RANGE: a player-provided interval from which the Engine draws.
 */
export type MagnitudeMode = 'ENGINE_DETERMINED' | 'FIXED' | 'RANGE';

export interface MagnitudeRequest {
  readonly mode: MagnitudeMode;
  /** Required for FIXED. */
  readonly value?: number;
  /** Required for RANGE: [min, max] integers with min <= max. */
  readonly range?: readonly [number, number];
}

export interface NarrativeObserver {
  readonly kind: NarrativeObserverKind;
  readonly observerId: string;
}

export interface NarrativeConstraint {
  readonly code: 'NO_INVENTED_MECHANICS' | 'PRESERVE_OUTCOME' | 'RESPECT_KNOWLEDGE_BOUNDARY' | 'PRESERVE_RUMOR_UNCERTAINTY';
  readonly instruction: string;
}

export interface NarrativeCommand {
  readonly contractVersion: typeof NARRATIVE_CONTRACT_VERSION;
  readonly commandId: string;
  readonly actorId: string;
  readonly action: NarrativeAction;
  readonly targetId?: string;
  readonly objectId?: string;
  readonly locationId?: string;
  /** Magnitude request resolved by the Engine (MRS). Absent = ENGINE_DETERMINED for RECRUIT. */
  readonly magnitude?: MagnitudeRequest;
  readonly parameters?: Readonly<Record<string, StateValue>>;
  readonly motivation?: string;
  readonly desiredOutcome?: string;
  readonly stance?: 'AGGRESSIVE' | 'CAUTIOUS' | 'DIPLOMATIC' | 'DECEPTIVE' | 'HONORABLE' | 'NEUTRAL';
  readonly constraints: readonly string[];
  readonly confidence: number;
  readonly ambiguity: readonly string[];
  readonly requiresClarification: boolean;
}

export interface AffectedEntity {
  readonly entityId: string;
  readonly entityType: 'CHARACTER' | 'NPC' | 'ARMY' | 'HOLDING' | 'RESOURCE' | 'EVENT' | 'RELATIONSHIP';
  readonly role: 'ACTOR' | 'TARGET' | 'AFFECTED';
}

export interface StateChange {
  readonly path: string;
  readonly before: StateValue;
  readonly after: StateValue;
  readonly delta?: number;
}

export interface ExecutionConsequence {
  readonly consequenceId: string;
  readonly kind: 'IMMEDIATE' | 'PENDING' | 'IRREVERSIBLE';
  readonly description: string;
  readonly authorized: true;
}

export interface AuthorizedKnowledgeFact {
  readonly factId: string;
  readonly statement: string;
  readonly tier: PublicKnowledgeTier;
  readonly certainty: KnowledgeCertainty;
  readonly source: 'ENGINE' | 'PLAYER_REPORT' | 'RUMOR' | 'INFERENCE';
  readonly subjectId?: string;
  readonly createdTurn?: number;
  readonly createdDate?: string;
  readonly supersedes?: string;
  readonly tags?: readonly string[];
}

export interface RelevantEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly summary: string;
  readonly week: number;
  readonly knowledgeTier: PublicKnowledgeTier;
}

export interface ResolvedMagnitude {
  readonly mode: MagnitudeMode;
  readonly value: number;
  readonly source: 'PLAYER_EXPLICIT' | 'ENGINE_CALCULATED';
  /** Final resolved envelope lower bound (informative). */
  readonly min: number;
  /** Final resolved envelope upper bound (informative). */
  readonly max: number;
}

export type EpistemicAnswerStatus = 'AUTHORIZED_FACTS_PRESENT' | 'NO_AUTHORIZED_INFORMATION';

export interface ExecutionReport {
  readonly contractVersion: typeof NARRATIVE_CONTRACT_VERSION;
  readonly reportId: string;
  readonly command: Pick<NarrativeCommand, 'commandId' | 'actorId' | 'action' | 'targetId' | 'objectId' | 'locationId'>;
  readonly status: ExecutionStatus;
  readonly actionExecuted: NarrativeAction;
  readonly affectedEntities: readonly AffectedEntity[];
  readonly stateChanges: readonly StateChange[];
  readonly consequences: readonly ExecutionConsequence[];
  readonly discoveredInformation: readonly AuthorizedKnowledgeFact[];
  readonly hiddenInformationIds: readonly string[];
  readonly events: readonly RelevantEvent[];
  readonly reasonCode: string;
  /** Present on ACCEPTED RECRUIT resolutions; absent otherwise. */
  readonly magnitude?: ResolvedMagnitude;
  /** Present on multi-turn project resolutions (BUILD, FORGE, RESEARCH); absent otherwise. */
  readonly checkpoint?: CheckpointInfo;
  /** Present on INFORMATION query resolutions to declare epistemic status */
  readonly answerStatus?: EpistemicAnswerStatus;
}

export type CheckpointKind = 'START_CHECKPOINT' | 'MILESTONE_CHECKPOINT' | 'COMPLETION_CHECKPOINT';

export type ResourceStandingTier = 'ABUNDANT' | 'ADEQUATE' | 'TIGHT' | 'CRITICAL';

export interface ResourceStandingReport {
  readonly treasuryStanding: ResourceStandingTier;
  readonly treasuryDescription: string;
  readonly foodStanding: ResourceStandingTier;
  readonly foodDescription: string;
}

export interface CheckpointInfo {
  readonly kind: CheckpointKind;
  readonly projectType: string;
  readonly progressDescription: string;
}

export type SceneState = 'Continuing' | 'Resolved' | 'Suspended' | 'Interrupted';

export interface NarrativeScene {
  readonly locationId: string;
  readonly regionName: string;
  readonly environment: string;
  readonly weather: string;
  readonly season: string;
  readonly sceneState?: SceneState;
  readonly currentActivity?: string;
  readonly immediateCircumstances?: readonly string[];
}

export interface NarrativeActor {
  readonly actorId: string;
  readonly name: string;
  readonly role: string;
  readonly house?: string;
  readonly goals?: readonly string[];
  readonly emotionalState?: string;
}

export interface NarrativeRelationship {
  readonly relationshipId: string;
  readonly sourceActorId: string;
  readonly targetActorId: string;
  readonly knownOpinion?: number;
  readonly loyalty?: string;
  readonly tension?: string;
  readonly trust?: number;
}

export interface KnowledgeSnapshot {
  readonly asOfTurn: number;
  readonly activeFacts: readonly AuthorizedKnowledgeFact[];
  readonly historicalFacts: readonly AuthorizedKnowledgeFact[];
}

export interface NarrativeQueryContext {
  readonly playerInput: string;
  readonly originalAction: NarrativeAction;
  readonly targetId?: string;
  readonly locationId?: string;
  readonly temporalScope?: {
    readonly mode: 'CURRENT_STATE' | 'HISTORICAL_POINT' | 'TEMPORAL_EVOLUTION';
    readonly targetTurn?: number;
  };
}

export interface ObserverProjection {
  readonly contractVersion: typeof NARRATIVE_CONTRACT_VERSION;
  readonly observer: NarrativeObserver;
  readonly scene: NarrativeScene;
  readonly actors: readonly NarrativeActor[];
  readonly relationships: readonly NarrativeRelationship[];
  readonly knownFacts: readonly AuthorizedKnowledgeFact[];
  readonly recentEvents: readonly RelevantEvent[];
  readonly narrativeConstraints: readonly NarrativeConstraint[];
  readonly snapshot?: KnowledgeSnapshot;
}

export interface NarrativeContext {
  readonly contractVersion: typeof NARRATIVE_CONTRACT_VERSION;
  readonly observer: NarrativeObserver;
  readonly scene: NarrativeScene;
  readonly actors: readonly NarrativeActor[];
  readonly relationships: readonly NarrativeRelationship[];
  readonly knownFacts: readonly AuthorizedKnowledgeFact[];
  readonly recentEvents: readonly RelevantEvent[];
  readonly executionResult: ExecutionReport;
  readonly narrativeConstraints: readonly NarrativeConstraint[];
  readonly query?: NarrativeQueryContext;
  // MEM-004: Retrieved context from memory stores
  readonly retrievedMemories?: readonly MemoryRecord[];
  readonly retrievedKnowledge?: readonly KnowledgeRecord[];
  readonly retrievalStatus?: 'FOUND' | 'PARTIAL' | 'NONE';
}

export interface KnowledgeBoundary {
  readonly worldTruth: readonly string[];
  readonly observerProjection: ObserverProjection;
  readonly excludedWorldTruthIds: readonly string[];
}

export function createNarrativeContext(
  projection: ObserverProjection,
  executionResult: ExecutionReport,
  query?: NarrativeQueryContext,
  retrievalResult?: {
    readonly memories?: readonly MemoryRecord[];
    readonly knowledge?: readonly KnowledgeRecord[];
    readonly status?: 'FOUND' | 'PARTIAL' | 'NONE';
  }
): NarrativeContext {
  return {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    observer: projection.observer,
    scene: projection.scene,
    actors: projection.actors,
    relationships: projection.relationships,
    knownFacts: projection.knownFacts,
    recentEvents: projection.recentEvents,
    executionResult,
    narrativeConstraints: projection.narrativeConstraints,
    query,
    retrievedMemories: retrievalResult?.memories,
    retrievedKnowledge: retrievalResult?.knowledge,
    retrievalStatus: retrievalResult?.status
  };
}

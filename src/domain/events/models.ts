// Event Contracts for M18.9-C1

/**
 * Magnitude of a world event.
 */
export type WorldEventMagnitude =
  | 'INCIDENTAL'
  | 'MINOR'
  | 'SIGNIFICANT'
  | 'MAJOR'
  | 'CRITICAL';

/**
 * Cost in time for a scene.
 */
export type TimeCost = 'NONE' | 'HALF_HOUR' | 'HOUR' | 'TWO_HOURS' | 'HALF_DAY' | 'FULL_DAY' | 'MULTI_DAY';

/**
 * Kinds of mutation that can be produced by an event.
 */
export type MutationKind =
  | 'RESOURCE_GAIN'
  | 'RESOURCE_LOSS'
  | 'INJURY_LIGHT'
  | 'INJURY_SEVERE'
  | 'TRAVEL_DELAY'
  | 'ACTIVITY_CHANGE'
  | 'DISCOVER_FACT'
  | 'DIPLOMATIC_SHIFT'
  | 'CREATE_OPPORTUNITY'
  | 'CREATE_CAUSAL_EVENT';

/**
 * Typed discriminated union for event mutations.
 */
export type EventMutation =
  | {
      kind: 'RESOURCE_GAIN' | 'RESOURCE_LOSS';
      resource: string; // ResourceId placeholder
      amount: number;
    }
  | {
      kind: 'INJURY_LIGHT' | 'INJURY_SEVERE';
      targetId: string;
    }
  | {
      kind: 'TRAVEL_DELAY';
      days: number;
    }
  | {
      kind: 'ACTIVITY_CHANGE';
      activity: string; // Activity placeholder
    }
  | {
      kind: 'DISCOVER_FACT';
      fact: string; // AuthorizedKnowledgeFact placeholder
    }
  | {
      kind: 'DIPLOMATIC_SHIFT';
      houseId: string;
      delta: number;
    }
  | {
      kind: 'CREATE_OPPORTUNITY';
      opportunityId: string;
    }
  | {
      kind: 'CREATE_CAUSAL_EVENT';
      eventId: string;
    };

/**
 * Context information used by the narrative LLM.
 */
export interface DescriptionContext {
  locationId?: string;
  eventType: string;
  sensoryTags?: readonly string[];
  actorIds?: readonly string[];
}

/**
 * Record representing a deterministic event selected by RNG.
 */
export interface EventRecord {
  readonly eventId: string;
  readonly magnitude: WorldEventMagnitude;
  readonly timeCost: TimeCost;
  readonly descriptionContext: DescriptionContext;
  // No narrative field – this is supplied later by Gemini.
  readonly mutations: readonly EventMutation[]; // empty if no mechanical consequence
  readonly causalParentEventId?: string; // optional link to a preceding event
  readonly turnOccurred: number;
  readonly slotIndex: number;
  readonly domain: string;
  readonly scene?: SceneState;
}

/**
 * Possible statuses for a scene.
 */
export type SceneStatus = 'OPEN' | 'RESOLVED' | 'INTERRUPTED' | 'EXPIRED';

/**
 * Player choice within a scene.
 */
export interface SceneChoice {
  readonly choiceId: string;
  readonly label: string;
  // Optional additional time cost for this choice
  readonly additionalTimeCost?: TimeCost;
  // Mutations that apply if this choice is taken
  readonly mutations: readonly EventMutation[];
}

/**
 * Outcome of a scene after player interaction.
 */
export interface SceneOutcome {
  readonly sceneId: string;
  readonly status: SceneStatus;
  // Mutations resulting from the resolved scene (or empty)
  readonly mutations: readonly EventMutation[];
  // Optional chosen branch identifier for tracking
  readonly chosenChoiceId?: string;
  // Optional time cost applied by the choice
  readonly timeCostApplied?: TimeCost;
}

/**
 * Mechanical representation of a scene in progress.
 */
export interface SceneState {
  readonly sceneId: string;
  readonly eventId: string;
  readonly status: SceneStatus;
  // Available choices while the scene is OPEN
  readonly choices: readonly SceneChoice[];
  // Remaining budget for this scene (optional – can be used by engine)
  readonly timeBudget?: TimeCost;
}

/**
 * Budget for how much time can be spent in a scene.
 */
export interface SceneTimeBudget {
  readonly max: TimeCost;
  readonly used: TimeCost;
}

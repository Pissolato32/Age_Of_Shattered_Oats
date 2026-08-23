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
  eventId: string;
  magnitude: WorldEventMagnitude;
  timeCost: TimeCost;
  descriptionContext: DescriptionContext;
  // No narrative field – this is supplied later by Gemini.
  mutations: readonly EventMutation[]; // empty if no mechanical consequence
  causalParentEventId?: string; // optional link to a preceding event
  // Added fields for C2 processing
  turnOccurred: number;
  slotIndex: number;
  domain: string;
  // Optional scene placeholder for future use
  scene?: any;
}

/**
 * Possible statuses for a scene.
 */
export type SceneStatus = 'OPEN' | 'RESOLVED' | 'INTERRUPTED' | 'EXPIRED';

/**
 * Player choice within a scene.
 */
export interface SceneChoice {
  choiceId: string;
  label: string;
  // Optional additional time cost for this choice
  additionalTimeCost?: TimeCost;
  // Mutations that apply if this choice is taken
  mutations: readonly EventMutation[];
}

/**
 * Outcome of a scene after player interaction.
 */
export interface SceneOutcome {
  sceneId: string;
  status: SceneStatus;
  // Mutations resulting from the resolved scene (or empty)
  mutations: readonly EventMutation[];
  // Optional chosen branch identifier for tracking
  chosenChoiceId?: string;
}

/**
 * Mechanical representation of a scene in progress.
 */
export interface SceneState {
  sceneId: string;
  status: SceneStatus;
  // Available choices while the scene is OPEN
  choices: readonly SceneChoice[];
  // Remaining budget for this scene (optional – can be used by engine)
  timeBudget?: TimeCost;
}

/**
 * Budget for how much time can be spent in a scene.
 */
export interface SceneTimeBudget {
  max: TimeCost;
  used: TimeCost;
}

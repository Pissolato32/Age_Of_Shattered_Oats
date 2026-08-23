import type { DescriptionContext, WorldEventMagnitude, TimeCost } from '../models';

/**
 * Mechanical facts authorized by the deterministic engine.
 * Pure read-only snapshot containing no executable mutations or state setters.
 */
export interface MechanicalFacts {
  readonly eventId: string;
  readonly eventType: string;
  readonly magnitude: WorldEventMagnitude;
  readonly domain: string;
  readonly absoluteTurn: number;
  readonly timeCostSummary: string;
  readonly mutationsSummary: readonly string[];
  readonly resolutionEventId?: string;
  readonly choiceMade?: {
    readonly choiceId: string;
    readonly label: string;
    readonly outcomeSummary: string;
  };
}

/**
 * Choice prompt structure presented for aesthetic/sensory formatting.
 */
export interface NarrativeChoicePrompt {
  readonly choiceId: string;
  readonly label: string;
  readonly descriptiveHint: string;
}

/**
 * Request payload sent to the sensory narrative translator.
 */
export interface IncidentNarrativeRequest {
  readonly kind: 'INCIDENT_OPENED' | 'INCIDENT_RESOLVED' | 'ATMOSPHERIC_INCIDENT';
  readonly mechanicalFacts: MechanicalFacts;
  readonly context: DescriptionContext;
  readonly environmentContext?: {
    readonly regionName?: string;
    readonly seasonName?: string;
    readonly weatherDescription?: string;
    readonly holdingType?: string;
    readonly presentAdvisors?: readonly {
      readonly name: string;
      readonly role: string;
    }[];
  };
  readonly availableChoices?: readonly NarrativeChoicePrompt[];
}

/**
 * Purely textual response from the sensory narrative layer.
 * Strictly prohibited from containing EventMutation or state modification instructions.
 */
export interface IncidentNarrativeResponse {
  readonly narration: string;
  readonly promptChoicesFormatted?: readonly {
    readonly choiceId: string;
    readonly formattedText: string;
  }[];
  readonly source: 'GEMINI' | 'PROCEDURAL_FALLBACK';
}

import { NarrativeCommand } from './narrativeContracts';

/**
 * Maximum number of clarification rounds before falling back to UNKNOWN.
 * After MAX_CLARIFICATION_ROUNDS, the system returns a safe fallback
 * and resets pendingClarification. Never invents an intent.
 */
export const MAX_CLARIFICATION_ROUNDS = 2;

/**
 * A structured option for the Master's clarification question.
 * If the player clicks a button, we get semanticValue directly
 * without needing LLM re-interpretation.
 */
export interface ClarificationOption {
  readonly id: string;
  readonly label: string;
  readonly semanticValue: string;
}

/**
 * Represents a pending clarification session stored in CampaignState.
 * While pendingClarification is non-null, the next playerInput is treated
 * as a response to the clarification question, not as a new independent action.
 */
export interface PendingClarification {
  /** The original player input that triggered the ambiguous interpretation. */
  readonly originalInput: string;

  /** The NarrativeCommand proposed by the LLM before clarification. */
  readonly proposedCommand: NarrativeCommand;

  /** The Master's clarification question displayed to the player. */
  readonly question: string;

  /** Optional structured options (buttons) for the clarification. */
  readonly options?: readonly ClarificationOption[];

  /** Strings describing what is ambiguous. */
  readonly ambiguity: readonly string[];

  /** Current clarification round (1-indexed). Max is MAX_CLARIFICATION_ROUNDS. */
  readonly round: number;

  /** ISO timestamp when the clarification was created. */
  readonly createdAt: string;
}

/**
 * The context assembled when a player responds to a clarification.
 * This is what gets sent to the LLM for re-interpretation.
 */
export interface ClarificationContext {
  /** The original player input that started the session. */
  readonly originalInput: string;

  /** The NarrativeCommand that was proposed but not executed. */
  readonly proposedCommand: NarrativeCommand;

  /** The Master's question that was asked. */
  readonly masterQuestion: string;

  /** The player's clarification response (free text or button value). */
  readonly playerAnswer: string;

  /** The semantic value if the player clicked a button (null if free text). */
  readonly selectedOption?: string;

  /** The current clarification round number (1 or 2). */
  readonly round?: number;
}

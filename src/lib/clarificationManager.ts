import { CampaignState } from '../types';
import { NarrativeCommand } from './narrativeContracts';
import {
  PendingClarification,
  ClarificationContext,
  ClarificationOption,
  MAX_CLARIFICATION_ROUNDS
} from './clarificationContracts';

/**
 * Checks if the current state has a pending clarification.
 */
export function hasPendingClarification(state: CampaignState): boolean {
  return state.sessionLog?.pendingClarification != null;
}

/**
 * Gets the pending clarification from state.
 */
export function getPendingClarification(state: CampaignState): PendingClarification | null {
  return state.sessionLog?.pendingClarification ?? null;
}

/**
 * Builds a ClarificationContext from the pending clarification and player answer.
 * This context is what gets sent to the LLM for re-interpretation.
 *
 * If the player clicked a button (selectedOption), we include the semantic value
 * so the LLM can use it directly without re-interpreting free text.
 */
export function buildClarificationContext(
  pending: PendingClarification,
  playerAnswer: string,
  selectedOption?: string
): ClarificationContext {
  return {
    originalInput: pending.originalInput,
    proposedCommand: pending.proposedCommand,
    masterQuestion: pending.question,
    playerAnswer,
    selectedOption,
    round: pending.round
  };
}

/**
 * Creates a new PendingClarification from an ambiguous NarrativeCommand.
 *
 * Returns null if the command does not require clarification.
 */
export function createPendingClarification(
  originalInput: string,
  command: NarrativeCommand,
  question: string,
  options?: readonly ClarificationOption[],
  round: number = 1
): PendingClarification | null {
  if (!command.requiresClarification) {
    return null;
  }

  return {
    originalInput,
    proposedCommand: command,
    question,
    options,
    ambiguity: command.ambiguity,
    round,
    createdAt: new Date().toISOString()
  };
}

/**
 * Determines if we should escalate to the next clarification round
 * or fall back to UNKNOWN.
 *
 * Returns true if we can ask another question.
 * Returns false if we've hit MAX_CLARIFICATION_ROUNDS.
 */
export function canAskAnotherQuestion(pending: PendingClarification): boolean {
  return pending.round < MAX_CLARIFICATION_ROUNDS;
}

/**
 * Creates the next round's PendingClarification.
 * Increments the round counter and updates the question.
 *
 * Returns null if we've hit the round limit.
 */
export function createNextRoundClarification(
  current: PendingClarification,
  newQuestion: string,
  newOptions?: readonly ClarificationOption[]
): PendingClarification | null {
  if (!canAskAnotherQuestion(current)) {
    return null;
  }

  return {
    ...current,
    question: newQuestion,
    options: newOptions,
    round: current.round + 1,
    createdAt: new Date().toISOString()
  };
}

/**
 * Clears the pending clarification from state.
 * Returns a new state object with pendingClarification set to undefined.
 */
export function clearPendingClarification(state: CampaignState): CampaignState {
  return {
    ...state,
    sessionLog: {
      ...state.sessionLog,
      pendingClarification: undefined
    }
  };
}

/**
 * Sets the pending clarification in state.
 * Returns a new state object with the pending clarification stored.
 */
export function setPendingClarification(
  state: CampaignState,
  pending: PendingClarification
): CampaignState {
  return {
    ...state,
    sessionLog: {
      ...state.sessionLog,
      pendingClarification: pending
    }
  };
}

/**
 * Formats the clarification context into a prompt string for the LLM.
 * This is the "full context" that the LLM receives for re-interpretation.
 */
export function formatClarificationPrompt(context: ClarificationContext): string {
  const parts: string[] = [];

  parts.push('CONTEXTO DA SESSÃO DE ESCLARECIMENTO');
  parts.push('');
  parts.push(`ORIGINAL DO JOGADOR: "${context.originalInput}"`);
  parts.push('');
  parts.push(`INTENÇÃO PROPOSTA: ${context.proposedCommand.action}`);
  if (context.proposedCommand.ambiguity.length > 0) {
    parts.push(`AMBIGUIDADES: ${context.proposedCommand.ambiguity.join(', ')}`);
  }
  parts.push('');
  parts.push(`PERGUNTA DO MESTRE: "${context.masterQuestion}"`);
  parts.push('');
  parts.push(`RESPOSTA DO JOGADOR: "${context.playerAnswer}"`);
  if (context.selectedOption) {
    parts.push(`OPÇÃO SELECIONADA: ${context.selectedOption}`);
  }
  parts.push('');
  parts.push('TAREFA: Reavaliar a intenção original utilizando a resposta do jogador como esclarecimento.');
  parts.push('Não reinterprete a resposta isoladamente. Considere o contexto completo.');
  parts.push('');
  parts.push('RETORNE APENAS JSON.');

  return parts.join('\n');
}

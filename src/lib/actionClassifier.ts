import { CampaignState } from '../types';
import { NarrativeAction, NarrativeCommand } from './narrativeContracts';

export type ActionClassificationType =
  | 'CANONICAL'
  | 'PLAUSIBLE_UNMODELED'
  | 'IMPOSSIBLE'
  | 'AMBIGUOUS';

export interface ActionClassification {
  readonly type: ActionClassificationType;
  readonly reason: string;
  readonly pipeline: 'RULE_ENGINE' | 'GENERIC_RESOLVER' | 'REJECTION_PIPELINE' | 'CLARIFICATION_PIPELINE';
  readonly canonicalDomain?: NarrativeAction;
}

/**
 * Canonically modeled action domains in the deterministic Engine.
 */
export const CANONICALLY_RESOLVED_DOMAINS: ReadonlySet<NarrativeAction> = new Set<NarrativeAction>([
  'RECRUIT',
  'BUILD',
  'TRAVEL',
  'TRADE',
  'INFORMATION',
  'FLAVOR_QUERY',
  'CRAFT'
]);

export const CANONICAL_DOMAINS: ReadonlySet<NarrativeAction> = new Set<NarrativeAction>([
  'RECRUIT',
  'BUILD',
  'TRAVEL',
  'TRADE',
  'DIPLOMACY',
  'ESPIONAGE',
  'MILITARY',
  'SOCIAL',
  'INTRIGUE',
  'EXPLORATION',
  'CRAFT',
  'INFORMATION',
  'FLAVOR_QUERY'
]);

/**
 * Patterns that violate physical, biological, or world-setting laws.
 */
const IMPOSSIBILITY_PATTERNS: readonly RegExp[] = [
  /ressuscitar|reviver\s+morto|ressurreição/i,
  /voar\s+sem\s+asas|teleportar|teletransporte/i,
  /destruir\s+o\s+mundo|apocalipse/i,
  /matar\s+o\s+rei\s+instantaneamente/i,
  /invocar\s+dragões|magia\s+onipotente/i,
  /criar\s+ouro\s+do\s+nada/i
];

/**
 * Required identity parameters per action.
 */
const MANDATORY_IDENTITY: Readonly<Record<string, readonly string[]>> = {
  BUILD: ['objectId', 'targetId'],
  TRAVEL: ['locationId', 'targetId'],
  TRADE: ['objectId', 'targetId'],
  DIPLOMACY: ['targetId'],
  ESPIONAGE: ['targetId', 'locationId'],
  MILITARY: ['targetId', 'locationId'],
  SOCIAL: ['targetId'],
  INTRIGUE: ['targetId'],
  EXPLORATION: ['locationId', 'targetId'],
  THREAT: ['targetId'],
  INVESTIGATE: ['targetId', 'objectId', 'locationId']
};

/**
 * Authoritative Action Classification Hierarchy:
 *  1. Canonical rule existence (highest precedence)
 *  2. Structural impossibility
 *  3. Ambiguity / missing mandatory parameters
 *  4. Plausible unmodeled (delegated to Generic Resolver)
 */
export function classifyNarrativeCommand(
  command: NarrativeCommand,
  state: CampaignState
): ActionClassification {
  // Priority 0: Explicit clarification requirement from interpreter
  if (command.requiresClarification) {
    const ambStr = Array.isArray(command.ambiguity)
      ? command.ambiguity.join('; ')
      : (typeof command.ambiguity === 'string' ? command.ambiguity : 'ambiguidade detectada');
    return {
      type: 'AMBIGUOUS',
      reason: `O comando exige esclarecimento: ${ambStr || 'ambiguidade detectada'}`,
      pipeline: 'CLARIFICATION_PIPELINE'
    };
  }

  // Priority 1: Mandatory identity check for any action requiring targets
  const isSilenceAction =
    (command.action === 'DIPLOMACY' || command.action === 'SOCIAL') &&
    (command.desiredOutcome?.toLowerCase().includes('silêncio') || command.desiredOutcome?.toLowerCase().includes('silencio') || command.stance === 'CAUTIOUS');

  const mandatory = MANDATORY_IDENTITY[command.action];
  if (mandatory && !isSilenceAction) {
    const hasIdentity = mandatory.some(key => {
      const value = command[key as keyof NarrativeCommand];
      return value !== undefined && value !== null && value !== '';
    });
    if (!hasIdentity) {
      return {
        type: 'AMBIGUOUS',
        reason: `O comando ${command.action} exige esclarecimento: identifique o alvo (${mandatory.join(' ou ')}) para a resolução mecânica.`,
        pipeline: 'CLARIFICATION_PIPELINE',
        canonicalDomain: CANONICAL_DOMAINS.has(command.action) ? command.action : undefined
      };
    }
  }

  // Priority 2: Check Canonical Rule Domain
  if (CANONICAL_DOMAINS.has(command.action)) {
    return {
      type: 'CANONICAL',
      reason: `Ação ${command.action} possui regra canônica modelada no Engine.`,
      pipeline: 'RULE_ENGINE',
      canonicalDomain: command.action
    };
  }

  // Check action text/motivation for impossibility patterns
  const candidateText = `${command.action} ${command.motivation || ''} ${command.desiredOutcome || ''}`;
  for (const pattern of IMPOSSIBILITY_PATTERNS) {
    if (pattern.test(candidateText)) {
      return {
        type: 'IMPOSSIBLE',
        reason: `Ação viola as leis físicas e estruturais do mundo de Age of Shattered Oaths.`,
        pipeline: 'REJECTION_PIPELINE'
      };
    }
  }

  // Priority 2: Check for empty / unknown action
  if (!command.action || command.action === 'UNKNOWN') {
    return {
      type: 'AMBIGUOUS',
      reason: 'Ação não identificada ou desconhecida.',
      pipeline: 'CLARIFICATION_PIPELINE'
    };
  }

  // Priority 3: Plausible Unmodeled
  return {
    type: 'PLAUSIBLE_UNMODELED',
    reason: `Ação ${command.action} é plausível no contexto e será avaliada pelo Generic Resolver.`,
    pipeline: 'GENERIC_RESOLVER'
  };
}

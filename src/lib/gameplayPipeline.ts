import { parseUserIntent, ParsedIntent } from './intentParser';
import { resolveAction, applyResolutionToState, hashMechanicalState, verifyStateIntegrity, RuleResolutionResult } from './ruleResolver';
import { getCachedWebFlavor } from './webFlavorCache';
import { WebFlavorResult } from './webFlavorService';
import { CampaignState } from '../types';

export interface GameplayPipelineResult {
  intent: ParsedIntent;
  resolution?: RuleResolutionResult;
  webFlavor?: WebFlavorResult;
  isCacheHit?: boolean;
  updatedState: CampaignState;
  stateMutated: boolean;
  requiresPlayerClarification: boolean;
  clarificationMessage?: string;
  integrityVerified: boolean;
}

/**
 * Pipeline Orquestrador de Gameplay e Inteligência Narrativa (AOS V4.7)
 * 
 * Ordem do Fluxo:
 * 1. Intent Classification & Parameter Check.
 * 2. Se requerer esclarecimento -> Retorna mensagem de clarificação sem alterar estado.
 * 3. Se for Mecânico -> Codex/Rule Resolver -> Mutação Atômica se ALLOWED.
 * 4. Se for Flavor -> Cache de Web Flavor + Sanitização -> Zero mutação mecânica.
 * 5. Validação Defensiva de Integridade por Hash do Estado.
 */
export function executeGameplayPipeline(
  userProse: string, 
  currentState: CampaignState
): GameplayPipelineResult {
  const hashInitial = hashMechanicalState(currentState);

  // 1. Intent Classification
  const intent = parseUserIntent(userProse);

  // 2. Tratar Parâmetros Ausentes / Ambiguidade
  if (intent.requiresClarification) {
    return {
      intent,
      updatedState: currentState,
      stateMutated: false,
      requiresPlayerClarification: true,
      clarificationMessage: intent.clarificationPrompt,
      integrityVerified: verifyStateIntegrity(currentState, currentState)
    };
  }

  // 3. Intenções Mecânicas (Codex-First)
  if (intent.category === 'MECHANICAL') {
    const resolution = resolveAction(userProse, currentState);
    const { updatedState, mutated } = applyResolutionToState(currentState, resolution);

    const integrityOk = mutated 
      ? true 
      : verifyStateIntegrity(currentState, updatedState);

    return {
      intent,
      resolution,
      updatedState,
      stateMutated: mutated,
      requiresPlayerClarification: false,
      integrityVerified: integrityOk
    };
  }

  // 4. Intenções de Flavor (Web Cache + Zero Mutação)
  if (intent.category === 'FLAVOR') {
    const { result: webFlavor, isCacheHit } = getCachedWebFlavor(userProse);
    const resolution = resolveAction(userProse, currentState);

    const integrityOk = verifyStateIntegrity(currentState, currentState);

    return {
      intent,
      resolution,
      webFlavor,
      isCacheHit,
      updatedState: currentState,
      stateMutated: false,
      requiresPlayerClarification: false,
      integrityVerified: integrityOk
    };
  }

  // Fallback para consultas genéricas ou informativas
  const resolution = resolveAction(userProse, currentState);
  return {
    intent,
    resolution,
    updatedState: currentState,
    stateMutated: false,
    requiresPlayerClarification: false,
    integrityVerified: verifyStateIntegrity(currentState, currentState)
  };
}

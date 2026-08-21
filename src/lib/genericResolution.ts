import { CampaignState } from '../types';
import { RandomService } from '../core/RandomService';
import { StateChange, ExecutionConsequence } from './narrativeContracts';

export type ResolutionCategory =
  | 'CANONICAL'
  | 'PLAUSIBLE_UNMODELED'
  | 'IMPOSSIBLE'
  | 'AMBIGUOUS';

export type GenericOutcome =
  | 'SUCCESS'
  | 'PARTIAL_SUCCESS'
  | 'FAILURE'
  | 'CRITICAL_FAILURE'
  | 'REJECTED'
  | 'CLARIFICATION_REQUIRED';

export interface ResolutionClassification {
  readonly type: ResolutionCategory;
  readonly reason: string;
}

export interface GenericResolutionRequest {
  readonly action: string;
  readonly targetId?: string;
  readonly parameters?: Readonly<Record<string, unknown>>;
}

export interface GenericResolutionResult {
  readonly classification: 'PLAUSIBLE_UNMODELED' | 'IMPOSSIBLE' | 'AMBIGUOUS';
  readonly outcome: GenericOutcome;
  readonly magnitude?: number;
  readonly probability?: number;
  readonly source: 'ENGINE_CALCULATED';
  readonly stateChanges: readonly StateChange[];
  readonly consequences: readonly ExecutionConsequence[];
  readonly reason: string;
}

/**
 * Generic plausible unmodeled actions catalog.
 * Canonical actions (RECRUIT, BUILD, TRAVEL, TRADE) are CANONICAL and handled by ruleResolver.
 */
const CANONICAL_ACTIONS = new Set<string>([
  'RECRUIT',
  'BUILD',
  'TRAVEL',
  'TRADE',
  'CRAFT'
]);

const IMPOSSIBLE_PATTERNS = [
  /ressuscitar|reviver\s+morto/i,
  /voar|teleportar/i,
  /destruir\s+o\s+mundo/i,
  /matar\s+o\s+rei/i,
  /invocar\s+drag/i
];

export function classifyAction(
  request: GenericResolutionRequest,
  state: CampaignState
): ResolutionClassification {
  const actionNorm = request.action.trim().toUpperCase();

  // 1. Check Canonical
  if (CANONICAL_ACTIONS.has(actionNorm)) {
    return {
      type: 'CANONICAL',
      reason: `Ação ${actionNorm} possui regra canônica modelada no Engine.`
    };
  }

  // 2. Check Structural Impossibility
  for (const pattern of IMPOSSIBLE_PATTERNS) {
    if (pattern.test(request.action)) {
      return {
        type: 'IMPOSSIBLE',
        reason: `Ação "${request.action}" viola as leis físicas e canônicas do mundo.`
      };
    }
  }

  // 3. Check Ambiguity
  if (!request.action || request.action.trim().length === 0) {
    return {
      type: 'AMBIGUOUS',
      reason: 'Ação vazia ou não identificada.'
    };
  }

  // 4. Default to Plausible Unmodeled
  return {
    type: 'PLAUSIBLE_UNMODELED',
    reason: `Ação "${request.action}" é plausível no contexto atual mas não possui regra canônica fechada.`
  };
}

/**
 * Resolves a PLAUSIBLE_UNMODELED generic action deterministically.
 * Does NOT mutate the input state.
 */
export function resolveGenericPlausibleAction(
  request: GenericResolutionRequest,
  state: CampaignState,
  rng: RandomService
): GenericResolutionResult {
  const classification = classifyAction(request, state);

  if (classification.type === 'IMPOSSIBLE') {
    return {
      classification: 'IMPOSSIBLE',
      outcome: 'REJECTED',
      source: 'ENGINE_CALCULATED',
      stateChanges: [],
      consequences: [],
      reason: classification.reason
    };
  }

  if (classification.type === 'AMBIGUOUS') {
    return {
      classification: 'AMBIGUOUS',
      outcome: 'CLARIFICATION_REQUIRED',
      source: 'ENGINE_CALCULATED',
      stateChanges: [],
      consequences: [],
      reason: classification.reason
    };
  }

  const actionLower = request.action.toLowerCase();
  const laborAvailable = state.holdings.laborPool;
  const treasurySd = state.weeklyLedger.silverdew;

  // Example Category 1: Road clearing / Infrastructure maintenance
  if (actionLower.includes('limpar') || actionLower.includes('estrada') || actionLower.includes('reparar')) {
    const requestedMen = typeof request.parameters?.men === 'number' ? request.parameters.men : 15;
    if (requestedMen <= 0) {
      return {
        classification: 'AMBIGUOUS',
        outcome: 'CLARIFICATION_REQUIRED',
        source: 'ENGINE_CALCULATED',
        stateChanges: [],
        consequences: [],
        reason: 'Quantidade de homens inválida ou não especificada para trabalho de campo.'
      };
    }

    const assignedMen = Math.min(requestedMen, laborAvailable);
    if (assignedMen <= 0) {
      return {
        classification: 'PLAUSIBLE_UNMODELED',
        outcome: 'FAILURE',
        magnitude: 0,
        probability: 0,
        source: 'ENGINE_CALCULATED',
        stateChanges: [],
        consequences: [],
        reason: 'Mão de obra insuficiente no pool de trabalho para alocação.'
      };
    }

    // Cost: 0.1 SD per man for tools/rations
    const toolCost = Math.round(assignedMen * 0.1);
    const hasFunds = treasurySd >= toolCost;

    // Roll difficulty 1d20 + workforce bonus
    const roll = rng.nextInt(1, 20);
    const success = roll >= 5 && hasFunds;

    const outcome: GenericOutcome = success ? (roll >= 15 ? 'SUCCESS' : 'PARTIAL_SUCCESS') : 'FAILURE';
    const stateChanges: StateChange[] = [];

    if (hasFunds && toolCost > 0) {
      stateChanges.push({
        path: 'weeklyLedger.silverdew',
        before: treasurySd,
        after: treasurySd - toolCost,
        delta: -toolCost
      });
    }

    stateChanges.push({
      path: 'holdings.laborPool',
      before: laborAvailable,
      after: laborAvailable - assignedMen,
      delta: -assignedMen
    });

    return {
      classification: 'PLAUSIBLE_UNMODELED',
      outcome,
      magnitude: assignedMen,
      probability: 0.65,
      source: 'ENGINE_CALCULATED',
      stateChanges,
      consequences: [
        {
          consequenceId: `csq_generic_${rng.nextInt(1000, 9999)}`,
          kind: 'IMMEDIATE',
          description: success
            ? `Trabalho de campo concluído com ${assignedMen} homens alocados.`
            : `Dificuldades no terreno impediram a conclusão satisfatória do trabalho de campo.`,
          authorized: true
        }
      ],
      reason: `Resolução genérica de infraestrutura: ${outcome} (roll=${roll}, homens=${assignedMen}).`
    };
  }

  // Example Category 2: Bribery / Negotiation / Local diplomacy
  if (actionLower.includes('suborno') || actionLower.includes('subornar') || actionLower.includes('propina')) {
    const bribeOffer = typeof request.parameters?.amount === 'number' ? request.parameters.amount : 20;
    if (bribeOffer <= 0 || treasurySd < bribeOffer) {
      return {
        classification: 'PLAUSIBLE_UNMODELED',
        outcome: 'FAILURE',
        magnitude: 0,
        source: 'ENGINE_CALCULATED',
        stateChanges: [],
        consequences: [],
        reason: 'Tesouraria insuficiente para a oferta de suborno pretendida.'
      };
    }

    const roll = rng.nextInt(1, 20);
    const success = roll >= 10;
    const outcome: GenericOutcome = success ? 'SUCCESS' : 'FAILURE';

    const stateChanges: StateChange[] = [
      {
        path: 'weeklyLedger.silverdew',
        before: treasurySd,
        after: treasurySd - bribeOffer,
        delta: -bribeOffer
      }
    ];

    return {
      classification: 'PLAUSIBLE_UNMODELED',
      outcome,
      magnitude: bribeOffer,
      probability: 0.55,
      source: 'ENGINE_CALCULATED',
      stateChanges,
      consequences: [
        {
          consequenceId: `csq_generic_${rng.nextInt(1000, 9999)}`,
          kind: 'IMMEDIATE',
          description: success
            ? `Suborno de ${bribeOffer} SD aceito pelo alvo.`
            : `A tentativa de suborno falhou e foi recusada.`,
          authorized: true
        }
      ],
      reason: `Resolução genérica de suborno: ${outcome} (roll=${roll}, valor=${bribeOffer} SD).`
    };
  }

  // Generic fallback for unmodeled interaction
  const roll = rng.nextInt(1, 20);
  const outcome: GenericOutcome = roll >= 12 ? 'SUCCESS' : 'PARTIAL_SUCCESS';

  return {
    classification: 'PLAUSIBLE_UNMODELED',
    outcome,
    magnitude: 1,
    probability: 0.5,
    source: 'ENGINE_CALCULATED',
    stateChanges: [],
    consequences: [
      {
        consequenceId: `csq_generic_${rng.nextInt(1000, 9999)}`,
        kind: 'IMMEDIATE',
        description: `Ação genérica executada com resultado: ${outcome}.`,
        authorized: true
      }
    ],
    reason: `Resolução genérica contextual executada com sucesso (roll=${roll}).`
  };
}

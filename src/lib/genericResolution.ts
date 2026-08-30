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
 * Canonically modeled action domains in the deterministic Engine.
 */
const CANONICAL_ACTIONS = new Set<string>([
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
const IMPOSSIBLE_PATTERNS = [
  /ressuscitar|reviver\s+morto|ressurreição/i,
  /voar\s+sem\s+asas|teleportar|teletransporte/i,
  /destruir\s+o\s+mundo|apocalipse/i,
  /matar\s+o\s+rei\s+instantaneamente/i,
  /invocar\s+dragões|magia\s+onipotente/i,
  /criar\s+ouro\s+do\s+nada/i
];

/**
 * Classifies an incoming action request authoritatively.
 */
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
 * Derives settlement structural work limit based on holding population and tier.
 * Canonical mobilization limit: at most 5% of civilian population can be assigned
 * simultaneously to specialized unmodeled field works without disrupting basic production.
 */
function deriveStructuralWorkCap(state: CampaignState): number {
  const population = state.holdings?.population ?? 1000;
  const popDerivedCap = Math.floor(population * 0.05);

  let tier = 1;
  switch (state.holdings?.type) {
    case 'Bastion':
      tier = 1;
      break;
    case 'Fortified Town':
      tier = 2;
      break;
    case 'Castle':
      tier = 3;
      break;
    case 'Walled City':
      tier = 4;
      break;
    default:
      tier = Math.min(4, Math.max(1, state.holdings?.tier || 1));
  }

  return Math.max(25, Math.max(popDerivedCap, tier * 50));
}

/**
 * Derives target opinion modifier in [-3, +3] if target is present in relationships.
 */
function getTargetOpinion(targetId: string | undefined, state: CampaignState): number {
  if (!targetId) return 0;
  const targetNorm = targetId.toLowerCase();

  const house = state.worldLedger?.nobleHouses?.find(
    h => h.name.toLowerCase() === targetNorm || h.seat.toLowerCase() === targetNorm
  );
  if (house && typeof house.opinion === 'number') {
    return Math.max(-3, Math.min(3, house.opinion));
  }

  const tribe = state.worldLedger?.tribalRelations?.find(
    t => t.tribeName.toLowerCase() === targetNorm
  );
  if (tribe) {
    if (tribe.opinion === 'Friendly') return 2;
    if (tribe.opinion === 'Hostile') return -2;
    if (tribe.opinion === 'Eliminated') return -3;
    return 0;
  }

  return 0;
}

/**
 * Calculates contextual friction score for 1d20 deterministic roll.
 * Friction is the dynamic threshold replacing arbitrary hardcoded DCs.
 */
function calculateContextualFriction(
  baseFriction: number,
  state: CampaignState,
  options: {
    useLeadership?: boolean;
    useReputation?: boolean;
    useSeason?: boolean;
    targetOpinion?: number;
  } = {}
): number {
  let friction = baseFriction;

  // Environmental friction (Deepfrost adds friction to physical operations)
  if (options.useSeason && state.weeklyLedger.season === 'Deepfrost') {
    friction += 3;
  }

  // Leadership bonus (commanderTier reduces operational friction)
  if (options.useLeadership) {
    const commanderTier = state.character?.stats?.commanderTier ?? 1;
    friction -= Math.min(5, Math.max(1, commanderTier));
  }

  // Reputation bonus (reduces friction in social/negotiation tasks)
  if (options.useReputation) {
    const rep = state.character?.reputation ?? 0;
    const repBonus = Math.min(3, Math.max(0, Math.floor(rep / 10)));
    friction -= repBonus;
  }

  // Target affinity bonus/penalty
  if (typeof options.targetOpinion === 'number') {
    friction -= Math.min(3, Math.max(-3, options.targetOpinion));
  }

  // Clamp friction threshold to prevent auto-win (min 2) or auto-fail (max 18)
  return Math.max(2, Math.min(18, friction));
}

/**
 * Resolves a PLAUSIBLE_UNMODELED generic action deterministically using contextual derivation.
 * Does NOT mutate the input state directly.
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
  const structuralWorkCap = deriveStructuralWorkCap(state);

  // -------------------------------------------------------------------------
  // Category 1: Infrastructure / Maintenance / Field Work
  // -------------------------------------------------------------------------
  if (
    !actionLower.includes('patrulha') &&
    !actionLower.includes('batedor') &&
    !actionLower.includes('espi') &&
    (
      actionLower.includes('limpar') ||
      actionLower.includes('estrada') ||
      actionLower.includes('reparar') ||
      actionLower.includes('manutenção') ||
      actionLower.includes('infraestrutura') ||
      actionLower.includes('escavar') ||
      actionLower.includes('fortificar')
    )
  ) {
    // Treasury capacity for operational tool/ration support: 1 SD supports up to 10 men
    // If treasury is 0, workforce is limited to minimal local volunteer effort (max 10 men)
    const treasurySupportedMen = treasurySd > 0 ? treasurySd * 10 : 0;

    // Unified Capacity incorporating Labor, Treasury and Structural Tier:
    const unifiedCapacity = Math.min(laborAvailable, structuralWorkCap, Math.max(10, treasurySupportedMen));

    if (unifiedCapacity <= 0 || laborAvailable <= 0) {
      return {
        classification: 'PLAUSIBLE_UNMODELED',
        outcome: 'FAILURE',
        magnitude: 0,
        probability: 0,
        source: 'ENGINE_CALCULATED',
        stateChanges: [],
        consequences: [],
        reason: 'Mão de obra ou recursos insuficientes no feudo para sustentar os trabalhos.'
      };
    }

    // Envelope: [min 1 or 50% capacity, max capacity]
    const envMin = Math.max(1, Math.floor(unifiedCapacity * 0.5));
    const envMax = unifiedCapacity;

    const requestedMen = typeof request.parameters?.men === 'number' ? request.parameters.men : undefined;
    if (requestedMen !== undefined && requestedMen <= 0) {
      return {
        classification: 'AMBIGUOUS',
        outcome: 'CLARIFICATION_REQUIRED',
        source: 'ENGINE_CALCULATED',
        stateChanges: [],
        consequences: [],
        reason: 'Quantidade de homens inválida ou não positiva especificada para o trabalho de campo.'
      };
    }

    // If requestedMen is provided, clamp to envelope; otherwise roll deterministically within envelope:
    const assignedMen = requestedMen !== undefined
      ? Math.min(requestedMen, envMax)
      : (envMax > envMin ? rng.nextInt(envMin, envMax) : envMin);

    if (assignedMen <= 0) {
      return {
        classification: 'PLAUSIBLE_UNMODELED',
        outcome: 'FAILURE',
        magnitude: 0,
        probability: 0,
        source: 'ENGINE_CALCULATED',
        stateChanges: [],
        consequences: [],
        reason: 'Mão de obra insuficiente para suportar a alocação requerida.'
      };
    }

    // Operational friction cost derived from workforce: 1 SD per 10 men allocated, bounded by treasury
    const toolCost = Math.min(treasurySd, Math.floor(assignedMen / 10));

    // Dynamic friction threshold (base 10 - leadership + deepfrost penalty)
    const frictionThreshold = calculateContextualFriction(10, state, {
      useLeadership: true,
      useSeason: true
    });

    const roll = rng.nextInt(1, 20);
    let outcome: GenericOutcome;

    if (roll >= frictionThreshold + 5) {
      outcome = 'SUCCESS';
    } else if (roll >= frictionThreshold) {
      outcome = 'PARTIAL_SUCCESS';
    } else {
      outcome = 'FAILURE';
    }

    const stateChanges: StateChange[] = [];

    // Deduct labor only on success or partial success where work commenced
    if (outcome !== 'FAILURE') {
      stateChanges.push({
        path: 'holdings.laborPool',
        before: laborAvailable,
        after: laborAvailable - assignedMen,
        delta: -assignedMen
      });

      if (toolCost > 0) {
        stateChanges.push({
          path: 'weeklyLedger.silverdew',
          before: treasurySd,
          after: treasurySd - toolCost,
          delta: -toolCost
        });
      }
    }

    return {
      classification: 'PLAUSIBLE_UNMODELED',
      outcome,
      magnitude: assignedMen,
      probability: Number(((21 - frictionThreshold) / 20).toFixed(2)),
      source: 'ENGINE_CALCULATED',
      stateChanges,
      consequences: [
        {
          consequenceId: `csq_generic_${rng.nextInt(1000, 9999)}`,
          kind: 'IMMEDIATE',
          description: outcome === 'SUCCESS'
            ? `Trabalho de campo concluído com pleno êxito com ${assignedMen} homens alocados.`
            : outcome === 'PARTIAL_SUCCESS'
              ? `Trabalho de campo parcialmente concluído (${assignedMen} homens alocados sob atrito).`
              : `Dificuldades no terreno e atrito operacional impediram a execução dos trabalhos.`,
          authorized: true
        }
      ],
      reason: `Resolução contextual de infraestrutura: ${outcome} (roll=${roll}, atrito=${frictionThreshold}, homens=${assignedMen}, envelope=[${envMin}, ${envMax}]).`
    };
  }

  // -------------------------------------------------------------------------
  // Category 2: Bribery / Negotiation / Local Diplomacy
  // -------------------------------------------------------------------------
  if (
    actionLower.includes('suborno') ||
    actionLower.includes('subornar') ||
    actionLower.includes('propina') ||
    actionLower.includes('negociar') ||
    actionLower.includes('persuadir') ||
    actionLower.includes('acordo')
  ) {
    if (treasurySd <= 0) {
      return {
        classification: 'PLAUSIBLE_UNMODELED',
        outcome: 'FAILURE',
        magnitude: 0,
        probability: 0,
        source: 'ENGINE_CALCULATED',
        stateChanges: [],
        consequences: [],
        reason: 'Tesouraria zerada ou insuficiente para negociação financeira.'
      };
    }

    const requestedAmount = typeof request.parameters?.amount === 'number' ? request.parameters.amount : undefined;
    if (requestedAmount !== undefined && requestedAmount <= 0) {
      return {
        classification: 'AMBIGUOUS',
        outcome: 'CLARIFICATION_REQUIRED',
        source: 'ENGINE_CALCULATED',
        stateChanges: [],
        consequences: [],
        reason: 'Valor de oferta monetária inválido ou negativo.'
      };
    }

    // Default bribe offer envelope: [10, min(treasury, 50)]
    const bribeMin = Math.max(1, Math.min(10, treasurySd));
    const bribeMax = Math.min(treasurySd, Math.max(bribeMin, 50));

    const bribeOffer = requestedAmount !== undefined
      ? requestedAmount
      : (bribeMax > bribeMin ? rng.nextInt(bribeMin, bribeMax) : bribeMin);

    if (bribeOffer > treasurySd) {
      return {
        classification: 'PLAUSIBLE_UNMODELED',
        outcome: 'FAILURE',
        magnitude: 0,
        probability: 0,
        source: 'ENGINE_CALCULATED',
        stateChanges: [],
        consequences: [],
        reason: 'Tesouraria insuficiente para a oferta monetária pretendida.'
      };
    }

    const targetOpinion = getTargetOpinion(request.targetId, state);
    const frictionThreshold = calculateContextualFriction(10, state, {
      useReputation: true,
      targetOpinion
    });

    const roll = rng.nextInt(1, 20);
    let outcome: GenericOutcome;

    if (roll === 1) {
      outcome = 'CRITICAL_FAILURE';
    } else if (roll >= frictionThreshold + 5) {
      outcome = 'SUCCESS';
    } else if (roll >= frictionThreshold) {
      outcome = 'PARTIAL_SUCCESS';
    } else {
      outcome = 'FAILURE';
    }

    const stateChanges: StateChange[] = [];

    // Deduct treasury only if negotiation succeeded and coin was accepted
    if (outcome === 'SUCCESS' || outcome === 'PARTIAL_SUCCESS') {
      stateChanges.push({
        path: 'weeklyLedger.silverdew',
        before: treasurySd,
        after: treasurySd - bribeOffer,
        delta: -bribeOffer
      });
    }

    const rawProb = (21 - frictionThreshold) / 20;
    const probability = Number(Math.max(0.10, Math.min(0.85, rawProb)).toFixed(2));

    return {
      classification: 'PLAUSIBLE_UNMODELED',
      outcome,
      magnitude: bribeOffer,
      probability,
      source: 'ENGINE_CALCULATED',
      stateChanges,
      consequences: [
        {
          consequenceId: `csq_generic_${rng.nextInt(1000, 9999)}`,
          kind: 'IMMEDIATE',
          description: outcome === 'SUCCESS'
            ? `Negociação aceita plenamente pelo alvo mediante oferta de ${bribeOffer} SD.`
            : outcome === 'PARTIAL_SUCCESS'
              ? `Acordo provisório aceito com concessões mútuas (${bribeOffer} SD).`
              : outcome === 'CRITICAL_FAILURE'
                ? `A oferta foi tomada como ofensa grave pelo interlocutor, gerando desconfiança.`
                : `A proposta foi rejeitada pelo interlocutor.`,
          authorized: true
        }
      ],
      reason: `Resolução contextual de negociação: ${outcome} (roll=${roll}, atrito=${frictionThreshold}, valor=${bribeOffer} SD, afinidade=${targetOpinion}).`
    };
  }

  // -------------------------------------------------------------------------
  // Category 3: Specialized Domain — ESPIONAGE
  // -------------------------------------------------------------------------
  if (
    actionLower.includes('espi') ||
    actionLower.includes('infiltrar') ||
    actionLower.includes('investigar') ||
    actionLower.includes('boato') ||
    actionLower.includes('inteligência') ||
    actionLower.includes('vigiar feudo')
  ) {
    const costSd = 5;
    if (treasurySd < costSd) {
      return {
        classification: 'PLAUSIBLE_UNMODELED',
        outcome: 'FAILURE',
        magnitude: 0,
        probability: 0,
        source: 'ENGINE_CALCULATED',
        stateChanges: [],
        consequences: [],
        reason: `Tesouraria insuficiente (${treasurySd} SD). Operações de espionagem exigem ao menos ${costSd} SD para custear agentes e informantes.`
      };
    }

    const commanderTier = state.character?.stats?.commanderTier ?? 1;
    const repBonus = Math.min(3, Math.max(0, Math.floor((state.character?.reputation ?? 0) / 10)));
    const hasSpymaster = state.advisors?.spyMasterName ? 1 : 0;
    const baseFriction = 12;
    const frictionThreshold = Math.max(2, Math.min(18, baseFriction - commanderTier - repBonus - hasSpymaster));

    const roll = rng.nextInt(1, 20);
    let outcome: GenericOutcome;

    if (roll === 1) {
      outcome = 'CRITICAL_FAILURE';
    } else if (roll >= frictionThreshold + 5) {
      outcome = 'SUCCESS';
    } else if (roll >= frictionThreshold) {
      outcome = 'PARTIAL_SUCCESS';
    } else {
      outcome = 'FAILURE';
    }

    const stateChanges: StateChange[] = [
      {
        path: 'weeklyLedger.silverdew',
        before: treasurySd,
        after: treasurySd - costSd,
        delta: -costSd
      }
    ];

    const rawProb = (21 - frictionThreshold) / 20;
    const probability = Number(Math.max(0.10, Math.min(0.85, rawProb)).toFixed(2));

    // Consequence on secrets
    const unrevealedSecret = (state.worldSecrets || []).find(s => !s.revealed);
    const consequences: ExecutionConsequence[] = [
      {
        consequenceId: `csq_espi_${rng.nextInt(1000, 9999)}`,
        kind: 'IMMEDIATE',
        description: outcome === 'SUCCESS'
          ? (unrevealedSecret ? `Espião revelou com precisão um segredo: ${unrevealedSecret.description}` : `Rede de informantes colheu relatórios detalhados sobre as defesas do alvo.`)
          : outcome === 'PARTIAL_SUCCESS'
            ? `Informantes colheram rumores parciais sobre os movimentos de tropas vizinhas.`
            : outcome === 'CRITICAL_FAILURE'
              ? `O informante foi capturado e interrogado pelos guardas inimigos, expondo nossa presença.`
              : `Informantes não encontraram movimentações atípicas e o rastro foi perdido.`,
        authorized: true
      }
    ];

    return {
      classification: 'PLAUSIBLE_UNMODELED',
      outcome,
      magnitude: costSd,
      probability,
      source: 'ENGINE_CALCULATED',
      stateChanges,
      consequences,
      reason: `Resolução de Espionagem: ${outcome} (roll=${roll}, atrito=${frictionThreshold}, custo=${costSd} SD).`
    };
  }

  // -------------------------------------------------------------------------
  // Category 4: Specialized Domain — DIPLOMACY
  // -------------------------------------------------------------------------
  if (
    actionLower.includes('diploma') ||
    actionLower.includes('emissário') ||
    actionLower.includes('aliança') ||
    actionLower.includes('tratado') ||
    actionLower.includes('pacto') ||
    actionLower.includes('visita formal')
  ) {
    const costSd = 10;
    if (treasurySd < costSd) {
      return {
        classification: 'PLAUSIBLE_UNMODELED',
        outcome: 'FAILURE',
        magnitude: 0,
        probability: 0,
        source: 'ENGINE_CALCULATED',
        stateChanges: [],
        consequences: [],
        reason: `Tesouraria insuficiente (${treasurySd} SD). Missões diplomáticas exigem ao menos ${costSd} SD para presentes protocolares e custas de comitiva.`
      };
    }

    const targetOpinion = getTargetOpinion(request.targetId, state);
    const repBonus = Math.min(3, Math.max(0, Math.floor((state.character?.reputation ?? 0) / 10)));
    const hasCounselor = state.advisors?.counselorName ? 1 : 0;
    const baseFriction = 13;
    const frictionThreshold = Math.max(2, Math.min(18, baseFriction - repBonus - hasCounselor - targetOpinion));

    const roll = rng.nextInt(1, 20);
    let outcome: GenericOutcome;

    if (roll === 1) {
      outcome = 'CRITICAL_FAILURE';
    } else if (roll >= frictionThreshold + 5) {
      outcome = 'SUCCESS';
    } else if (roll >= frictionThreshold) {
      outcome = 'PARTIAL_SUCCESS';
    } else {
      outcome = 'FAILURE';
    }

    const stateChanges: StateChange[] = [
      {
        path: 'weeklyLedger.silverdew',
        before: treasurySd,
        after: treasurySd - costSd,
        delta: -costSd
      }
    ];

    const rawProb = (21 - frictionThreshold) / 20;
    const probability = Number(Math.max(0.10, Math.min(0.85, rawProb)).toFixed(2));

    return {
      classification: 'PLAUSIBLE_UNMODELED',
      outcome,
      magnitude: costSd,
      probability,
      source: 'ENGINE_CALCULATED',
      stateChanges,
      consequences: [
        {
          consequenceId: `csq_diplo_${rng.nextInt(1000, 9999)}`,
          kind: 'IMMEDIATE',
          description: outcome === 'SUCCESS'
            ? `Emissários foram recebidos com honras e a Casa Nobre acolheu favoravelmente a proposta diplomática.`
            : outcome === 'PARTIAL_SUCCESS'
              ? `A corte vizinha aceitou ouvir nossos enviados, concordando com um pacto provisório de boa vizinhança.`
              : outcome === 'CRITICAL_FAILURE'
                ? `Houve um grave incidente protocolar; os emissários foram expulsos da fortaleza com insultos heráldicos.`
                : `A proposta diplomática foi recusada com frieza pela Casa nobre.`,
          authorized: true
        }
      ],
      reason: `Resolução de Diplomacia: ${outcome} (roll=${roll}, atrito=${frictionThreshold}, custo=${costSd} SD, afinidade=${targetOpinion}).`
    };
  }

  // -------------------------------------------------------------------------
  // Category 5: Specialized Domain — MILITARY (Batedores / Exercício / Patrulha)
  // -------------------------------------------------------------------------
  if (
    actionLower.includes('patrulha') ||
    actionLower.includes('batedor') ||
    actionLower.includes('exercício militar') ||
    actionLower.includes('treinar tropa') ||
    actionLower.includes('manobra') ||
    actionLower.includes('reconhecimento')
  ) {
    const laborCost = 15;
    if (laborAvailable < laborCost && state.holdings.garrison < 10) {
      return {
        classification: 'PLAUSIBLE_UNMODELED',
        outcome: 'FAILURE',
        magnitude: 0,
        probability: 0,
        source: 'ENGINE_CALCULATED',
        stateChanges: [],
        consequences: [],
        reason: 'Homens de armas e mão de obra insuficientes para mobilizar patrulhas ou exercícios táticos.'
      };
    }

    const commanderTier = state.character?.stats?.commanderTier ?? 1;
    const isWinter = state.weeklyLedger.season === 'Deepfrost';
    const baseFriction = 10;
    const frictionThreshold = Math.max(2, Math.min(18, baseFriction - commanderTier + (isWinter ? 3 : 0)));

    const roll = rng.nextInt(1, 20);
    let outcome: GenericOutcome;

    if (roll === 1) {
      outcome = 'CRITICAL_FAILURE';
    } else if (roll >= frictionThreshold + 5) {
      outcome = 'SUCCESS';
    } else if (roll >= frictionThreshold) {
      outcome = 'PARTIAL_SUCCESS';
    } else {
      outcome = 'FAILURE';
    }

    const stateChanges: StateChange[] = [];
    if (laborAvailable >= laborCost) {
      stateChanges.push({
        path: 'holdings.laborPool',
        before: laborAvailable,
        after: laborAvailable - laborCost,
        delta: -laborCost
      });
    }

    const rawProb = (21 - frictionThreshold) / 20;
    const probability = Number(Math.max(0.10, Math.min(0.85, rawProb)).toFixed(2));

    return {
      classification: 'PLAUSIBLE_UNMODELED',
      outcome,
      magnitude: laborCost,
      probability,
      source: 'ENGINE_CALCULATED',
      stateChanges,
      consequences: [
        {
          consequenceId: `csq_mil_${rng.nextInt(1000, 9999)}`,
          kind: 'IMMEDIATE',
          description: outcome === 'SUCCESS'
            ? `Manobras militares executadas com maestria; moral e vigilância das fronteiras elevados.`
            : outcome === 'PARTIAL_SUCCESS'
              ? `Patrulha de reconhecimento concluiu a rota sob condições adversas sem perdas.`
              : outcome === 'CRITICAL_FAILURE'
                ? `Patrulha sofreu emboscada nas trilhas florestais, sofrendo baixas e desorganização.`
                : `Manobras prejudicadas pelo terreno difícil e cansaço dos soldados.`,
          authorized: true
        }
      ],
      reason: `Resolução Militar: ${outcome} (roll=${roll}, atrito=${frictionThreshold}, mãoDeObra=${laborCost}).`
    };
  }

  // -------------------------------------------------------------------------
  // Category 6: Specialized Domain — INTRIGUE (Sabotagem / Chantagem / Conspiração)
  // -------------------------------------------------------------------------
  if (
    actionLower.includes('sabotar') ||
    actionLower.includes('conspirar') ||
    actionLower.includes('chantage') ||
    actionLower.includes('intriga') ||
    actionLower.includes('envenenar') ||
    actionLower.includes('desinformação')
  ) {
    const costSd = 25;
    if (treasurySd < costSd) {
      return {
        classification: 'PLAUSIBLE_UNMODELED',
        outcome: 'FAILURE',
        magnitude: 0,
        probability: 0,
        source: 'ENGINE_CALCULATED',
        stateChanges: [],
        consequences: [],
        reason: `Tesouraria insuficiente (${treasurySd} SD). Operações de intriga e sabotagem exigem ao menos ${costSd} SD para suborno e aluguel de assassinos.`
      };
    }

    const commanderTier = state.character?.stats?.commanderTier ?? 1;
    const repBonus = Math.min(2, Math.max(0, Math.floor((state.character?.reputation ?? 0) / 15)));
    const hasSpymaster = state.advisors?.spyMasterName ? 1 : 0;
    const baseFriction = 14;
    const frictionThreshold = Math.max(2, Math.min(18, baseFriction - commanderTier - repBonus - hasSpymaster));

    const roll = rng.nextInt(1, 20);
    let outcome: GenericOutcome;

    if (roll === 1) {
      outcome = 'CRITICAL_FAILURE';
    } else if (roll >= frictionThreshold + 5) {
      outcome = 'SUCCESS';
    } else if (roll >= frictionThreshold) {
      outcome = 'PARTIAL_SUCCESS';
    } else {
      outcome = 'FAILURE';
    }

    const stateChanges: StateChange[] = [
      {
        path: 'weeklyLedger.silverdew',
        before: treasurySd,
        after: treasurySd - costSd,
        delta: -costSd
      }
    ];

    const rawProb = (21 - frictionThreshold) / 20;
    const probability = Number(Math.max(0.10, Math.min(0.85, rawProb)).toFixed(2));

    return {
      classification: 'PLAUSIBLE_UNMODELED',
      outcome,
      magnitude: costSd,
      probability,
      source: 'ENGINE_CALCULATED',
      stateChanges,
      consequences: [
        {
          consequenceId: `csq_intrigue_${rng.nextInt(1000, 9999)}`,
          kind: 'IMMEDIATE',
          description: outcome === 'SUCCESS'
            ? `A intriga foi semeada com discrição nas cortes vizinhas, enfraquecendo a aliança rival.`
            : outcome === 'PARTIAL_SUCCESS'
              ? `A desinformação circulou nos salões nobres, criando desconfiança entre os capitães do alvo.`
              : outcome === 'CRITICAL_FAILURE'
                ? `A conspiração foi descoberta e ligada diretamente à nossa fortaleza, gerando fúria na corte.`
                : `A manobra foi frustrada pelos espiões da corte rival sem causar danos visíveis.`,
          authorized: true
        }
      ],
      reason: `Resolução de Intriga: ${outcome} (roll=${roll}, atrito=${frictionThreshold}, custo=${costSd} SD).`
    };
  }

  // -------------------------------------------------------------------------
  // Category 7: Generic Unmodeled Interaction (Fallback with Clamp)
  // -------------------------------------------------------------------------
  const frictionThreshold = calculateContextualFriction(10, state, {
    useLeadership: true,
    useReputation: true,
    useSeason: true
  });

  const roll = rng.nextInt(1, 20);
  let outcome: GenericOutcome;

  if (roll === 1) {
    outcome = 'CRITICAL_FAILURE';
  } else if (roll >= frictionThreshold + 5) {
    outcome = 'SUCCESS';
  } else if (roll >= frictionThreshold) {
    outcome = 'PARTIAL_SUCCESS';
  } else {
    outcome = 'FAILURE';
  }

  const rawProb = (21 - frictionThreshold) / 20;
  const probability = Number(Math.max(0.10, Math.min(0.85, rawProb)).toFixed(2));

  return {
    classification: 'PLAUSIBLE_UNMODELED',
    outcome,
    magnitude: 1,
    probability,
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
    reason: `Resolução genérica contextual executada: ${outcome} (roll=${roll}, atrito=${frictionThreshold}).`
  };
}

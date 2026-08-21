import { CampaignState } from '../types';
import { globalRNG, RandomService } from '../core/RandomService';
import { MagnitudeMode, MagnitudeRequest } from './narrativeContracts';
import { CapacityTier, RECRUITMENT_MRS_CONFIG } from './magnitudeConfig';

/**
 * Magnitude Resolution System (MRS v0.1) - first concrete implementation of the
 * Generic Resolution Philosophy (design doc section 2.1).
 *
 * Layer 1 (MRS, plausibility): derives a contextual plausible envelope from the
 * state (structural type, population, labor, standing military, treasury) and
 * the calibrated base = population * coefficient, intersected with the tier
 * envelope. Applies ONLY to ENGINE_DETERMINED requests.
 *
 * Layer 2 (Recruitment Rule, permission): the canonical rule's real constraints
 * (treasury 3 SD per soldier, labor 1 man per soldier) plus the Codex 41.6
 * weekly domain cap (10 soldiers per unit per week). Never clamps: a FIXED or
 * RANGE request outside the rule limits is REJECTED (feasible=false).
 *
 * Determinism: all draws come from the injected RandomService (LCG). Production
 * uses the shared globalRNG; tests and the calibration simulation inject local
 * seeded instances and never touch the global stream.
 */

export type MagnitudeSource = 'PLAYER_EXPLICIT' | 'ENGINE_CALCULATED';

export interface MagnitudeResolution {
  readonly mode: MagnitudeMode;
  /** Resolved magnitude when feasible. */
  readonly value?: number;
  /** Final resolved envelope lower bound (informative). */
  readonly min?: number;
  /** Final resolved envelope upper bound (informative). */
  readonly max?: number;
  readonly source: MagnitudeSource;
  readonly feasible: boolean;
  /** Deterministic rejection reason when not feasible (may be INVALID_PARAMETER-prefixed). */
  readonly reason?: string;
}

function infeasible(mode: MagnitudeMode, reason: string): MagnitudeResolution {
  return { mode, source: 'ENGINE_CALCULATED', feasible: false, reason };
}

function laborPoolOf(state: CampaignState): number {
  return state.holdings.laborPool;
}

function standingMilitary(state: CampaignState): number {
  const armySize = (state.army?.units ?? []).reduce((sum, unit) => sum + unit.size, 0);
  return armySize + (state.holdings?.garrison ?? 0);
}

function componentTier(value: number, thresholds: readonly number[]): number {
  let tier = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (value >= thresholds[i]) tier = i + 2;
  }
  return tier;
}

/**
 * Contextual capacity tier (1..5) blending structural type, population, labor,
 * standing military and treasury against the calibrated thresholds.
 */
export function capacityTier(state: CampaignState): CapacityTier {
  const config = RECRUITMENT_MRS_CONFIG;
  const structural = config.structuralTypeTier[state.holdings.type] ?? 1;
  const population = componentTier(state.holdings.population, config.tierThresholds.population);
  const labor = componentTier(laborPoolOf(state), config.tierThresholds.labor);
  const military = componentTier(standingMilitary(state), config.tierThresholds.military);
  const treasury = componentTier(state.weeklyLedger.silverdew, config.tierThresholds.treasury);

  const blended =
    config.tierWeights.structural * structural +
    config.tierWeights.population * population +
    config.tierWeights.labor * labor +
    config.tierWeights.military * military +
    config.tierWeights.treasury * treasury;

  return Math.min(5, Math.max(1, Math.round(blended))) as CapacityTier;
}

/**
 * Layer 2 permission cap: the canonical RECRUIT rule's actual constraints plus
 * the Codex 41.6 weekly domain cap. The unit maxSize room is deliberately NOT a
 * cap: the canonical applier grows maxSize together with size (a Levy unit's
 * capacity expands with recruitment), so the rule never rejects on room.
 */
function ruleCap(state: CampaignState): number {
  const config = RECRUITMENT_MRS_CONFIG;
  const tier = capacityTier(state);
  const budget = Math.floor(state.weeklyLedger.silverdew / config.costs.sdPerSoldier);
  const labor = Math.floor(laborPoolOf(state) / config.costs.laborPerSoldier);
  const tierCap = config.weeklyCapByTier[tier] ?? config.weeklyCapPerUnit;
  return Math.min(budget, labor, tierCap);
}

function plausibleEnvelope(state: CampaignState): { min: number; max: number } {
  const config = RECRUITMENT_MRS_CONFIG;
  const tier = capacityTier(state);
  const [envelopeMin, envelopeMax] = config.tierEnvelope[tier];
  const base = Math.round(state.holdings.population * config.coefficient);
  const baseMin = Math.floor(base * config.envelope.min);
  const baseMax = Math.ceil(base * config.envelope.max);
  return {
    min: Math.max(envelopeMin, baseMin),
    max: Math.min(envelopeMax, baseMax)
  };
}

function resolveEngineDetermined(state: CampaignState, rng: RandomService): MagnitudeResolution {
  const plausible = plausibleEnvelope(state);
  const cap = ruleCap(state);
  const finalMax = Math.min(plausible.max, cap);
  const finalMin = Math.min(plausible.min, finalMax);

  if (finalMin < 1) {
    return infeasible(
      'ENGINE_DETERMINED',
      'Recrutamento RECUSADO (MAGNITUDE). Nenhuma magnitude plausível é viável com o estado atual do World Ledger; nenhuma quantidade foi liberada.'
    );
  }

  return {
    mode: 'ENGINE_DETERMINED',
    value: rng.nextInt(finalMin, finalMax),
    min: finalMin,
    max: finalMax,
    source: 'ENGINE_CALCULATED',
    feasible: true
  };
}

function resolveFixed(request: MagnitudeRequest, state: CampaignState): MagnitudeResolution {
  const value = request.value;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    return infeasible('FIXED', 'INVALID_PARAMETER: "magnitude.value" deve ser um inteiro >= 1 para o modo FIXED.');
  }

  const cap = ruleCap(state);
  if (value > cap) {
    return infeasible(
      'FIXED',
      `Recrutamento RECUSADO (MAGNITUDE). A magnitude solicitada (${value}) excede os limites da regra de recrutamento (${cap}); nenhuma quantidade foi liberada.`
    );
  }

  return { mode: 'FIXED', value, min: value, max: value, source: 'PLAYER_EXPLICIT', feasible: true };
}

function resolveRange(request: MagnitudeRequest, state: CampaignState, rng: RandomService): MagnitudeResolution {
  const range = request.range;
  if (
    !Array.isArray(range) ||
    range.length !== 2 ||
    typeof range[0] !== 'number' ||
    typeof range[1] !== 'number' ||
    !Number.isInteger(range[0]) ||
    !Number.isInteger(range[1]) ||
    range[0] < 1 ||
    range[1] < range[0]
  ) {
    return infeasible('RANGE', 'INVALID_PARAMETER: "magnitude.range" deve ser [min, max] com inteiros >= 1 e min <= max.');
  }

  const cap = ruleCap(state);
  const lo = Math.max(range[0], 1);
  const hi = Math.min(range[1], cap);

  if (lo > hi) {
    return infeasible(
      'RANGE',
      `Recrutamento RECUSADO (MAGNITUDE). Nenhum valor do intervalo solicitado [${range[0]}, ${range[1]}] é viável com os limites da regra de recrutamento (${cap}); nenhuma quantidade foi liberada.`
    );
  }

  return { mode: 'RANGE', value: rng.nextInt(lo, hi), min: lo, max: hi, source: 'PLAYER_EXPLICIT', feasible: true };
}

/**
 * Resolves a RECRUIT magnitude request against the two-layer pipeline.
 *
 * An undefined request means full engine determination (ENGINE_DETERMINED).
 * Deterministic for the same request/state/rng seed.
 */
export function resolveMagnitude(
  action: 'RECRUIT',
  request: MagnitudeRequest | undefined,
  state: CampaignState,
  rng: RandomService = globalRNG
): MagnitudeResolution {
  if (action !== 'RECRUIT') {
    return infeasible('ENGINE_DETERMINED', `MRS v0.1 não está definido para a ação ${action}; nenhuma magnitude foi liberada.`);
  }

  const mode: MagnitudeMode = request?.mode ?? 'ENGINE_DETERMINED';

  switch (mode) {
    case 'ENGINE_DETERMINED':
      return resolveEngineDetermined(state, rng);
    case 'FIXED':
      return resolveFixed(request!, state);
    case 'RANGE':
      return resolveRange(request!, state, rng);
    default:
      return infeasible('ENGINE_DETERMINED', 'INVALID_PARAMETER: modo de magnitude desconhecido.');
  }
}
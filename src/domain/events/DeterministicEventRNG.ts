import { EventOpportunity } from './EventOpportunityEngine';
import { CooldownPolicy, RecentEventSummary } from './CooldownPolicy';

export interface DeterministicEventSelectionInput {
  readonly campaignSeed: string | number;
  readonly absoluteTurn: number;
  readonly slotIndex: number;
  readonly domain: string;
  readonly opportunities: readonly EventOpportunity[];
  readonly recentEvents?: readonly RecentEventSummary[];
  readonly cooldownOverrides?: Readonly<Record<string, number>>;
}

export interface DeterministicEventSelectionResult {
  readonly selected: EventOpportunity | null;
  readonly roll: number;
  readonly seedMaterial: string;
  readonly candidates: readonly EventOpportunity[];
}

/**
 * Deterministic PRNG implementation (Mulberry32 + FNV-1a Hash).
 * Produces 100% reproducible pseudo-random numbers from a composite key string.
 */
export class DeterministicEventRNG {
  /**
   * Computes a 32-bit FNV-1a hash from a string key.
   */
  public static hashString(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  /**
   * Mulberry32 algorithm returning a deterministic float in [0, 1).
   */
  public static mulberry32(seed: number): number {
    let t = (seed + 0x6D2B79F5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Selects an EventOpportunity deterministically from candidates using weighted selection.
   */
  public static selectEvent(
    input: DeterministicEventSelectionInput
  ): DeterministicEventSelectionResult {
    // 1. Filtrar candidatos com CooldownPolicy
    const availableCandidates = CooldownPolicy.filterAvailableOpportunities(
      input.opportunities,
      input.absoluteTurn,
      input.recentEvents ?? [],
      input.cooldownOverrides
    );

    // 2. Se não houver candidatos elegíveis com peso > 0, retornar null
    if (availableCandidates.length === 0) {
      const seedMaterial = `${input.campaignSeed}|${input.absoluteTurn}|${input.slotIndex}|${input.domain}`;
      return {
        selected: null,
        roll: 0,
        seedMaterial,
        candidates: []
      };
    }

    // 3. Montar a chave canônica determinística
    const seedMaterial = `${input.campaignSeed}|${input.absoluteTurn}|${input.slotIndex}|${input.domain}`;
    const hash = this.hashString(seedMaterial);
    const roll = this.mulberry32(hash);

    // 4. Seleção ponderada
    const totalWeight = availableCandidates.reduce((sum, opp) => sum + opp.weight, 0);
    if (totalWeight <= 0) {
      return {
        selected: null,
        roll,
        seedMaterial,
        candidates: availableCandidates
      };
    }

    const target = roll * totalWeight;
    let accumulated = 0;
    let selected: EventOpportunity = availableCandidates[availableCandidates.length - 1];

    for (const opp of availableCandidates) {
      accumulated += opp.weight;
      if (target < accumulated) {
        selected = opp;
        break;
      }
    }

    return {
      selected,
      roll,
      seedMaterial,
      candidates: availableCandidates
    };
  }
}

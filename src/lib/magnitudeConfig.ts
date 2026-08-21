import { Holdings } from '../types';

/**
 * Centralized Magnitude Resolution System (MRS v0.1) configuration for RECRUIT.
 *
 * Every numeric knob of the MRS lives here and nowhere else. No number in
 * magnitudeResolution.ts, narrativeExecution.ts or the simulation tool may be
 * hardcoded outside this object.
 *
 * Canonical sources (Codex, AOS v4.7):
 *   - coefficient 0.012: calibrated against §40.14 mercenary bands
 *     (20-50 / 50-150 / 150-300 / 300-500), §45.1 commander tiers and §A.104
 *     minor lords (50-100 Levy -> 300-400 Elite) - see
 *     docs/development/NARRATIVE_MAGNITUDE_CALIBRATION_AUDIT.md.
 *   - envelope +-25% and tier envelopes: owner-approved calibration decision.
 *   - costs.sdPerSoldier: ruleResolver canonical unit cost (3 SD per soldier,
 *     §69.3 100 soldiers = 300 SD base equipment).
 *   - costs.laborPerSoldier: canonical manpower condition (1 man per soldier).
 *   - weeklyCapPerUnit: Codex §41.6 (max 10 soldiers per unit per week) as a
 *     domain rule enforced by the Recruitment Rule layer, never clamped by the
 *     MRS plausibility layer.
 *   - structuralTypeTier: structural modifier per holding type (Capital tier 5
 *     reserved for a future type; Walled City tops the current union).
 */
export type CapacityTier = 1 | 2 | 3 | 4 | 5;

export interface MagnitudeTierEnvelope {
  readonly 1: readonly [number, number];
  readonly 2: readonly [number, number];
  readonly 3: readonly [number, number];
  readonly 4: readonly [number, number];
  readonly 5: readonly [number, number];
}

export interface RecruitmentMRSConfig {
  readonly version: string;
  readonly coefficient: number;
  readonly envelope: {
    readonly min: number;
    readonly max: number;
  };
  readonly tierEnvelope: MagnitudeTierEnvelope;
  readonly tierWeights: {
    readonly structural: number;
    readonly population: number;
    readonly labor: number;
    readonly military: number;
    readonly treasury: number;
  };
  readonly tierThresholds: {
    readonly population: readonly number[];
    readonly labor: readonly number[];
    readonly military: readonly number[];
    readonly treasury: readonly number[];
  };
  readonly structuralTypeTier: Readonly<Record<Holdings['type'], number>>;
  readonly costs: {
    readonly sdPerSoldier: number;
    readonly laborPerSoldier: number;
  };
  readonly weeklyCapPerUnit: number;
}

export const RECRUITMENT_MRS_CONFIG: RecruitmentMRSConfig = Object.freeze<RecruitmentMRSConfig>({
  version: '0.1.0',
  coefficient: 0.012,
  envelope: {
    min: 0.75,
    max: 1.25
  },
  tierEnvelope: {
    1: [5, 15],
    2: [15, 30],
    3: [30, 60],
    4: [50, 100],
    5: [100, 250]
  },
  tierWeights: {
    structural: 0.4,
    population: 0.25,
    labor: 0.15,
    military: 0.1,
    treasury: 0.1
  },
  tierThresholds: {
    population: [1000, 2500, 5000, 10000],
    labor: [400, 1000, 2000, 4000],
    military: [100, 250, 500, 1000],
    treasury: [200, 1000, 2500, 5000]
  },
  structuralTypeTier: {
    Bastion: 1,
    'Fortified Town': 2,
    Castle: 3,
    'Walled City': 4
  },
  costs: {
    sdPerSoldier: 3,
    laborPerSoldier: 1
  },
  weeklyCapPerUnit: 10
});
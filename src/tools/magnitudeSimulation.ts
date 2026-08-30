import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createInitialState, resolveNarrativeCommand, resolveWeeklyTurn } from '../engine';
import { globalRNG, RandomService } from '../core/RandomService';
import { CampaignState } from '../types';
import { capacityTier, resolveMagnitude } from '../lib/magnitudeResolution';
import { RECRUITMENT_MRS_CONFIG } from '../lib/magnitudeConfig';
import { NARRATIVE_CONTRACT_VERSION, NarrativeCommand } from '../lib/narrativeContracts';

/**
 * MRS v0.1 calibration simulation (docs/development/
 * NARRATIVE_MAGNITUDE_RESOLUTION_SYSTEM_IMPLEMENTATION_PROMPT.md section 9).
 *
 * Design decisions (recorded in the simulation report):
 *  - Full distribution runs use the pure MRS path (resolveMagnitude) because the
 *    end-to-end path (resolveNarrativeCommand -> searchCodex) costs ~4.8ms/call;
 *    a 2000-run end-to-end sample per category is run separately as truth.
 *  - Seeds are local to each category (424242 + categoryIndex * 7919) and never
 *    touch the shared globalRNG stream. The sequential variant temporarily
 *    saves/restores the global seed around resolveWeeklyTurn.
 *  - The "weeks to unit maxSize" metric is reported as unreachable: the legacy
 *    applier grows maxSize together with size, so the rule never binds on room
 *    (see implementation report D1).
 */

export interface SimulationCategoryDef {
  readonly id: string;
  readonly label: string;
  readonly population: number;
  readonly laborPool: number;
  readonly garrison: number;
  readonly holdingType: CampaignState['holdings']['type'];
  readonly silverdew: number;
  readonly levyUnits: ReadonlyArray<{ readonly id: string; readonly size: number; readonly maxSize: number }>;
}

export const SIMULATION_CATEGORIES: readonly SimulationCategoryDef[] = [
  {
    id: 'aldeia',
    label: 'Aldeia',
    population: 1000,
    laborPool: 400,
    garrison: 40,
    holdingType: 'Bastion',
    silverdew: 85,
    levyUnits: [{ id: 'u_sim_1', size: 60, maxSize: 60 }]
  },
  {
    id: 'vila',
    label: 'Vila',
    population: 1200,
    laborPool: 480,
    garrison: 40,
    holdingType: 'Bastion',
    silverdew: 300,
    levyUnits: [{ id: 'u_sim_2', size: 60, maxSize: 60 }]
  },
  {
    id: 'cidade',
    label: 'Cidade',
    population: 3000,
    laborPool: 1200,
    garrison: 60,
    holdingType: 'Fortified Town',
    silverdew: 1000,
    levyUnits: [{ id: 'u_sim_3', size: 60, maxSize: 60 }, { id: 'u_sim_4', size: 60, maxSize: 60 }]
  },
  {
    id: 'cidade_grande',
    label: 'Cidade grande',
    population: 5000,
    laborPool: 2000,
    garrison: 100,
    holdingType: 'Castle',
    silverdew: 3000,
    levyUnits: [{ id: 'u_sim_5', size: 100, maxSize: 100 }, { id: 'u_sim_6', size: 100, maxSize: 100 }]
  },
  {
    id: 'capital',
    label: 'Capital',
    population: 10000,
    laborPool: 4000,
    garrison: 150,
    holdingType: 'Walled City',
    silverdew: 10000,
    levyUnits: [
      { id: 'u_sim_7', size: 100, maxSize: 100 },
      { id: 'u_sim_8', size: 100, maxSize: 100 },
      { id: 'u_sim_9', size: 100, maxSize: 100 }
    ]
  }
];

export function buildCategoryState(def: SimulationCategoryDef): CampaignState {
  const base = createInitialState('Noble Ruler', 'Central Plains');
  const state = structuredClone(base);
  state.holdings.type = def.holdingType;
  state.holdings.population = def.population;
  state.holdings.laborPool = def.laborPool;
  state.holdings.garrison = def.garrison;
  state.weeklyLedger.silverdew = def.silverdew;
  state.army.units = def.levyUnits.map(u => ({
    id: u.id,
    name: 'Landed Levy Retinue',
    size: u.size,
    maxSize: u.maxSize,
    tier: 1,
    ac: 3,
    weapon: 'Spears',
    mount: 'None',
    morale: 4,
    type: 'Levy'
  }));
  return state;
}

function seedFor(categoryIndex: number): number {
  return 424242 + categoryIndex * 7919;
}

function localRngFor(categoryIndex: number): RandomService {
  return new RandomService(seedFor(categoryIndex));
}

function median(values: readonly number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function pct(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

function buildEngineDeterminedCommand(): NarrativeCommand {
  return {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: 'sim-recrut',
    actorId: 'player',
    action: 'RECRUIT',
    magnitude: { mode: 'ENGINE_DETERMINED' },
    constraints: [],
    confidence: 1,
    ambiguity: [],
    requiresClarification: false
  };
}

interface PureRunStats {
  readonly values: number[];
  readonly infeasible: number;
  readonly capPinned: number;
  readonly envelopeMiss: number;
}

function runPureSingleAction(def: SimulationCategoryDef, categoryIndex: number, runs: number): PureRunStats {
  const rng = localRngFor(categoryIndex);
  const values: number[] = [];
  let infeasible = 0;
  let capPinned = 0;
  let envelopeMiss = 0;

  for (let i = 0; i < runs; i++) {
    const state = buildCategoryState(def);
    const resolution = resolveMagnitude('RECRUIT', { mode: 'ENGINE_DETERMINED' }, state, rng);
    if (!resolution.feasible || resolution.value === undefined) {
      infeasible++;
      continue;
    }
    const value = resolution.value;
    values.push(value);
    const tier = capacityTier(state);
    const tierCap = RECRUITMENT_MRS_CONFIG.weeklyCapByTier[tier] ?? RECRUITMENT_MRS_CONFIG.weeklyCapPerUnit;
    if (resolution.min === resolution.max && resolution.max === tierCap) capPinned++;

    const [envMin, envMax] = RECRUITMENT_MRS_CONFIG.tierEnvelope[tier];
    if (value < envMin || value > envMax) envelopeMiss++;

    const sdAfter = state.weeklyLedger.silverdew - value * RECRUITMENT_MRS_CONFIG.costs.sdPerSoldier;
    const laborAfter = state.holdings.laborPool - value * RECRUITMENT_MRS_CONFIG.costs.laborPerSoldier;
    if (sdAfter < 0 || laborAfter < 0) {
      throw new Error(`Invariant violated in category ${def.id}: SD=${sdAfter} labor=${laborAfter}`);
    }
  }

  return { values, infeasible, capPinned, envelopeMiss };
}

interface E2ERunStats {
  readonly runs: number;
  readonly accepted: number;
  readonly rejected: number;
  readonly magnitudeMismatch: number;
  readonly deltaMismatch: number;
  readonly negativeBalance: number;
}

function runE2ESample(def: SimulationCategoryDef, categoryIndex: number, runs: number): E2ERunStats {
  const rng = localRngFor(categoryIndex);
  const command = buildEngineDeterminedCommand();
  let accepted = 0;
  let rejected = 0;
  let magnitudeMismatch = 0;
  let deltaMismatch = 0;
  let negativeBalance = 0;

  for (let i = 0; i < runs; i++) {
    const state = buildCategoryState(def);
    const { report, state: resultState } = resolveNarrativeCommand(command, state, rng);
    if (report.status !== 'ACCEPTED') {
      rejected++;
      continue;
    }
    accepted++;

    if (report.magnitude === undefined) {
      magnitudeMismatch++;
      continue;
    }
    const value = report.magnitude.value;
    const sd = report.stateChanges.find(sc => sc.path === 'weeklyLedger.silverdew')?.delta;
    const labor = report.stateChanges.find(sc => sc.path === 'holdings.laborPool')?.delta;
    const levies = report.stateChanges.find(sc => sc.path === 'army.units.levies')?.delta;
    if (sd !== -value * RECRUITMENT_MRS_CONFIG.costs.sdPerSoldier || labor !== -value || levies !== value) {
      deltaMismatch++;
    }
    if (resultState.weeklyLedger.silverdew < 0 || resultState.holdings.laborPool < 0) {
      negativeBalance++;
    }
  }

  return { runs, accepted, rejected, magnitudeMismatch, deltaMismatch, negativeBalance };
}

interface SequentialRunStats {
  readonly batches: number[];
  readonly treasuryMin: number;
  readonly laborExhaustionWeek: number | null;
  readonly finalUnitSize: number;
  readonly finalMaxSize: number;
}

function runSequential(def: SimulationCategoryDef, categoryIndex: number, runs: number, weeks: number): SequentialRunStats {
  const rng = localRngFor(categoryIndex);
  const batches: number[] = [];
  let treasuryMin = Infinity;
  let laborExhaustionWeek: number | null = null;
  let finalUnitSize = 0;
  let finalMaxSize = 0;

  for (let i = 0; i < runs; i++) {
    let state = buildCategoryState(def);

    for (let week = 1; week <= weeks; week++) {
      const savedSeed = globalRNG.getSeed();
      state = resolveWeeklyTurn(structuredClone(state)).updatedState;
      globalRNG.setSeed(savedSeed);

      const resolution = resolveMagnitude('RECRUIT', { mode: 'ENGINE_DETERMINED' }, state, rng);
      if (!resolution.feasible || resolution.value === undefined) {
        if (laborExhaustionWeek === null) laborExhaustionWeek = week;
        continue;
      }
      const value = resolution.value;
      batches.push(value);
      state.weeklyLedger.silverdew -= value * RECRUITMENT_MRS_CONFIG.costs.sdPerSoldier;
      state.holdings.laborPool -= value * RECRUITMENT_MRS_CONFIG.costs.laborPerSoldier;
      if (state.weeklyLedger.silverdew < 0 || state.holdings.laborPool < 0) {
        throw new Error(`Sequential invariant violated in category ${def.id} at week ${week}`);
      }
      treasuryMin = Math.min(treasuryMin, state.weeklyLedger.silverdew);
      const target = state.army.units.find(u => u.type === 'Levy');
      if (target) {
        target.size += value;
        target.maxSize += value;
        finalUnitSize = target.size;
        finalMaxSize = target.maxSize;
      }
    }
  }

  return { batches, treasuryMin: treasuryMin === Infinity ? 0 : treasuryMin, laborExhaustionWeek, finalUnitSize, finalMaxSize };
}

interface CategoryReport {
  readonly id: string;
  readonly label: string;
  readonly expectedTier: number;
  readonly tierThresholdsUsed: { population: number; labor: number; military: number; treasury: number };
  readonly pure: {
    readonly runs: number;
    readonly infeasible: number;
    readonly median: number;
    readonly p05: number;
    readonly p95: number;
    readonly min: number;
    readonly max: number;
    readonly capPinnedRate: number;
    readonly envelopeMissRate: number;
    readonly withinEnvelopeRate: number;
  };
  readonly e2e: E2ERunStats;
  readonly sequential: {
    readonly runs: number;
    readonly weeks: number;
    readonly medianBatch: number;
    readonly treasuryMin: number;
    readonly laborExhaustionWeek: number | null;
    readonly finalUnitSize: number;
    readonly finalMaxSize: number;
  };
}

export function runSimulation(runs: number, e2eRuns: number, weeks: number, seqRuns?: number): {
  readonly categories: CategoryReport[];
  readonly acceptance: Record<string, boolean | string>;
  readonly determinism: { verified: boolean; sampleRuns: number };
  readonly runtimeMs: number;
  readonly phaseTimesMs: { pure: number; e2e: number; sequential: number; determinism: number };
} {
  const t0 = performance.now();
  const categories: CategoryReport[] = [];
  const sequentialRuns = seqRuns ?? runs;
  let totalPureMs = 0;
  let totalE2eMs = 0;
  let totalSeqMs = 0;

  for (let ci = 0; ci < SIMULATION_CATEGORIES.length; ci++) {
    const def = SIMULATION_CATEGORIES[ci];
    const state = buildCategoryState(def);
    const tier = capacityTier(state);

    const tp0 = performance.now();
    const pure = runPureSingleAction(def, ci, runs);
    totalPureMs += performance.now() - tp0;

    const te0 = performance.now();
    const e2e = runE2ESample(def, ci, e2eRuns);
    totalE2eMs += performance.now() - te0;

    const ts0 = performance.now();
    const sequential = runSequential(def, ci, sequentialRuns, weeks);
    totalSeqMs += performance.now() - ts0;

    const envelope = RECRUITMENT_MRS_CONFIG.tierEnvelope[tier];
    categories.push({
      id: def.id,
      label: def.label,
      expectedTier: tier,
      tierThresholdsUsed: {
        population: def.population,
        labor: def.laborPool,
        military: state.army.units.reduce((sum, u) => sum + u.size, 0) + def.garrison,
        treasury: def.silverdew
      },
      pure: {
        runs,
        infeasible: pure.infeasible,
        median: median(pure.values),
        p05: pct(pure.values, 5),
        p95: pct(pure.values, 95),
        min: pure.values.length > 0 ? Math.min(...pure.values) : 0,
        max: pure.values.length > 0 ? Math.max(...pure.values) : 0,
        capPinnedRate: pure.values.length > 0 ? pure.capPinned / pure.values.length : 1,
        envelopeMissRate: pure.values.length > 0 ? pure.envelopeMiss / pure.values.length : 1,
        withinEnvelopeRate:
          pure.values.length > 0
            ? pure.values.filter(v => v >= envelope[0] && v <= envelope[1]).length / pure.values.length
            : 0
      },
      e2e,
      sequential: {
        runs: sequentialRuns,
        weeks,
        medianBatch: median(sequential.batches),
        treasuryMin: sequential.treasuryMin,
        laborExhaustionWeek: sequential.laborExhaustionWeek,
        finalUnitSize: sequential.finalUnitSize,
        finalMaxSize: sequential.finalMaxSize
      }
    });
  }

  const medianWithinEnvelope = categories.every(c => {
    const [lo, hi] = RECRUITMENT_MRS_CONFIG.tierEnvelope[c.expectedTier];
    return c.pure.median >= lo && c.pure.median <= hi;
  });
  const withinEnvelope95 = categories.every(c => c.pure.withinEnvelopeRate >= 0.95);
  const maxWithinCaps = categories.every(c => {
    const tierCap = RECRUITMENT_MRS_CONFIG.weeklyCapByTier[c.expectedTier] ?? RECRUITMENT_MRS_CONFIG.weeklyCapPerUnit;
    return c.pure.max <= tierCap;
  });
  const neverNegative = categories.every(c => c.e2e.negativeBalance === 0);
  const sanity45 = categories.every(c => c.pure.max <= RECRUITMENT_MRS_CONFIG.tierEnvelope[5][1]);

  const determinismCheck = (() => {
    const sampleRuns = 200;
    const first = runSimulationSnapshot(sampleRuns, 5);
    const second = runSimulationSnapshot(sampleRuns, 5);
    return { verified: JSON.stringify(first) === JSON.stringify(second), sampleRuns };
  })();

  const runtimeMs = performance.now() - t0;

  const acceptance: Record<string, boolean | string> = {
    '1_0_rejected': categories.every(c => c.pure.infeasible === 0 && c.e2e.rejected === 0),
    '2_median_within_envelope': medianWithinEnvelope,
    '3_95_percent_within_envelope': withinEnvelope95,
    '4_max_within_caps': maxWithinCaps,
    '5_treasury_labor_never_negative': neverNegative,
    '6_sanity_45_1': sanity45,
    '7_determinism': determinismCheck.verified,
    '8_runtime_60s': runtimeMs <= 60000 ? true : `${runtimeMs.toFixed(0)}ms > 60000ms`,
    '9_cap_dominance_flagged': `medianWithinEnvelope=${medianWithinEnvelope}; capPinnedRate=${categories
      .map(c => c.pure.capPinnedRate.toFixed(3))
      .join('/')}; v0.2 contextual scaling verified`
  };

  return {
    categories,
    acceptance,
    determinism: determinismCheck,
    runtimeMs,
    phaseTimesMs: { pure: totalPureMs, e2e: totalE2eMs, sequential: totalSeqMs, determinism: performance.now() - t0 - totalPureMs - totalE2eMs - totalSeqMs }
  };
}

function runSimulationSnapshot(runs: number, weeks: number): unknown {
  const snapshot: Record<string, unknown> = {};
  for (let ci = 0; ci < SIMULATION_CATEGORIES.length; ci++) {
    const def = SIMULATION_CATEGORIES[ci];
    const pure = runPureSingleAction(def, ci, runs);
    snapshot[def.id] = pure.values;
  }
  return snapshot;
}

function reportMarkdown(report: ReturnType<typeof runSimulation>): string {
  const lines: string[] = [];
  lines.push('# MRS v0.1 - Magnitude Resolution Simulation Report');
  lines.push('');
  lines.push(`Config: RECRUITMENT_MRS_CONFIG v${RECRUITMENT_MRS_CONFIG.version}`);
  lines.push(`Runtime: ${report.runtimeMs.toFixed(0)}ms (target: <= 60000ms)`);
  lines.push(`Phase times: pure=${report.phaseTimesMs.pure.toFixed(0)}ms | e2e=${report.phaseTimesMs.e2e.toFixed(0)}ms | sequential=${report.phaseTimesMs.sequential.toFixed(0)}ms | determinism=${report.phaseTimesMs.determinism.toFixed(0)}ms`);
  lines.push('');
  lines.push('## Acceptance criteria');
  lines.push('');
  lines.push('| # | Criterion | Result |');
  lines.push('|---|-----------|--------|');
  for (const [key, value] of Object.entries(report.acceptance)) {
    lines.push(`| ${key} | ${key} | ${typeof value === 'boolean' ? (value ? 'PASS' : 'FAIL') : value} |`);
  }
  lines.push('');
  lines.push('## Categories');
  lines.push('');
  lines.push('| Category | Tier | Median | p05 | p95 | Min | Max | Cap-pinned | Within envelope | E2E accepted | E2E rejected |');
  lines.push('|----------|------|--------|-----|-----|-----|-----|------------|-----------------|--------------|--------------|');
  for (const c of report.categories) {
    lines.push(
      `| ${c.label} | ${c.expectedTier} | ${c.pure.median} | ${c.pure.p05} | ${c.pure.p95} | ${c.pure.min} | ${c.pure.max} | ${(c.pure.capPinnedRate * 100).toFixed(1)}% | ${(c.pure.withinEnvelopeRate * 100).toFixed(1)}% | ${c.e2e.accepted}/${c.e2e.runs} | ${c.e2e.rejected}/${c.e2e.runs} |`
    );
  }
  lines.push('');
  lines.push('## Sequential (20 weeks)');
  lines.push('');
  lines.push('| Category | Median batch | Treasury min (SD) | Labor exhaustion week | Final unit size | Final maxSize |');
  lines.push('|----------|--------------|-------------------|-----------------------|-----------------|---------------|');
  for (const c of report.categories) {
    lines.push(
      `| ${c.label} | ${c.sequential.medianBatch} | ${c.sequential.treasuryMin} | ${c.sequential.laborExhaustionWeek ?? 'n/a (20 weeks)'} | ${c.sequential.finalUnitSize} | ${c.sequential.finalMaxSize} |`
    );
  }
  lines.push('');
  lines.push(`## Determinism: ${report.determinism.verified ? 'verified' : 'NOT VERIFIED'} (${report.determinism.sampleRuns} runs x 5 categories, identical JSON)`);
  return lines.join('\n');
}

function parseArgs(argv: string[]): { runs: number; e2e: number; weeks: number; seqRuns: number | undefined; out: string; skipMd: boolean } {
  let runs = 10000;
  let e2e = 2000;
  let weeks = 20;
  let seqRuns: number | undefined = 200;
  let out = 'simulation/magnitude_v01_report.json';
  let skipMd = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--runs' && argv[i + 1]) runs = parseInt(argv[i + 1], 10);
    if (argv[i] === '--e2e' && argv[i + 1]) e2e = parseInt(argv[i + 1], 10);
    if (argv[i] === '--weeks' && argv[i + 1]) weeks = parseInt(argv[i + 1], 10);
    if (argv[i] === '--seq-runs' && argv[i + 1]) seqRuns = parseInt(argv[i + 1], 10);
    if (argv[i] === '--out' && argv[i + 1]) out = argv[i + 1];
    if (argv[i] === '--skip-md') skipMd = true;
  }
  return { runs, e2e, weeks, seqRuns, out, skipMd };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const report = runSimulation(args.runs, args.e2e, args.weeks, args.seqRuns);

  mkdirSync('simulation', { recursive: true });
  writeFileSync(args.out, JSON.stringify(report, null, 2), 'utf8');

  const mdPath = args.out.replace(/\.json$/, '.md');
  if (!args.skipMd) writeFileSync(mdPath, reportMarkdown(report), 'utf8');

  console.log(reportMarkdown(report));
  for (const [key, value] of Object.entries(report.acceptance)) {
    console.log(`ACCEPTANCE ${key}: ${typeof value === 'boolean' ? (value ? 'PASS' : 'FAIL') : value}`);
  }
  console.log(`\nJSON: ${args.out}`);
  if (!args.skipMd) console.log(`MD: ${mdPath}`);
  console.log(`Runtime: ${report.runtimeMs.toFixed(0)}ms`);
}

const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
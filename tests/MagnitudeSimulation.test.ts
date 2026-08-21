import assert from 'node:assert/strict';
import { RandomService } from '../src/core/RandomService';
import { capacityTier, resolveMagnitude } from '../src/lib/magnitudeResolution';
import { RECRUITMENT_MRS_CONFIG } from '../src/lib/magnitudeConfig';
import {
  buildCategoryState,
  runSimulation,
  SIMULATION_CATEGORIES
} from '../src/tools/magnitudeSimulation';

// ---------------------------------------------------------------------------
// Categorias: estados coerentes e tiers esperados
// ---------------------------------------------------------------------------
{
  assert.equal(SIMULATION_CATEGORIES.length, 5, '5 categorias de calibração');
  const tiers = SIMULATION_CATEGORIES.map((def, idx) => {
    const state = buildCategoryState(def);
    const military = state.army.units.reduce((s, u) => s + u.size, 0) + state.holdings.garrison;
    assert.ok(state.holdings.population > 0 && state.holdings.laborPool > 0 && military > 0 && state.weeklyLedger.silverdew > 0);
    assert.equal(state.army.units.filter(u => u.type === 'Levy').length, def.levyUnits.length);
    return { id: def.id, tier: capacityTier(state) };
  });
  assert.deepEqual(tiers.map(t => t.tier), [2, 2, 3, 4, 4], 'Tiers contextuais esperados por categoria');
  console.log('[CATEGORIAS] 5 estados coerentes com tiers esperados -> OK');
}

// ---------------------------------------------------------------------------
// Smoke de calibração: 2000 runs puros + 200 end-to-end, invariantes mantidos
// ---------------------------------------------------------------------------
{
  const report = runSimulation(2000, 200, 5, 200);

  for (const c of report.categories) {
    assert.equal(c.pure.infeasible, 0, `${c.id}: zero inviáveis no caminho puro`);
    assert.equal(c.e2e.rejected, 0, `${c.id}: zero rejeições end-to-end`);
    assert.equal(c.e2e.magnitudeMismatch, 0, `${c.id}: magnitude sempre presente no report`);
    assert.equal(c.e2e.deltaMismatch, 0, `${c.id}: deltas consistentes com a magnitude`);
    assert.equal(c.e2e.negativeBalance, 0, `${c.id}: tesouraria/labor nunca negativos`);
    assert.ok(c.pure.min >= 1, `${c.id}: batches sempre >= 1`);
    const tierCap = RECRUITMENT_MRS_CONFIG.weeklyCapByTier[c.expectedTier] ?? RECRUITMENT_MRS_CONFIG.weeklyCapPerUnit;
    assert.ok(c.pure.max <= tierCap, `${c.id}: batches nunca excedem o cap semanal do tier`);
  }

  assert.equal(report.determinism.verified, true, 'Determinismo verificado (JSON idêntico)');
  assert.equal(report.acceptance['1_0_rejected'], true);
  assert.equal(report.acceptance['2_median_within_envelope'], true);
  assert.equal(report.acceptance['3_95_percent_within_envelope'], true);
  assert.equal(report.acceptance['4_max_within_caps'], true);
  assert.equal(report.acceptance['5_treasury_labor_never_negative'], true);
  assert.equal(report.acceptance['7_determinism'], true);
  console.log('[SMOKE] 2000 runs + 200 e2e: invariantes, determinismo e critérios 1/2/3/4/5/7 -> OK');
}

// ---------------------------------------------------------------------------
// Determinismo com RNG local injetado (nunca o global)
// ---------------------------------------------------------------------------
{
  const state = buildCategoryState(SIMULATION_CATEGORIES[0]);
  const a = resolveMagnitude('RECRUIT', { mode: 'ENGINE_DETERMINED' }, state, new RandomService(424242));
  const b = resolveMagnitude('RECRUIT', { mode: 'ENGINE_DETERMINED' }, state, new RandomService(424242));
  assert.equal(a.value, b.value, 'Mesma seed -> mesmo valor');
  console.log('[DETERMINISMO] Seeds locais reproduzíveis -> OK');
}

console.log('MagnitudeSimulation focused suite passed.');
import assert from 'node:assert/strict';
import { RandomService } from '../src/core/RandomService';
import { createInitialState, buildObserverProjection } from '../src/engine';
import { CampaignState } from '../src/types';
import { capacityTier, resolveMagnitude } from '../src/lib/magnitudeResolution';
import { RECRUITMENT_MRS_CONFIG } from '../src/lib/magnitudeConfig';
import { PLAYER_OBSERVER } from './fixtures/narrativeSlice.fixtures';

const baseState: CampaignState = createInitialState('Noble Ruler', 'Central Plains');
const baseStateJson = JSON.stringify(baseState);

function freshState(): CampaignState {
  return JSON.parse(baseStateJson) as CampaignState;
}

function tinyState(): CampaignState {
  const state = freshState();
  state.holdings.population = 100;
  state.holdings.laborPool = 40;
  state.holdings.garrison = 5;
  state.weeklyLedger.silverdew = 50;
  state.army.units[0].size = 10;
  state.army.units[0].maxSize = 10;
  return state;
}

function capitalState(): CampaignState {
  const state = freshState();
  state.holdings.type = 'Walled City';
  state.holdings.population = 10000;
  state.holdings.laborPool = 4000;
  state.holdings.garrison = 180;
  state.weeklyLedger.silverdew = 10000;
  state.army.units[0].size = 300;
  state.army.units[0].maxSize = 300;
  return state;
}

// ---------------------------------------------------------------------------
// Config: centralized, frozen, canonical values
// ---------------------------------------------------------------------------
{
  assert.ok(Object.isFrozen(RECRUITMENT_MRS_CONFIG), 'Config deve estar congelado (sem números hardcoded fora dele)');
  assert.equal(RECRUITMENT_MRS_CONFIG.version, '0.2.0');
  assert.equal(RECRUITMENT_MRS_CONFIG.coefficient, 0.012);
  assert.equal(RECRUITMENT_MRS_CONFIG.costs.sdPerSoldier, 3);
  assert.equal(RECRUITMENT_MRS_CONFIG.costs.laborPerSoldier, 1);
  assert.equal(RECRUITMENT_MRS_CONFIG.weeklyCapByTier[2], 30, 'Cap semanal tier 2 (Vila)');
  assert.deepEqual(RECRUITMENT_MRS_CONFIG.tierEnvelope[2], [15, 30], 'Envelope do tier 2 (Vila)');
  assert.equal(RECRUITMENT_MRS_CONFIG.structuralTypeTier['Bastion'], 1);
  assert.equal(RECRUITMENT_MRS_CONFIG.structuralTypeTier['Walled City'], 4);
  console.log('[CONFIG] MRS config congelada com valores canônicos -> OK');
}

// ---------------------------------------------------------------------------
// capacityTier: contextual blend
// ---------------------------------------------------------------------------
{
  assert.equal(capacityTier(freshState()), 2, 'Estado padrão (1000 pop, 400 labor, 60+40 militar, 300 SD, Bastion) -> tier 2');
  assert.equal(capacityTier(tinyState()), 1, 'Aldeia minúscula -> tier 1');
  assert.equal(capacityTier(capitalState()), 4, 'Cidade murada 10000 pop -> tier 4 (Capital tier 5 reservado para tipo futuro)');
  console.log('[TIER] capacityTier contextual -> OK');
}

// ---------------------------------------------------------------------------
// ENGINE_DETERMINED: envelope plausível x regra de recrutamento
// ---------------------------------------------------------------------------
{
  const rng = new RandomService(424242);
  const resolution = resolveMagnitude('RECRUIT', undefined, freshState(), rng);

  assert.equal(resolution.feasible, true);
  assert.equal(resolution.mode, 'ENGINE_DETERMINED');
  assert.equal(resolution.source, 'ENGINE_CALCULATED');
  assert.equal(resolution.min, 15, 'Envelope final min: plausible.min=15');
  assert.equal(resolution.max, 15, 'Envelope final max: plausible.max=15');
  assert.equal(resolution.value, 15, 'Faixa [15,15] -> 15 determinístico');
  console.log('[ENGINE-DETERMINED] Estado padrão resolve 15 (envelope [15,15] x cap 30) -> OK');
}

// ---------------------------------------------------------------------------
// Determinismo com RNG injetável; RNG local nunca é o global
// ---------------------------------------------------------------------------
{
  const state = freshState();
  const rngA = new RandomService(1337);
  const rngB = new RandomService(1337);
  const a = resolveMagnitude('RECRUIT', undefined, state, rngA);
  const b = resolveMagnitude('RECRUIT', undefined, state, rngB);
  assert.equal(a.value, b.value, 'Mesma seed -> mesmo valor');

  const rngA2 = new RandomService(7331);
  const c = resolveMagnitude('RECRUIT', undefined, state, rngA2);
  assert.ok(c.value !== undefined && c.value >= c.min! && c.value <= c.max!, 'Valor sempre dentro do envelope final');
  console.log('[DETERMINISMO] MRS determinístico por seed injetada -> OK');
}

// ---------------------------------------------------------------------------
// FIXED: magnitude explícita do jogador; nunca clampada; nunca consumida RNG
// ---------------------------------------------------------------------------
{
  const state = freshState();
  const rng = new RandomService(7);
  const seedBefore = rng.getSeed();

  const five = resolveMagnitude('RECRUIT', { mode: 'FIXED', value: 5 }, state, rng);
  assert.equal(five.feasible, true);
  assert.equal(five.value, 5);
  assert.equal(five.source, 'PLAYER_EXPLICIT');
  assert.equal(five.min, 5);
  assert.equal(five.max, 5);
  assert.equal(rng.getSeed(), seedBefore, 'FIXED não consome RNG');

  const thirtyFive = resolveMagnitude('RECRUIT', { mode: 'FIXED', value: 35 }, state, rng);
  assert.equal(thirtyFive.feasible, false, 'FIXED 35 excede o cap semanal do tier 2 (30) -> REJECT, nunca clamp');
  assert.match(thirtyFive.reason!, /RECUSADO/);

  const zero = resolveMagnitude('RECRUIT', { mode: 'FIXED', value: 0 }, state, rng);
  assert.equal(zero.feasible, false);
  assert.match(zero.reason!, /INVALID_PARAMETER/);

  const fractional = resolveMagnitude('RECRUIT', { mode: 'FIXED', value: 2.5 }, state, rng);
  assert.equal(fractional.feasible, false);
  assert.match(fractional.reason!, /INVALID_PARAMETER/);

  console.log('[FIXED] Explicito aceito / inviável REJECT / malformado INVALID_PARAMETER -> OK');
}

// ---------------------------------------------------------------------------
// RANGE: intervalo do jogador intersectado com a regra; vazio -> REJECT
// ---------------------------------------------------------------------------
{
  const state = freshState();
  const rng = new RandomService(4242);
  const range = resolveMagnitude('RECRUIT', { mode: 'RANGE', range: [5, 20] }, state, rng);
  assert.equal(range.feasible, true);
  assert.ok(range.value! >= 5 && range.value! <= 20, 'Interseção com cap 30');

  const infeasible = resolveMagnitude('RECRUIT', { mode: 'RANGE', range: [40, 50] }, state, rng);
  assert.equal(infeasible.feasible, false);
  assert.match(infeasible.reason!, /RECUSADO/);

  const malformed = resolveMagnitude('RECRUIT', { mode: 'RANGE', range: [8, 2] }, state, rng);
  assert.equal(malformed.feasible, false);
  assert.match(malformed.reason!, /INVALID_PARAMETER/);

  console.log('[RANGE] Intervalo viável aceito / vazio REJECT / malformado INVALID_PARAMETER -> OK');
}

// ---------------------------------------------------------------------------
// Inviabilidade contextual: tesouraria e mão de obra zeradas
// ---------------------------------------------------------------------------
{
  const broke = freshState();
  broke.weeklyLedger.silverdew = 0;
  const brokeResult = resolveMagnitude('RECRUIT', undefined, broke, new RandomService(1));
  assert.equal(brokeResult.feasible, false, 'Tesouraria zerada -> cap 0 -> REJECT');
  assert.match(brokeResult.reason!, /RECUSADO/);

  const noLabor = freshState();
  noLabor.holdings.laborPool = 0;
  const noLaborResult = resolveMagnitude('RECRUIT', undefined, noLabor, new RandomService(1));
  assert.equal(noLaborResult.feasible, false, 'Mão de obra zerada -> REJECT');

  console.log('[INVIABILIDADE] Tesouraria/labor zerados rejeitam sem mutação -> OK');
}

// ---------------------------------------------------------------------------
// Integração: relatório expõe apenas o resultado factual (sem fórmulas/pesos)
// ---------------------------------------------------------------------------
{
  const projection = buildObserverProjection(freshState(), PLAYER_OBSERVER);
  const payload = JSON.stringify({ projection, command: { magnitude: undefined }, state: { hold: freshState().holdings.type } });
  assert.equal(payload.includes('0.012'), false, 'Coeficiente/fórmulas não vazam para camadas externas');
  assert.equal(payload.includes('tierWeights'), false, 'Pesos de tier nunca são expostos');
  console.log('[FACTUAL] Nenhuma fórmula/peso/config vaza no payload narrativo -> OK');
}

console.log('MagnitudeResolution focused suite passed.');
import assert from 'node:assert/strict';
import { createInitialState } from '../src/engine';
import { RandomService } from '../src/core/RandomService';
import { CampaignState } from '../src/types';
import {
  classifyAction,
  resolveGenericPlausibleAction,
  GenericResolutionRequest
} from '../src/lib/genericResolution';

const baseState: CampaignState = createInitialState('Noble Ruler', 'Central Plains');
baseState.weeklyLedger.silverdew = 500;
baseState.holdings.laborPool = 200;

function freshState(): CampaignState {
  return JSON.parse(JSON.stringify(baseState));
}

// ---------------------------------------------------------------------------
// 1. Classificação CANONICAL vs PLAUSIBLE vs IMPOSSIBLE vs AMBIGUOUS
// ---------------------------------------------------------------------------
{
  const state = freshState();
  
  assert.equal(classifyAction({ action: 'RECRUIT' }, state).type, 'CANONICAL');
  assert.equal(classifyAction({ action: 'BUILD' }, state).type, 'CANONICAL');
  assert.equal(classifyAction({ action: 'TRAVEL' }, state).type, 'CANONICAL');
  assert.equal(classifyAction({ action: 'TRADE' }, state).type, 'CANONICAL');

  assert.equal(classifyAction({ action: 'Ressuscitar morto com magia' }, state).type, 'IMPOSSIBLE');
  assert.equal(classifyAction({ action: 'Voar até a fortaleza inimiga' }, state).type, 'IMPOSSIBLE');

  assert.equal(classifyAction({ action: '' }, state).type, 'AMBIGUOUS');

  assert.equal(classifyAction({ action: 'Mandar 20 homens limpar a estrada ao norte' }, state).type, 'PLAUSIBLE_UNMODELED');
  assert.equal(classifyAction({ action: 'Subornar o guarda da muralha' }, state).type, 'PLAUSIBLE_UNMODELED');
  console.log('[CLASSIFICATION] Canonical / Impossível / Ambíguo / Plausível -> OK');
}

// ---------------------------------------------------------------------------
// 2. Resolução de Ação Plausível com Mão de Obra e Recursos
// ---------------------------------------------------------------------------
{
  const state = freshState();
  const rng = new RandomService(4242);
  const request: GenericResolutionRequest = {
    action: 'Limpar estrada ao norte',
    parameters: { men: 20 }
  };

  const result = resolveGenericPlausibleAction(request, state, rng);
  assert.equal(result.classification, 'PLAUSIBLE_UNMODELED');
  assert.ok(result.outcome === 'SUCCESS' || result.outcome === 'PARTIAL_SUCCESS');
  assert.equal(result.magnitude, 20);
  assert.equal(result.source, 'ENGINE_CALCULATED');
  assert.ok(result.stateChanges.some(sc => sc.path === 'holdings.laborPool' && sc.delta === -20));
  assert.ok(result.consequences.length > 0);
  console.log('[PLAUSIBLE] Resolução genérica de infraestrutura aceita com deltas -> OK');
}

// ---------------------------------------------------------------------------
// 3. Rejeição de Ação Impossível
// ---------------------------------------------------------------------------
{
  const state = freshState();
  const rng = new RandomService(4242);
  const request: GenericResolutionRequest = {
    action: 'Ressuscitar o general morto'
  };

  const result = resolveGenericPlausibleAction(request, state, rng);
  assert.equal(result.classification, 'IMPOSSIBLE');
  assert.equal(result.outcome, 'REJECTED');
  assert.equal(result.stateChanges.length, 0);
  assert.equal(result.consequences.length, 0);
  console.log('[IMPOSSIBLE] Ação impossível rejeitada sem mutação -> OK');
}

// ---------------------------------------------------------------------------
// 4. Ação Ambígua requer Esclarecimento
// ---------------------------------------------------------------------------
{
  const state = freshState();
  const rng = new RandomService(4242);
  const request: GenericResolutionRequest = {
    action: 'Limpar estrada',
    parameters: { men: 0 } // Homens zerados
  };

  const result = resolveGenericPlausibleAction(request, state, rng);
  assert.equal(result.classification, 'AMBIGUOUS');
  assert.equal(result.outcome, 'CLARIFICATION_REQUIRED');
  assert.equal(result.stateChanges.length, 0);
  console.log('[AMBIGUOUS] Ação ambígua bloqueada para esclarecimento -> OK');
}

// ---------------------------------------------------------------------------
// 5. Determinismo e Não-Mutação de Estado de Entrada
// ---------------------------------------------------------------------------
{
  const stateA = freshState();
  const stateB = freshState();
  const frozenState = Object.freeze(JSON.parse(JSON.stringify(stateA)));

  const req: GenericResolutionRequest = { action: 'Subornar guarda', parameters: { amount: 30 } };
  const res1 = resolveGenericPlausibleAction(req, frozenState, new RandomService(999));
  const res2 = resolveGenericPlausibleAction(req, stateB, new RandomService(999));

  assert.deepEqual(res1, res2, 'Mesma seed -> resultado idêntico');
  assert.equal(frozenState.weeklyLedger.silverdew, 500, 'Estado original não pode ser mutado');
  console.log('[DETERMINISMO] Resolução determinística e sem mutação da entrada -> OK');
}

console.log('GenericResolution test suite passed successfully.');

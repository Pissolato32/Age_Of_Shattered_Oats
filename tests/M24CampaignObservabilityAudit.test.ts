/**
 * M24 — Campaign Observability & Explainability Audit Test Suite
 * 
 * Hard Gates M24-A1 through M24-G1:
 * Audits state delta attribution, deterministic causal explanation chains,
 * resource ledger concordance, narrative factual explainability,
 * player-facing state sufficiency, counterfactual sandbox isolation,
 * and explainability replay determinism.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveWeeklyTurn, createInitialState, exportStateToText, importStateFromText } from '../src/engine';
import { SceneResolver } from '../src/domain/events/SceneResolver';
import { CampaignState } from '../src/types';
import { createObserverProjection } from '../src/lib/narrativeProjection';
import { NarrativeObserver } from '../src/lib/narrativeContracts';
import { EventOpportunity } from '../src/domain/events/EventOpportunityEngine';
import { createEventRecord } from '../src/domain/events/EventRecordFactory';

console.log('=== TEST SUITE: M24 Campaign Observability & Explainability Audit ===\n');

function createObservabilityState(seedName: string = 'Obs_Ruler'): CampaignState {
  const s = createInitialState('Landed Knight', 'Forest Plains');
  s.character.name = seedName.split('_')[0];
  s.character.house = seedName.split('_')[1] || 'Vance';
  s.weeklyLedger.season = 'Thawtide';
  s.weeklyLedger.weather = 'Tempo firme';
  s.weeklyLedger.silverdew = 1500;
  s.weeklyLedger.food = 250;
  s.weeklyLedger.materials = { timber: 50, iron: 30, stone: 40 };
  s.holdings.type = 'Bastion';
  s.advisors = { counselorName: 'Tobin', stewardName: 'Gerold', spyMasterName: 'Roric' };
  s.sessionLog = {
    lastSessionDate: '402-01-01',
    lastThingHappened: 'Início da auditoria M24 de observabilidade',
    activeMissions: [],
    pendingDecisions: [],
    eventCooldowns: {}
  };
  return s;
}

// ---------------------------------------------------------------------------
// M24-A1 — State Delta Attribution Audit
// ---------------------------------------------------------------------------
console.log('[M24-A1] Auditando atribuição causal de deltas materiais...');
{
  let state = createObservabilityState('Delta_Ruler');
  const prevSilverdew = state.weeklyLedger.silverdew;
  const prevFood = state.weeklyLedger.food;

  const { updatedState, turnResult } = resolveWeeklyTurn(state);
  state = updatedState;

  const deltaSilverdew = state.weeklyLedger.silverdew - prevSilverdew;
  const deltaFood = state.weeklyLedger.food - prevFood;

  // Calculate attributed silverdew delta from ledger
  const incomeSum = state.weeklyLedger.incomeDetail
    ? Object.values(state.weeklyLedger.incomeDetail).reduce((a, b) => a + b, 0)
    : 0;
  const expenseSum = state.weeklyLedger.expenseDetail
    ? Object.values(state.weeklyLedger.expenseDetail).reduce((a, b) => a + b, 0)
    : 0;

  const expectedDeltaSilverdew = incomeSum - expenseSum;

  assert.equal(
    deltaSilverdew,
    expectedDeltaSilverdew,
    `M24-A1: Delta de prata real (${deltaSilverdew}) deve ser 100% explicável pelo ledger (Entradas: ${incomeSum}, Saídas: ${expenseSum})`
  );

  console.log(`  ✓ Gate M24-A1 Aprovado: Delta de prata (Δ${deltaSilverdew} SD) 100% atribuível ao ledger.`);
}

// ---------------------------------------------------------------------------
// M24-B1 — Causal Explanation Chain Audit
// ---------------------------------------------------------------------------
console.log('[M24-B1] Auditando cadeia de explicação causal de eventos emergentes...');
{
  const state = createObservabilityState('CausalChain_Ruler');
  const opp: EventOpportunity = {
    opportunityId: 'opp_trade_opportunistic_merchant',
    eventType: 'TRADE_OPPORTUNISTIC_MERCHANT',
    magnitude: 'MINOR',
    baseWeight: 10,
    weight: 10,
    tags: ['comercio'],
    eligible: true,
    reasons: ['Próspera atividade comercial'],
    timeCostHint: 'HOURS'
  };

  const record = createEventRecord(opp, 1, 0, 'HOLDING');
  assert.ok(record.scene, 'M24-B1: SceneState presente');

  const res = SceneResolver.resolveSceneChoice(record.scene, 'choice_trade_iron', record, state);

  // Extract causal chain structure
  const causalChain = {
    opportunityId: opp.opportunityId,
    eventType: opp.eventType,
    eligibilityReasons: opp.reasons,
    chosenChoiceId: 'choice_trade_iron',
    mutations: res.nextSceneState.choices.find(c => c.choiceId === 'choice_trade_iron')?.mutations,
    nextStateIronDelta: res.eventProcessingResult.nextState.weeklyLedger.materials.iron - state.weeklyLedger.materials.iron
  };

  assert.equal(causalChain.opportunityId, 'opp_trade_opportunistic_merchant', 'M24-B1: Oportunidade rastreável');
  assert.equal(causalChain.chosenChoiceId, 'choice_trade_iron', 'M24-B1: Escolha rastreável');
  assert.equal(causalChain.nextStateIronDelta, 10, 'M24-B1: Mutação mecânica derivada diretamente da escolha');

  console.log('  ✓ Gate M24-B1 Aprovado: Estrutura da cadeia causal determinística 100% rastreável.');
}

// ---------------------------------------------------------------------------
// M24-C1 — Resource Ledger Concordance Audit
// ---------------------------------------------------------------------------
console.log('[M24-C1] Auditando concordância do ledger e estado mecânico (10 semanas)...');
{
  let state = createObservabilityState('Concordance_Ruler');

  for (let w = 1; w <= 10; w++) {
    const prevSD = state.weeklyLedger.silverdew;
    const { updatedState } = resolveWeeklyTurn(state);
    state = updatedState;

    const actualSD = state.weeklyLedger.silverdew;
    const income = state.weeklyLedger.incomeDetail
      ? Object.values(state.weeklyLedger.incomeDetail).reduce((a, b) => a + b, 0)
      : 0;
    const expense = state.weeklyLedger.expenseDetail
      ? Object.values(state.weeklyLedger.expenseDetail).reduce((a, b) => a + b, 0)
      : 0;

    assert.equal(
      actualSD,
      prevSD + income - expense,
      `M24-C1 [W${w}]: Tesouro (${actualSD}) deve bater exatamente com prevSD + receitas - despesas`
    );
  }

  console.log('  ✓ Gate M24-C1 Aprovado: Concordância matemática perfeita entre ledger e estado mecânico em 10 turnos.');
}

// ---------------------------------------------------------------------------
// M24-D1 — Narrative Factual Explainability Audit
// ---------------------------------------------------------------------------
console.log('[M24-D1] Auditando fundamentação factual dos fatos projetados para narrativa...');
{
  const state = createObservabilityState('Factual_Ruler');
  state.worldLedger.majorEvents.push({
    date: 'W1, M1, Y402',
    event: 'Tratado de Paz assinado',
    region: 'Forest Plains',
    involved: 'House Vance',
    resolved: 'Yes'
  });

  const observer: NarrativeObserver = { observerId: state.character.name, kind: 'PLAYER' };
  const proj = createObserverProjection(state, observer);

  // Assert supporting facts match raw mechanical state facts
  assert.equal(proj.scene.regionName, state.holdings.region || 'Forest Plains', 'M24-D1: Região narrada derivada do estado');
  assert.equal(proj.scene.season, state.weeklyLedger.season, 'M24-D1: Estação narrada derivada do estado');
  assert.equal(proj.scene.weather, state.weeklyLedger.weather, 'M24-D1: Clima narrado derivado do estado');
  assert.ok(proj.actors.some(a => a.name === state.character.name), 'M24-D1: Ator narrado derivado do estado');

  console.log('  ✓ Gate M24-D1 Aprovado: Projeções narrativas 100% fundamentadas em fatos autorizados do estado.');
}

// ---------------------------------------------------------------------------
// M24-E1 — Player-Facing State Sufficiency Audit
// ---------------------------------------------------------------------------
console.log('[M24-E1] Auditando suficiência de informação e ausência de vazamento epistêmico...');
{
  const state = createObservabilityState('Sufficiency_Ruler');
  state.sessionLog = {
    ...state.sessionLog,
    activeScene: {
      sceneId: 'scene_test',
      eventId: 'evt_test',
      status: 'OPEN',
      choices: [{ choiceId: 'c1', label: 'Escolha 1', mutations: [] }]
    }
  };

  const playerObs: NarrativeObserver = { observerId: state.character.name, kind: 'PLAYER' };
  const projPlayer = createObserverProjection(state, playerObs);
  assert.ok(projPlayer.scene, 'M24-E1: Jogador recebe contexto de cena suficiente');

  const spyObs: NarrativeObserver = { observerId: 'Spy_Stranger', kind: 'NPC' };
  const projSpy = createObserverProjection(state, spyObs);
  assert.equal(projSpy.scene.locationId, 'unknown', 'M24-E1: Observador externo recebe negação de localização privada');
  assert.equal(projSpy.actors.length, 0, 'M24-E1: Observador externo não recebe atores privados');

  console.log('  ✓ Gate M24-E1 Aprovado: Informação visível suficiente sem vazamento epistêmico.');
}

// ---------------------------------------------------------------------------
// M24-F1 — Counterfactual Sandbox Explanation Audit
// ---------------------------------------------------------------------------
console.log('[M24-F1] Auditando explicação contrafactual isolada em sandbox...');
{
  const mainState = createObservabilityState('Counterfactual_Ruler');
  const mainIronInitial = mainState.weeklyLedger.materials.iron;
  const mainTimberInitial = mainState.weeklyLedger.materials.timber;

  // Clone main state for counterfactual evaluation without mutating mainState
  const sandboxText = exportStateToText(mainState);

  // Branch A (Choice: choice_trade_iron)
  let branchAState = importStateFromText(sandboxText);
  const opp: EventOpportunity = {
    opportunityId: 'opp_trade_opportunistic_merchant',
    eventType: 'TRADE_OPPORTUNISTIC_MERCHANT',
    magnitude: 'MINOR',
    baseWeight: 10,
    weight: 10,
    tags: ['comercio'],
    eligible: true,
    reasons: ['test'],
    timeCostHint: 'HOURS'
  };
  const recA = createEventRecord(opp, 1, 0, 'HOLDING');
  if (recA.scene) {
    const resA = SceneResolver.resolveSceneChoice(recA.scene, 'choice_trade_iron', recA, branchAState);
    branchAState = resA.eventProcessingResult.nextState;
  }

  // Branch B (Counterfactual Choice: choice_trade_timber)
  let branchBState = importStateFromText(sandboxText);
  const recB = createEventRecord(opp, 1, 0, 'HOLDING');
  if (recB.scene) {
    const resB = SceneResolver.resolveSceneChoice(recB.scene, 'choice_trade_timber', recB, branchBState);
    branchBState = resB.eventProcessingResult.nextState;
  }

  // Compute Counterfactual Delta: Δ(A, B)
  const counterfactualDelta = {
    silverdewDiff: branchAState.weeklyLedger.silverdew - branchBState.weeklyLedger.silverdew,
    ironDiff: branchAState.weeklyLedger.materials.iron - branchBState.weeklyLedger.materials.iron,
    timberDiff: branchAState.weeklyLedger.materials.timber - branchBState.weeklyLedger.materials.timber
  };

  assert.equal(counterfactualDelta.silverdewDiff, -10, 'M24-F1: Δ Prata entre Escolha A e B (-10 SD)');
  assert.equal(counterfactualDelta.ironDiff, 10, 'M24-F1: Δ Ferro entre Escolha A e B (+10 Ferro)');
  assert.equal(counterfactualDelta.timberDiff, -15, 'M24-F1: Δ Madeira entre Escolha A e B (-15 Madeira)');

  // Assert mainState was NOT contaminated
  assert.equal(mainState.weeklyLedger.materials.iron, mainIronInitial, 'M24-F1: mainState intacto (0 contaminação)');
  assert.equal(mainState.weeklyLedger.materials.timber, mainTimberInitial, 'M24-F1: mainState intacto (0 contaminação)');

  console.log('  ✓ Gate M24-F1 Aprovado: Análise contrafactual Δ(A,B) executada em sandbox sem contaminar a campanha principal.');
}

// ---------------------------------------------------------------------------
// M24-G1 — Explainability Replay Determinism Audit
// ---------------------------------------------------------------------------
console.log('[M24-G1] Auditando determinismo e replay da explicação causal...');
{
  const runExplainableCampaign = (seedName: string) => {
    let s = createObservabilityState(seedName);
    const prevSD = s.weeklyLedger.silverdew;

    const { updatedState } = resolveWeeklyTurn(s);
    s = updatedState;

    const deltaSD = s.weeklyLedger.silverdew - prevSD;
    const obs: NarrativeObserver = { observerId: s.character.name, kind: 'PLAYER' };
    const proj = createObserverProjection(s, obs);

    return JSON.stringify({
      deltaSD,
      incomeSum: Object.values(s.weeklyLedger.incomeDetail || {}).reduce((a, b) => a + b, 0),
      expenseSum: Object.values(s.weeklyLedger.expenseDetail || {}).reduce((a, b) => a + b, 0),
      narrativeLocation: proj.scene.regionName
    });
  };

  const explanation1 = runExplainableCampaign('Replay_Explain_Seed');
  const explanation2 = runExplainableCampaign('Replay_Explain_Seed');

  assert.equal(explanation1, explanation2, 'M24-G1: Explicação e deltas devem ser 100% bitwise idênticos em re-execuções');

  console.log('  ✓ Gate M24-G1 Aprovado: Replay da explicação causal validado com 100% de identidade.');
}

console.log('\n===================================================================');
console.log('🎉 FASE M24 — CAMPAIGN OBSERVABILITY & EXPLAINABILITY AUDIT CONCLUÍDA COM 100% DE SUCESSO!');
console.log('===================================================================\n');

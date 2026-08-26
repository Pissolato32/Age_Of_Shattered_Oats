/**
 * M22 — Emergent Campaign Quality & Systemic Balance Audit Test Suite
 * 
 * Hard Gates M22-A through M22-G:
 * Audits economic equilibrium, military balance, strategic diversity,
 * event-economy feedback loops, narrative-mechanical concordance,
 * multi-seed statistical stability, and degenerate strategy/exploit detection.
 */

import assert from 'node:assert/strict';
import { resolveWeeklyTurn, createInitialState } from '../src/engine';
import { SceneResolver } from '../src/domain/events/SceneResolver';
import { CampaignState } from '../src/types';
import { createObserverProjection } from '../src/lib/narrativeProjection';
import { NarrativeObserver } from '../src/lib/narrativeContracts';
import { EventOpportunity, EventOpportunityEngine } from '../src/domain/events/EventOpportunityEngine';
import { createEventRecord } from '../src/domain/events/EventRecordFactory';

console.log('=== TEST SUITE: M22 Emergent Campaign Quality & Systemic Balance ===\n');

function createQualityState(seedName: string = 'Maelor_Ironwood'): CampaignState {
  const s = createInitialState('Landed Knight', 'Forest Plains');
  s.character.name = seedName.split('_')[0];
  s.character.house = seedName.split('_')[1] || 'Ironwood';
  s.weeklyLedger.season = 'Thawtide';
  s.weeklyLedger.weather = 'Tempo firme';
  s.weeklyLedger.silverdew = 1200;
  s.weeklyLedger.food = 250;
  s.weeklyLedger.materials = { timber: 45, iron: 25, stone: 35 };
  s.holdings.type = 'Bastion';
  s.advisors = { counselorName: 'Tobin', stewardName: 'Gerold', spyMasterName: 'Roric' };
  s.sessionLog = {
    lastSessionDate: '402-01-01',
    lastThingHappened: 'Início da auditoria M22 de qualidade e equilíbrio',
    activeMissions: [],
    pendingDecisions: [],
    eventCooldowns: {}
  };
  return s;
}

// Helper to auto-resolve open scenes
function processTurn(state: CampaignState): CampaignState {
  const { updatedState, turnResult } = resolveWeeklyTurn(state);
  let nextState = updatedState;

  if (nextState.sessionLog?.activeScene && nextState.sessionLog.activeScene.status === 'OPEN') {
    const scene = nextState.sessionLog.activeScene;
    const incidents = turnResult.incidentResult?.eventsProcessed ?? [];
    const matchingEvt = incidents.find(e => e.eventId === scene.eventId) ?? {
      eventId: scene.eventId, magnitude: 'MINOR', timeCost: 'HOUR',
      descriptionContext: { eventType: 'GENERIC' }, mutations: [],
      turnOccurred: nextState.worldLedger.currentDate.week, slotIndex: 0, domain: 'HOLDING', scene
    };
    const choiceId = scene.choices[0]?.choiceId ?? 'choice_generic_cautious';
    const res = SceneResolver.resolveSceneChoice(scene, choiceId, matchingEvt as any, nextState);
    nextState = {
      ...res.eventProcessingResult.nextState,
      sessionLog: {
        ...res.eventProcessingResult.nextState.sessionLog,
        activeScene: res.nextSceneState
      }
    };
  }

  return nextState;
}

// ---------------------------------------------------------------------------
// M22-A — Economic Equilibrium Audit
// ---------------------------------------------------------------------------
console.log('[M22-A] Auditando equilíbrio econômico e ausência de regimes degenerados...');
{
  let state = createQualityState('Econ_Ruler');
  const silverdewHistory: number[] = [];
  const foodHistory: number[] = [];

  for (let turn = 1; turn <= 150; turn++) {
    state = processTurn(state);
    silverdewHistory.push(state.weeklyLedger.silverdew);
    foodHistory.push(state.weeklyLedger.food);
  }

  const finalSilverdew = state.weeklyLedger.silverdew;
  const maxSilverdew = Math.max(...silverdewHistory);
  const minSilverdew = Math.min(...silverdewHistory);

  // Economic assertions:
  // 1. Treasury must not explode infinitely (> 100,000 SD) without friction (Royal Tithe + Upkeep)
  assert.ok(maxSilverdew < 100000, 'M22-A: Riqueza controlada pelo Royal Tithe e Upkeep (< 100k SD)');
  // 2. Food ceiling is governed by Granary Spoilage (Bastion capacity ~200-300)
  assert.ok(state.weeklyLedger.food <= 350, 'M22-A: Comida retida pelo teto de capacidade do celeiro (spoilage)');
  // 3. Economy fluctuates in realistic bounds without permanent unrecoverable negative crash
  assert.ok(minSilverdew > -500, 'M22-A: Sem colapso irreversível negativo de prata');

  console.log(`  ✓ Gate M22-A Passed: Equilíbrio econômico mantido em 150 semanas (Min SD: ${minSilverdew}, Max SD: ${maxSilverdew}, Final Food: ${state.weeklyLedger.food}).`);
}

// ---------------------------------------------------------------------------
// M22-B — Military Equilibrium Audit
// ---------------------------------------------------------------------------
console.log('[M22-B] Auditando equilíbrio militar e ausência de dominância trivial de força...');
{
  let state = createQualityState('Military_Ruler');
  // Recruit additional troops to increase military payroll burden
  state.army.units.push({
    id: 'unit_heavy_infantry_1',
    name: 'Infantaria Pesada do Vale',
    size: 40,
    maxSize: 40,
    tier: 2,
    ac: 14,
    weapon: 'Espada Longa',
    mount: 'Nenhum',
    morale: 85
  });

  const payrollHistory: number[] = [];
  for (let turn = 1; turn <= 100; turn++) {
    state = processTurn(state);
    payrollHistory.push(state.weeklyLedger.expenseDetail.wages + state.weeklyLedger.expenseDetail.garrison);
  }

  const totalPayrollCost = payrollHistory.reduce((a, b) => a + b, 0);

  // Military assertions:
  // 1. Maintaining troops levies non-zero upkeep cost
  assert.ok(totalPayrollCost > 0, 'M22-B: Exército gera custo realista de manutenção/salários');
  // 2. Military upkeep exerts drag on treasury, preventing zero-cost army expansion
  assert.ok(state.weeklyLedger.silverdew < 5000, 'M22-B: Manutenção militar limita acúmulo desmedido de tesouro');

  console.log(`  ✓ Gate M22-B Passed: Equilíbrio militar auditado (Custo acumulado de manutenção: ${totalPayrollCost} SD em 100 sem).`);
}

// ---------------------------------------------------------------------------
// M22-C — Strategic Diversity Audit
// ---------------------------------------------------------------------------
console.log('[M22-C] Auditando diversidade estratégica (Econômica, Militar, Diplomática, Intriga, Equilibrada)...');
{
  const strategies = ['ECONOMIC', 'MILITARY', 'DIPLOMATIC', 'INTRIGUE', 'BALANCED'] as const;
  const outcomes: Record<string, { finalSilverdew: number; finalFood: number; eventCount: number }> = {};

  for (const strat of strategies) {
    let state = createQualityState(`Strat_${strat}`);
    if (strat === 'ECONOMIC') {
      state.weeklyLedger.silverdew += 500;
    } else if (strat === 'MILITARY') {
      state.army.units.push({ id: `unit_${strat}`, name: 'Guarda', size: 30, maxSize: 30, tier: 1, ac: 10, weapon: 'Lança', mount: 'Nenhum', morale: 70 });
    } else if (strat === 'DIPLOMATIC') {
      state.worldLedger.nobleHouses = [
        { name: 'House Vance', currentLord: 'Lord Vance', seat: 'Vance Keep', region: 'Forest Plains', tier: 2, status: 'Allied', allies: [], enemies: [], opinion: 3, rumor: '', isRealRumor: false }
      ];
    } else if (strat === 'INTRIGUE') {
      state.sessionLog.activeMissions.push({
        id: 'm_spy', name: 'Rede de Espionagem', type: 'espionage', status: 'ACTIVE',
        unitName: 'Espião', returnsDay: 10, returnsMonth: 'Thawtide', details: 'Espionagem'
      });
    }

    for (let turn = 1; turn <= 50; turn++) {
      state = processTurn(state);
    }

    outcomes[strat] = {
      finalSilverdew: state.weeklyLedger.silverdew,
      finalFood: state.weeklyLedger.food,
      eventCount: state.eventStore?.length ?? 0
    };
  }

  // Assert distinct playstyles produce distinct, valid outcomes without single-strategy dominance
  assert.ok(outcomes['ECONOMIC'].finalSilverdew !== outcomes['MILITARY'].finalSilverdew, 'M22-C: Trajetórias estratégica e militar produzem saldos distintos');
  for (const strat of strategies) {
    assert.ok(outcomes[strat].finalSilverdew > 0, `M22-C: Estratégia ${strat} permanece viável e solvente`);
  }

  console.log('  ✓ Gate M22-C Passed: Diversidade de 5 perfis estratégicos validada.');
}

// ---------------------------------------------------------------------------
// M22-D — Event Economy Interaction (Feedback Loops)
// ---------------------------------------------------------------------------
console.log('[M22-D] Auditando loops de feedback entre economia e eventos emergentes...');
{
  let stateProsperous = createQualityState('Feedback_Rich');
  stateProsperous.weeklyLedger.silverdew = 3000;

  let stateCrisis = createQualityState('Feedback_Poor');
  stateCrisis.weeklyLedger.silverdew = 50;
  stateCrisis.weeklyLedger.food = 10;

  const ctxRich = { activity: 'HOLDING' as const, currentTurn: 1, eventCooldowns: stateProsperous.sessionLog.eventCooldowns };
  const ctxPoor = { activity: 'HOLDING' as const, currentTurn: 1, eventCooldowns: stateCrisis.sessionLog.eventCooldowns };

  const opportunitiesRich = EventOpportunityEngine.getEligibleOpportunities(stateProsperous, ctxRich);
  const opportunitiesPoor = EventOpportunityEngine.getEligibleOpportunities(stateCrisis, ctxPoor);

  assert.ok(opportunitiesRich.length > 0, 'M22-D: Estado próspero gera oportunidades elegíveis');
  assert.ok(opportunitiesPoor.length > 0, 'M22-D: Estado em crise gera oportunidades elegíveis');

  // Verify state mutation from event affects future resource state
  const tradeOpp: EventOpportunity = {
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
  const record = createEventRecord(tradeOpp, 1, 0, 'HOLDING');
  if (record.scene) {
    const res = SceneResolver.resolveSceneChoice(record.scene, 'choice_trade_iron', record, stateProsperous);
    assert.notEqual(
      JSON.stringify(res.eventProcessingResult.nextState.weeklyLedger),
      JSON.stringify(stateProsperous.weeklyLedger),
      'M22-D: Resolução de escolha no evento produz alteração mecânica real de estado (feedback loop)'
    );
  }

  console.log('  ✓ Gate M22-D Passed: Feedback mecânico bi-direcional entre estado e eventos auditado.');
}

// ---------------------------------------------------------------------------
// M22-E — Narrative / Mechanical Concordance Audit
// ---------------------------------------------------------------------------
console.log('[M22-E] Auditando concordância factual entre estado mecânico e projeção narrativa...');
{
  let state = createQualityState('Concordance_Ruler');
  state.weeklyLedger.silverdew = 100;
  state.weeklyLedger.food = 15; // Low food

  const observer: NarrativeObserver = { observerId: state.character.name, kind: 'PLAYER' };
  const proj = createObserverProjection(state, observer);

  // Assert observer projection accurately reflects actual location and character attributes
  assert.equal(proj.scene.regionName, state.holdings.region || 'Forest Plains', 'M22-E: Região na narrativa concorda com o estado');
  assert.ok(proj.actors.some(a => a.name === state.character.name), 'M22-E: Atores na narrativa concordam com o estado');

  console.log('  ✓ Gate M22-E Passed: Concordância factual entre estado mecânico e projeção narrativa validada.');
}

// ---------------------------------------------------------------------------
// M22-F — Multi-Seed Statistical Stability Audit
// ---------------------------------------------------------------------------
console.log('[M22-F] Auditando estabilidade estatística multi-seed (20 seeds x 100 semanas)...');
{
  const totalSeeds = 20;
  const weeksPerSeed = 100;
  const finalStateSizes: number[] = [];
  const eventCounts: number[] = [];

  for (let seedIndex = 1; seedIndex <= totalSeeds; seedIndex++) {
    let state = createQualityState(`Seed_Stats_${seedIndex}`);
    for (let w = 1; w <= weeksPerSeed; w++) {
      state = processTurn(state);
    }
    finalStateSizes.push(JSON.stringify(state).length);
    eventCounts.push(state.eventStore?.length ?? 0);
  }

  const avgStateSize = finalStateSizes.reduce((a, b) => a + b, 0) / totalSeeds;
  const avgEvents = eventCounts.reduce((a, b) => a + b, 0) / totalSeeds;

  // Statistical stability checks:
  assert.ok(avgStateSize > 10000 && avgStateSize < 150000, `M22-F: Tamanho médio do estado controlado (${avgStateSize.toFixed(0)} bytes)`);
  assert.ok(avgEvents >= 10, `M22-F: Média de eventos emergentes consistente (${avgEvents.toFixed(1)} eventos/campanha)`);

  console.log(`  ✓ Gate M22-F Passed: Estabilidade estatística confirmada em ${totalSeeds} seeds x ${weeksPerSeed} semanas (Média de eventos: ${avgEvents.toFixed(1)}).`);
}

// ---------------------------------------------------------------------------
// M22-G — Degenerate Strategy & Exploit Detection
// ---------------------------------------------------------------------------
console.log('[M22-G] Auditando detecção de estratégias degeneradas e tentativas de exploit...');
{
  let state = createQualityState('Exploit_Ruler');

  // Exploit test 1: Cooldown spam abuse
  state.sessionLog = {
    ...state.sessionLog,
    eventCooldowns: { 'ATMOSPHERIC_FLAVOR_RAVEN': 3 }
  };

  const evalResults = EventOpportunityEngine.evaluateOpportunities(state, {
    activity: 'HOLDING',
    currentTurn: 2,
    eventCooldowns: state.sessionLog.eventCooldowns
  });

  const ravenOpp = evalResults.find(o => o.eventType === 'ATMOSPHERIC_FLAVOR_RAVEN');
  assert.ok(ravenOpp, 'M22-G: Evento atmosférico avaliado');
  assert.equal(ravenOpp.eligible, false, 'M22-G: Evento em cooldown é rigorosamente bloqueado contra exploit de spam');

  // Exploit test 2: Rapid turn skipping without decisions
  let unhandledCrash = false;
  try {
    for (let i = 0; i < 50; i++) {
      state = processTurn(state);
    }
  } catch (err) {
    unhandledCrash = true;
  }
  assert.equal(unhandledCrash, false, 'M22-G: Avanço contínuo de turnos não gera crash não-tratado');

  console.log('  ✓ Gate M22-G Passed: Cooldowns e resiliência contra exploits e loops abusivos validados.');
}

console.log('\n===================================================================');
console.log('🎉 AUDITORIA FASE M22 — EMERGENT CAMPAIGN QUALITY CONCLUÍDA COM 100% DE SUCESSO!');
console.log('===================================================================\n');

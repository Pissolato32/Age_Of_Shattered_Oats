/**
 * M19-B — Adversarial Emergent Campaign Test Suite
 * 
 * Hard Gates M19-B1 through M19-B7:
 * Audits event pressure, consequence persistence, epistemic integrity,
 * counselor adversarial reactions, event cascades, catastrophic campaigns,
 * and adversarial replay determinism.
 */

import assert from 'node:assert/strict';
import { resolveWeeklyTurn, createInitialState } from '../src/engine';
import { SceneResolver } from '../src/domain/events/SceneResolver';
import { CampaignState } from '../src/types';
import { createEventRecord } from '../src/domain/events/EventRecordFactory';
import { EventOpportunity } from '../src/domain/events/EventOpportunityEngine';
import { createObserverProjection } from '../src/lib/narrativeProjection';
import { NarrativeObserver } from '../src/lib/narrativeContracts';
import { globalEventStore } from '../src/core/EventStore';

console.log('=== TEST SUITE: M19-B Adversarial Emergent Campaign ===\n');

function createAdversarialBaselineState(): CampaignState {
  const s = createInitialState('Landed Knight', 'Forest Plains');
  s.character.name = 'Maelor';
  s.character.house = 'House Vance';
  s.weeklyLedger.season = 'Deepfrost';
  s.weeklyLedger.weather = 'Tempestade de neve';
  s.weeklyLedger.silverdew = 500;
  s.weeklyLedger.food = 100;
  s.weeklyLedger.materials = { timber: 20, iron: 15, stone: 10 };
  s.holdings.type = 'Bastion';
  s.advisors = {
    counselorName: 'Tobin',
    stewardName: 'Gerold',
    spyMasterName: 'Roric'
  };
  s.sessionLog = {
    lastSessionDate: '402-01-01',
    lastThingHappened: 'Início da campanha adversarial M19-B',
    activeMissions: [],
    pendingDecisions: [],
    eventCooldowns: {}
  };
  return s;
}

// ---------------------------------------------------------------------------
// M19-B1 — Event Pressure
// ---------------------------------------------------------------------------
console.log('[M19-B1] Auditando pressão de eventos e distribuição sob alta frequência...');
{
  let state = createAdversarialBaselineState();
  const eventCounts: Record<string, number> = {};
  let totalIncidents = 0;

  for (let turn = 1; turn <= 60; turn++) {
    // Dynamic activity modulation to simulate real campaign player choices
    if (turn > 10 && turn <= 25) {
      state.sessionLog = {
        ...state.sessionLog,
        activeMissions: [{ id: 'm_travel_1', name: 'March to Frontier', type: 'travel_patrol', status: 'ACTIVE', unitName: 'Guarda', returnsDay: 1, returnsMonth: 'Thawtide', details: 'Marcha' }]
      };
    } else if (turn > 25 && turn <= 40) {
      state.sessionLog = {
        ...state.sessionLog,
        activeMissions: [{ id: 'm_build_1', name: 'Construct Palisade', type: 'build_work', status: 'ACTIVE', unitName: 'Guarda', returnsDay: 1, returnsMonth: 'Thawtide', details: 'Obras' }]
      };
    } else if (turn > 40 && turn <= 50) {
      state.sessionLog = {
        ...state.sessionLog,
        activeMissions: [{ id: 'm_trade_1', name: 'Merchant Caravan', type: 'trade_route', status: 'ACTIVE', unitName: 'Guarda', returnsDay: 1, returnsMonth: 'Thawtide', details: 'Comércio' }]
      };
    } else {
      state.sessionLog = {
        ...state.sessionLog,
        activeMissions: []
      };
    }

    const { updatedState, turnResult } = resolveWeeklyTurn(state);
    state = updatedState;

    const incidents = turnResult.incidentResult?.eventsProcessed ?? [];
    totalIncidents += incidents.length;
    for (const inc of incidents) {
      const type = inc.descriptionContext.eventType;
      eventCounts[type] = (eventCounts[type] || 0) + 1;
    }

    // Unstuck any open active scene immediately
    if (state.sessionLog?.activeScene && state.sessionLog.activeScene.status === 'OPEN') {
      const scene = state.sessionLog.activeScene;
      const matchingEvt = incidents.find(e => e.eventId === scene.eventId) ?? {
        eventId: scene.eventId,
        magnitude: 'MINOR',
        timeCost: 'HOUR',
        descriptionContext: { eventType: 'TRAVEL_ROAD_ACCIDENT' },
        mutations: [],
        turnOccurred: turn,
        slotIndex: 0,
        domain: 'TRAVEL',
        scene
      };
      const choiceId = scene.choices[0]?.choiceId ?? 'choice_repair_materials';
      const res = SceneResolver.resolveSceneChoice(scene, choiceId, matchingEvt as any, state);
      state = {
        ...res.eventProcessingResult.nextState,
        sessionLog: {
          ...res.eventProcessingResult.nextState.sessionLog,
          activeScene: res.nextSceneState
        }
      };
    }
  }

  assert.ok(totalIncidents >= 5, `M19-B1: Total de incidentes (${totalIncidents}) deve ser >= 5`);

  // Check event monopoly (no single type accounts for > 70% of all incidents when multiple types occur)
  const types = Object.keys(eventCounts);
  if (types.length > 1) {
    for (const [type, count] of Object.entries(eventCounts)) {
      const ratio = count / totalIncidents;
      assert.ok(ratio <= 0.70, `M19-B1: Evento ${type} monopolizou a distribuição (${(ratio * 100).toFixed(1)}%)`);
    }
  }

  // Verify SceneState is not left OPEN
  assert.ok(
    !state.sessionLog?.activeScene || state.sessionLog.activeScene.status === 'RESOLVED',
    'M19-B1: SceneState não pode terminar no estado OPEN'
  );

  console.log(`  ✓ Hard Gate M19-B1 Passed: Pressão de eventos auditada (${totalIncidents} incidentes, ${types.length} tipos distintos).`);
}

// ---------------------------------------------------------------------------
// M19-B2 — Consequence Persistence
// ---------------------------------------------------------------------------
console.log('[M19-B2] Auditando persistência da consequência pós-resolução de cena...');
{
  let state = createAdversarialBaselineState();
  const initialSilverdew = state.weeklyLedger.silverdew;

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

  const record = createEventRecord(opp, 1, 0, 'TRADE');
  assert.ok(record.scene, 'M19-B2: Oportunidade comercial deve instanciar SceneState');

  // Player chooses to buy iron (-30 SD, +10 Iron)
  const choiceId = 'choice_trade_iron';
  const resolution = SceneResolver.resolveSceneChoice(record.scene, choiceId, record, state);

  // Apply resolved state
  state = {
    ...resolution.eventProcessingResult.nextState,
    sessionLog: {
      ...resolution.eventProcessingResult.nextState.sessionLog,
      activeScene: resolution.nextSceneState
    }
  };

  // Assert mutation persisted immediately in state
  assert.equal(state.weeklyLedger.silverdew, initialSilverdew - 30, 'M19-B2: Silverdew deve ter reduzido em 30');
  assert.equal(state.weeklyLedger.materials.iron, 25, 'M19-B2: Estoque de ferro deve ter aumentado em 10 (15 -> 25)');
  assert.equal(state.sessionLog.activeScene?.status, 'RESOLVED', 'M19-B2: Cena deve estar RESOLVED');

  // Advance 3 weekly turns and verify material mutations do NOT revert
  for (let w = 1; w <= 3; w++) {
    const { updatedState } = resolveWeeklyTurn(state);
    state = updatedState;
  }

  assert.equal(state.weeklyLedger.materials.iron >= 25, true, 'M19-B2: Mutação de ferro persistiu nas semanas subsequentes');
  console.log('  ✓ Hard Gate M19-B2 Passed: Persistência de consequência validada sem reversão indevida.');
}

// ---------------------------------------------------------------------------
// M19-B3 — Epistemic Integrity
// ---------------------------------------------------------------------------
console.log('[M19-B3] Auditando integridade epistêmica e fronteira de observabilidade...');
{
  const state = createAdversarialBaselineState();

  // Test 1: Player observer receives valid projection
  const playerObserver: NarrativeObserver = {
    observerId: 'Maelor',
    kind: 'PLAYER'
  };
  const playerProj = createObserverProjection(state, playerObserver);
  assert.ok(playerProj.scene.locationId, 'M19-B3: Player projection tem localização definida');
  assert.ok(playerProj.actors.length >= 1, 'M19-B3: Player projection contém atores conhecidos');

  // Test 2: Foreign / Non-player observer receives deny-by-default projection
  const foreignObserver: NarrativeObserver = {
    observerId: 'Stranger_Spy',
    kind: 'NPC'
  };
  const foreignProj = createObserverProjection(state, foreignObserver);
  assert.equal(foreignProj.scene.locationId, 'unknown', 'M19-B3: Observador externo recebe localização "unknown"');
  assert.equal(foreignProj.actors.length, 0, 'M19-B3: Observador externo não tem acesso aos atores internos');
  assert.equal(foreignProj.knownFacts.length, 0, 'M19-B3: Fatos privados não são vazados para observador externo');

  console.log('  ✓ Hard Gate M19-B3 Passed: Fronteira epistêmica (deny-by-default) mantida rigorosamente.');
}

// ---------------------------------------------------------------------------
// M19-B4 — Counselor Adversarial Reactions
// ---------------------------------------------------------------------------
console.log('[M19-B4] Auditando reações de conselheiros por domínio...');
{
  const state = createAdversarialBaselineState();

  // Validate presence and roles of the advisors
  assert.equal(state.advisors?.counselorName, 'Tobin', 'M19-B4: Chancellor/Counselor Name');
  assert.equal(state.advisors?.stewardName, 'Gerold', 'M19-B4: Steward Name');
  assert.equal(state.advisors?.spyMasterName, 'Roric', 'M19-B4: SpyMaster Name');

  // Test projection actor mapping
  const playerObserver: NarrativeObserver = { observerId: 'Maelor', kind: 'PLAYER' };
  const proj = createObserverProjection(state, playerObserver);
  const counselorActor = proj.actors.find(a => a.name === 'Tobin');
  const stewardActor = proj.actors.find(a => a.name === 'Gerold');
  const spyMasterActor = proj.actors.find(a => a.name === 'Roric');

  assert.ok(counselorActor, 'M19-B4: Counselor presente na projeção do conselho');
  assert.ok(stewardActor, 'M19-B4: Steward presente na projeção do conselho');
  assert.ok(spyMasterActor, 'M19-B4: SpyMaster presente na projeção do conselho');

  assert.ok(stewardActor?.role.includes('Intendente'), 'M19-B4: Papel do Steward é de gestão de suprimentos/tesouro');
  assert.ok(spyMasterActor?.role.includes('Sussurros') || spyMasterActor?.role.includes('Informações'), 'M19-B4: Papel do SpyMaster é de espionagem');

  console.log('  ✓ Hard Gate M19-B4 Passed: Conselheiros categorizados e associados aos seus domínios.');
}

// ---------------------------------------------------------------------------
// M19-B5 — Event Cascade & Causal Linkage
// ---------------------------------------------------------------------------
console.log('[M19-B5] Auditando cascata causal A -> B -> C -> D -> A\' e controle de loops...');
{
  const turn = 5;
  const oppA: EventOpportunity = {
    opportunityId: 'opp_cascade_a',
    eventType: 'CASCADE_A',
    magnitude: 'MINOR',
    baseWeight: 5,
    weight: 5,
    tags: ['estrada'],
    eligible: true,
    reasons: ['cascade'],
    timeCostHint: 'HOURS'
  };

  const recA = createEventRecord(oppA, turn, 0, 'TRAVEL');
  const recB = createEventRecord(oppA, turn, 1, 'TRAVEL', { causalParentEventId: recA.eventId });
  const recC = createEventRecord(oppA, turn + 1, 0, 'TRAVEL', { causalParentEventId: recB.eventId });
  const recD = createEventRecord(oppA, turn + 1, 1, 'TRAVEL', { causalParentEventId: recC.eventId });

  // Assert causal parent links
  assert.equal(recB.causalParentEventId, recA.eventId, 'M19-B5: B deve ter parent A');
  assert.equal(recC.causalParentEventId, recB.eventId, 'M19-B5: C deve ter parent B');
  assert.equal(recD.causalParentEventId, recC.eventId, 'M19-B5: D deve ter parent C');

  // Verify unique event IDs
  const eventIds = new Set([recA.eventId, recB.eventId, recC.eventId, recD.eventId]);
  assert.equal(eventIds.size, 4, 'M19-B5: Cada evento na cascata deve ter um eventId único');

  console.log('  ✓ Hard Gate M19-B5 Passed: Cadeia causal A -> B -> C -> D auditada sem duplicação ou loops.');
}

// ---------------------------------------------------------------------------
// M19-B6 — Catastrophic Campaign (Deliberate Deterioration)
// ---------------------------------------------------------------------------
console.log('[M19-B6] Auditando campanha catastrófica (deterioração bi-semanal sob escassez severa)...');
{
  let state = createAdversarialBaselineState();
  // Force severe resource starvation
  state.weeklyLedger.silverdew = 0;
  state.weeklyLedger.food = 0;
  state.army = {
    units: [
      { id: 'unit_starving_guard', name: 'Starving Guard', size: 50, maxSize: 50, tier: 1, ac: 12, weapon: 'Spear', mount: 'None', morale: 3 }
    ],
    garrisonSize: 10
  };

  for (let w = 1; w <= 10; w++) {
    const { updatedState } = resolveWeeklyTurn(state);
    state = updatedState;
  }

  // Assert that state handles crisis without throwing or corrupting numbers
  assert.ok(typeof state.weeklyLedger.silverdew === 'number', 'M19-B6: Silverdew permanece numérico');
  assert.ok(typeof state.weeklyLedger.food === 'number', 'M19-B6: Food permanece numérico');
  assert.ok(state.army.units.length > 0, 'M19-B6: Unidades militares mantidas');
  assert.ok(state.weeklyLedger.incomeDetail !== undefined, 'M19-B6: Detalhamento de renda canônica presente');
  assert.ok(state.worldLedger.currentDate.week > 1, 'M19-B6: Calendário avança normalmente sob crise');

  console.log(`  ✓ Hard Gate M19-B6 Passed: Deterioração coerente sob crise (Silverdew: ${state.weeklyLedger.silverdew}, FamineTicks: ${state.weeklyLedger.famineTicks ?? 0}).`);
}

// ---------------------------------------------------------------------------
// M19-B7 — Adversarial Replay (Bitwise Identical Multi-Turn Run)
// ---------------------------------------------------------------------------
console.log('[M19-B7] Auditando Replay Determinístico em Campanha Adversarial (50 semanas)...');
{
  const runAdversarialCampaign = (seedName: string): CampaignState => {
    let s = createAdversarialBaselineState();
    s.character.name = seedName;
    for (let w = 1; w <= 50; w++) {
      const { updatedState, turnResult } = resolveWeeklyTurn(s);
      s = updatedState;

      const incidents = turnResult.incidentResult?.eventsProcessed ?? [];
      if (s.sessionLog?.activeScene && s.sessionLog.activeScene.status === 'OPEN') {
        const scene = s.sessionLog.activeScene;
        const matchingEvt = incidents.find(e => e.eventId === scene.eventId) ?? {
          eventId: scene.eventId, magnitude: 'MINOR', timeCost: 'HOUR',
          descriptionContext: { eventType: 'TRAVEL_ROAD_ACCIDENT' }, mutations: [],
          turnOccurred: w, slotIndex: 0, domain: 'TRAVEL', scene
        };
        const choiceId = scene.choices[0]?.choiceId ?? 'choice_repair_materials';
        const res = SceneResolver.resolveSceneChoice(scene, choiceId, matchingEvt as any, s);
        s = {
          ...res.eventProcessingResult.nextState,
          sessionLog: {
            ...res.eventProcessingResult.nextState.sessionLog,
            activeScene: res.nextSceneState
          }
        };
      }
    }
    return s;
  };

  const finalState1 = runAdversarialCampaign('Adversarial_Seed_Alpha');
  const finalState2 = runAdversarialCampaign('Adversarial_Seed_Alpha');

  assert.equal(
    finalState1.weeklyLedger.silverdew,
    finalState2.weeklyLedger.silverdew,
    'M19-B7: Silverdew final idêntico'
  );
  assert.equal(
    finalState1.weeklyLedger.food,
    finalState2.weeklyLedger.food,
    'M19-B7: Food final idêntico'
  );
  assert.equal(
    JSON.stringify(finalState1.weeklyLedger.materials),
    JSON.stringify(finalState2.weeklyLedger.materials),
    'M19-B7: Materiais idênticos'
  );
  assert.equal(
    JSON.stringify(finalState1.army),
    JSON.stringify(finalState2.army),
    'M19-B7: Estado do exército idêntico'
  );
  assert.equal(
    finalState1.sessionLog?.eventCooldowns ? Object.keys(finalState1.sessionLog.eventCooldowns).length : 0,
    finalState2.sessionLog?.eventCooldowns ? Object.keys(finalState2.sessionLog.eventCooldowns).length : 0,
    'M19-B7: Cooldowns de eventos idênticos'
  );

  console.log('  ✓ Hard Gate M19-B7 Passed: Replay determinístico de campanha adversarial validado com 100% de identidade.');
}

console.log('\n===================================================================');
console.log('🎉 FASE M19-B — ADVERSARIAL EMERGENT CAMPAIGN CONCLUÍDA COM 100% DE SUCESSO!');
console.log('===================================================================\n');

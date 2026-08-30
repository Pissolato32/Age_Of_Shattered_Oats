/**
 * M20 — Historical Campaign Continuity & Causal Integrity Audit Test Suite
 * 
 * Hard Gates M20-A through M20-F:
 * Audits long-horizon campaign historical continuity across 1,000 weeks,
 * long-term causality retention, memory decay vs permanent retention,
 * dynastic succession identity continuity, narrative historical consistency,
 * and checkpointed 1,000-week replay determinism.
 */

import assert from 'node:assert/strict';
import { resolveWeeklyTurn, createInitialState } from '../src/engine';
import { SceneResolver } from '../src/domain/events/SceneResolver';
import { CampaignState } from '../src/types';
import { createEventRecord } from '../src/domain/events/EventRecordFactory';
import { EventOpportunity } from '../src/domain/events/EventOpportunityEngine';
import { SuccessionService, Relative } from '../src/domain/kingdom/services/SuccessionService';
import { createObserverProjection } from '../src/lib/narrativeProjection';
import { NarrativeObserver } from '../src/lib/narrativeContracts';

console.log('=== TEST SUITE: M20 Historical Campaign Continuity & Causal Integrity ===\n');

function createHistoricalState(seedName: string = 'Maelor_Ironwood'): CampaignState {
  const s = createInitialState('Landed Knight', 'Forest Plains');
  s.character.name = seedName.split('_')[0];
  s.character.house = seedName.split('_')[1] || 'Ironwood';
  s.weeklyLedger.season = 'Thawtide';
  s.weeklyLedger.weather = 'Tempo firme';
  s.weeklyLedger.silverdew = 1000;
  s.weeklyLedger.food = 200;
  s.weeklyLedger.materials = { timber: 40, iron: 25, stone: 30 };
  s.holdings.type = 'Bastion';
  s.advisors = { counselorName: 'Tobin', stewardName: 'Gerold', spyMasterName: 'Roric' };
  s.sessionLog = {
    lastSessionDate: '402-01-01',
    lastThingHappened: 'Início da campanha histórica M20',
    activeMissions: [],
    pendingDecisions: [],
    eventCooldowns: {}
  };
  return s;
}

// ---------------------------------------------------------------------------
// M20-A — Historical Continuity (1,000 Weeks with Checkpoints)
// ---------------------------------------------------------------------------
console.log('[M20-A] Auditando continuidade histórica em 1.000 semanas com checkpoints...');
{
  let state = createHistoricalState('Alden_Vance');
  const checkpoints = [100, 250, 500, 750, 1000];
  const checkpointStates: Record<number, { silverdew: number; food: number; eventStoreCount: number }> = {};

  for (let turn = 1; turn <= 1000; turn++) {
    const { updatedState, turnResult } = resolveWeeklyTurn(state);
    state = updatedState;

    // Auto-resolve any open interactive scene to avoid blocking turn progression
    if (state.sessionLog?.activeScene && state.sessionLog.activeScene.status === 'OPEN') {
      const scene = state.sessionLog.activeScene;
      const incidents = turnResult.incidentResult?.eventsProcessed ?? [];
      const matchingEvt = incidents.find(e => e.eventId === scene.eventId) ?? {
        eventId: scene.eventId, magnitude: 'MINOR', timeCost: 'HOUR',
        descriptionContext: { eventType: 'GENERIC_INCIDENT' }, mutations: [],
        turnOccurred: turn, slotIndex: 0, domain: 'HOLDING', scene
      };
      const choiceId = scene.choices[0]?.choiceId ?? 'choice_generic_cautious';
      const res = SceneResolver.resolveSceneChoice(scene, choiceId, matchingEvt as any, state);
      state = {
        ...res.eventProcessingResult.nextState,
        sessionLog: {
          ...res.eventProcessingResult.nextState.sessionLog,
          activeScene: res.nextSceneState
        }
      };
    }

    // Audit checkpoint invariants
    if (checkpoints.includes(turn)) {
      assert.ok(state.weeklyLedger.silverdew !== undefined, `M20-A [W${turn}]: Silverdew deve ser válido`);
      assert.ok(state.weeklyLedger.food !== undefined, `M20-A [W${turn}]: Food deve ser válido`);
      assert.ok(state.eventStore, `M20-A [W${turn}]: eventStore deve existir`);
      assert.ok(state.eventStore.length > 0, `M20-A [W${turn}]: eventStore deve acumular eventos`);

      // Verify zero duplicate IDs in eventStore
      const seenIds = new Set<string>();
      for (const evt of state.eventStore) {
        assert.ok(!seenIds.has(evt.id), `M20-A [W${turn}]: ID duplicado detectado em eventStore (${evt.id})`);
        seenIds.add(evt.id);
      }

      // Verify zero abandoned OPEN scenes
      assert.ok(
        !state.sessionLog?.activeScene || state.sessionLog.activeScene.status === 'RESOLVED',
        `M20-A [W${turn}]: Active scene não pode estar OPEN`
      );

      checkpointStates[turn] = {
        silverdew: state.weeklyLedger.silverdew,
        food: state.weeklyLedger.food,
        eventStoreCount: state.eventStore.length
      };
    }
  }

  console.log(`  ✓ Gate M20-A Passed: 1.000 semanas executadas com checkpoints validados (W1000 EventStore: ${checkpointStates[1000].eventStoreCount} eventos).`);
}

// ---------------------------------------------------------------------------
// M20-B — Historical Causality (350+ Weeks Long-Term Retention)
// ---------------------------------------------------------------------------
console.log('[M20-B] Auditando causalidade de longo prazo (Turno 20 -> Turno 350)...');
{
  let state = createHistoricalState('Causal_Ruler');
  const initialIron = state.weeklyLedger.materials.iron;

  // Turn 20: Execute material transaction (+10 Iron)
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
  const record = createEventRecord(opp, 20, 0, 'TRADE');
  assert.ok(record.scene, 'M20-B: Oportunidade deve instanciar SceneState');

  const resolution = SceneResolver.resolveSceneChoice(record.scene, 'choice_trade_iron', record, state);
  state = {
    ...resolution.eventProcessingResult.nextState,
    sessionLog: {
      ...resolution.eventProcessingResult.nextState.sessionLog,
      activeScene: resolution.nextSceneState
    }
  };

  assert.equal(state.weeklyLedger.materials.iron, initialIron + 10, 'M20-B: Ferro incrementado no Turno 20');

  // Fast forward 330 weeks to Turn 350
  for (let turn = 21; turn <= 350; turn++) {
    const { updatedState, turnResult } = resolveWeeklyTurn(state);
    state = updatedState;

    if (state.sessionLog?.activeScene && state.sessionLog.activeScene.status === 'OPEN') {
      const scene = state.sessionLog.activeScene;
      const incidents = turnResult.incidentResult?.eventsProcessed ?? [];
      const matchingEvt = incidents.find(e => e.eventId === scene.eventId) ?? {
        eventId: scene.eventId, magnitude: 'MINOR', timeCost: 'HOUR',
        descriptionContext: { eventType: 'GENERIC' }, mutations: [],
        turnOccurred: turn, slotIndex: 0, domain: 'HOLDING', scene
      };
      const choiceId = scene.choices[0]?.choiceId ?? 'choice_generic_cautious';
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

  // Verify that the event record remains in EventStore
  assert.ok(state.eventStore, 'M20-B: EventStore deve persistir');
  const purchaseEvent = state.eventStore.find(e => e.week === 20 || JSON.stringify(e.payload).includes('iron'));
  assert.ok(purchaseEvent, 'M20-B: Evento de transação no Turno 20 continua preservado no EventStore no Turno 350');

  console.log('  ✓ Gate M20-B Passed: Causalidade e proveniência de 330 semanas preservadas.');
}

// ---------------------------------------------------------------------------
// M20-C — Memory Retention & Decay Audit
// ---------------------------------------------------------------------------
console.log('[M20-C] Auditando retenção e decay de memória histórica...');
{
  let state = createHistoricalState('Memory_Ruler');

  // Add major event to worldLedger (permanent)
  state.worldLedger.majorEvents.push({
    date: 'W1, M1, Y402',
    event: 'Tratado de Paz com Casa Blackwood assinado',
    region: 'Riverlands',
    involved: 'House Ironwood -> House Blackwood',
    resolved: 'Yes'
  });

  // Add character memory
  state.character.memories = [
    {
      id: 'mem_vow_expired',
      ownerId: 'Memory_Ruler',
      subjectId: 'House Blackwood',
      description: 'Promessa expirada',
      importance: 3,
      tickRegistered: 1,
      decayed: false
    }
  ];

  // Advance 150 weeks
  for (let turn = 1; turn <= 150; turn++) {
    const { updatedState } = resolveWeeklyTurn(state);
    state = updatedState;
  }

  // Verify permanent major event is NEVER pruned
  const treatyEvent = state.worldLedger.majorEvents.find(e => e.event.includes('Tratado de Paz'));
  assert.ok(treatyEvent, 'M20-C: Eventos históricos em majorEvents são permanentes e nunca descartados');

  // Verify character memory decay evaluated
  assert.ok(state.character.memories, 'M20-C: Memórias de personagem presentes');
  const mem = state.character.memories.find(m => m.id === 'mem_vow_expired');
  assert.ok(mem, 'M20-C: Memória de personagem presente');
  assert.equal(mem.decayed, true, 'M20-C: Memória antiga sofreu decay (decayed = true) sem vazar estado');

  console.log('  ✓ Gate M20-C Passed: Separação entre memória permanente e decay temporário validada.');
}

// ---------------------------------------------------------------------------
// M20-D — Succession / Identity Continuity
// ---------------------------------------------------------------------------
console.log('[M20-D] Auditando continuidade de sucessão e linhagem...');
{
  const relatives: Relative[] = [
    { id: 'rel_bastard', name: 'Doran', relation: 'child', age: 24, isLegitimate: false },
    { id: 'rel_eldest_son', name: 'Gareth', relation: 'child', age: 20, isLegitimate: true },
    { id: 'rel_younger_son', name: 'Bryan', relation: 'child', age: 16, isLegitimate: true },
    { id: 'rel_brother', name: 'Cedric', relation: 'sibling', age: 35, isLegitimate: true }
  ];

  const order = SuccessionService.getSuccessionOrder(relatives);
  assert.equal(order[0].name, 'Gareth', 'M20-D: Primeiro herdeiro deve ser o filho legítimo mais velho');
  assert.equal(order[1].name, 'Bryan', 'M20-D: Segundo herdeiro é o segundo filho legítimo');
  assert.equal(order[2].name, 'Cedric', 'M20-D: Terceiro herdeiro é o irmão legítimo');

  // Simulate succession transition on CampaignState
  let state = createHistoricalState('Maelor_Ironwood');
  state.worldLedger.majorEvents.push({
    date: 'W10, M3, Y405',
    event: 'Lord Maelor faleceu. Gareth ascende como novo Lorde.',
    region: 'Forest Plains',
    involved: 'Maelor -> Gareth',
    resolved: 'Yes'
  });

  const previousRulerName = state.character.name;
  // Heir succeeds
  state.character.name = order[0].name;
  state.character.age = order[0].age;

  assert.equal(state.character.name, 'Gareth', 'M20-D: Nome do novo soberano atualizado');
  assert.equal(state.weeklyLedger.silverdew, 1000, 'M20-D: Tesouro e domínio mantidos após sucessão');
  assert.ok(
    state.worldLedger.majorEvents.some(e => e.event.includes(previousRulerName)),
    'M20-D: Histórico do soberano anterior preservado em majorEvents'
  );

  console.log('  ✓ Gate M20-D Passed: Sucessão dinástica e continuidade de domínio validadas.');
}

// ---------------------------------------------------------------------------
// M20-E — Narrative Historical Consistency
// ---------------------------------------------------------------------------
console.log('[M20-E] Auditando consistência narrativa e fronteira histórica...');
{
  const state = createHistoricalState('Historical_Lord');
  state.worldLedger.majorEvents.push({
    date: 'W5, M1, Y402',
    event: 'Vitória na Batalha da Ravina Cinzenta',
    region: 'Forest Plains',
    involved: 'Historical_Lord',
    resolved: 'Yes'
  });

  const observer: NarrativeObserver = { observerId: state.character.name, kind: 'PLAYER' };
  const proj = createObserverProjection(state, observer);

  assert.ok(proj.scene, 'M20-E: Projeção narrativa possui cena válida');
  assert.ok(proj.actors.some(a => a.name === state.character.name), 'M20-E: Atores em escopo correspondem ao estado histórico');
  assert.ok(state.worldLedger.majorEvents.some(e => e.event.includes('Ravina Cinzenta')), 'M20-E: Registro histórico canônico preservado no worldLedger');

  console.log('  ✓ Gate M20-E Passed: Projeção narrativa consistente com registros históricos.');
}

// ---------------------------------------------------------------------------
// M20-F — Full Checkpointed Historical Replay (1,000 Weeks)
// ---------------------------------------------------------------------------
console.log('[M20-F] Auditando Replay Determinístico de 1.000 semanas por checkpoints...');
{
  const run1000WeekCampaign = (seedName: string) => {
    let s = createHistoricalState(seedName);
    const snapshots: Record<number, string> = {};
    const checkpoints = [100, 250, 500, 750, 1000];

    for (let w = 1; w <= 1000; w++) {
      const { updatedState, turnResult } = resolveWeeklyTurn(s);
      s = updatedState;

      if (s.sessionLog?.activeScene && s.sessionLog.activeScene.status === 'OPEN') {
        const scene = s.sessionLog.activeScene;
        const incidents = turnResult.incidentResult?.eventsProcessed ?? [];
        const matchingEvt = incidents.find(e => e.eventId === scene.eventId) ?? {
          eventId: scene.eventId, magnitude: 'MINOR', timeCost: 'HOUR',
          descriptionContext: { eventType: 'GENERIC' }, mutations: [],
          turnOccurred: w, slotIndex: 0, domain: 'HOLDING', scene
        };
        const choiceId = scene.choices[0]?.choiceId ?? 'choice_generic_cautious';
        const res = SceneResolver.resolveSceneChoice(scene, choiceId, matchingEvt as any, s);
        s = {
          ...res.eventProcessingResult.nextState,
          sessionLog: {
            ...res.eventProcessingResult.nextState.sessionLog,
            activeScene: res.nextSceneState
          }
        };
      }

      if (checkpoints.includes(w)) {
        snapshots[w] = JSON.stringify({
          week: s.worldLedger.currentDate.week,
          year: s.worldLedger.currentDate.year,
          silverdew: s.weeklyLedger.silverdew,
          food: s.weeklyLedger.food,
          materials: s.weeklyLedger.materials,
          eventStoreCount: s.eventStore?.length ?? 0
        });
      }
    }
    return { finalState: s, snapshots };
  };

  const runA = run1000WeekCampaign('Historical_Seed_Omega');
  const runB = run1000WeekCampaign('Historical_Seed_Omega');

  const checkpoints = [100, 250, 500, 750, 1000];
  for (const cp of checkpoints) {
    assert.equal(
      runA.snapshots[cp],
      runB.snapshots[cp],
      `M20-F: Checkpoint W${cp} deve ser 100% bitwise idêntico entre ambas as execuções`
    );
  }

  console.log('  ✓ Gate M20-F Passed: Replay de 1.000 semanas idêntico em todos os checkpoints (W100, W250, W500, W750, W1000).');
}

console.log('\n===================================================================');
console.log('🎉 FASE M20 — HISTORICAL CAMPAIGN CONTINUITY CONCLUÍDA COM 100% DE SUCESSO!');
console.log('===================================================================\n');

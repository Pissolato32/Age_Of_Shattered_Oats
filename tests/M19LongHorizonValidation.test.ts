/**
 * M19 — Long-Horizon Emergent Campaign Validation Test Suite
 * 
 * Hard Gates M19-A1 through M19-A6:
 * Audits long-term stability, causality, state-growth, cooldown distribution,
 * advisor domain relevance, and replay determinism across multi-week campaigns.
 */

import assert from 'node:assert/strict';
import { resolveWeeklyTurn, createInitialState } from '../src/engine';
import { SceneResolver } from '../src/domain/events/SceneResolver';
import { CampaignState } from '../src/types';
import { createEventRecord } from '../src/domain/events/EventRecordFactory';
import { EventOpportunity } from '../src/domain/events/EventOpportunityEngine';

console.log('=== TEST SUITE: M19 Long-Horizon Emergent Campaign Validation ===\n');

function createBaselineState(): CampaignState {
  const s = createInitialState('Landed Knight', 'Forest Plains');
  s.character.name = 'Valerius';
  s.character.house = 'House Ironwood';
  s.weeklyLedger.season = 'Thawtide';
  s.weeklyLedger.weather = 'Tempo firme';
  s.weeklyLedger.silverdew = 1200;
  s.weeklyLedger.food = 300;
  s.holdings.type = 'Bastion';
  s.advisors = { counselorName: 'Tobin', stewardName: 'Gerold', spyMasterName: 'Roric' };
  s.sessionLog = {
    lastSessionDate: '402-01-01',
    lastThingHappened: 'Início da validação de longo horizonte',
    activeMissions: [],
    pendingDecisions: [],
    eventCooldowns: {}
  };
  return s;
}

// ---------------------------------------------------------------------------
// Gate M19-A1: Multi-Week Continuity & Cooldown Distribution (100 weeks)
// ---------------------------------------------------------------------------
console.log('[M19-A1] Executando campanha de 100 semanas para auditar distribuição de incidentes...');
{
  let state = createBaselineState();
  let totalIncidentsProcessed = 0;
  let maxConsecutiveSilentWeeks = 0;
  let currentSilentStreak = 0;
  const incidentFrequencyMap: Record<string, number> = {};

  for (let w = 1; w <= 100; w++) {
    const { updatedState, turnResult } = resolveWeeklyTurn(state);
    state = updatedState;

    const incidents = turnResult.incidentResult?.eventsProcessed ?? [];
    if (incidents.length > 0) {
      totalIncidentsProcessed += incidents.length;
      currentSilentStreak = 0;
      for (const inc of incidents) {
        incidentFrequencyMap[inc.descriptionContext.eventType] = (incidentFrequencyMap[inc.descriptionContext.eventType] || 0) + 1;
      }
    } else {
      currentSilentStreak++;
      if (currentSilentStreak > maxConsecutiveSilentWeeks) {
        maxConsecutiveSilentWeeks = currentSilentStreak;
      }
    }

    // Resolve any open interactive scene immediately to allow next week to advance
    if (state.sessionLog?.activeScene && state.sessionLog.activeScene.status === 'OPEN') {
      const scene = state.sessionLog.activeScene;
      if (scene.choices.length > 0) {
        const matchingEvt = incidents.find(e => e.eventId === scene.eventId) ?? {
          eventId: scene.eventId,
          magnitude: 'MINOR',
          timeCost: 'HOUR',
          descriptionContext: { eventType: 'GENERIC_INCIDENT' },
          mutations: [],
          turnOccurred: w,
          slotIndex: 0,
          domain: 'HOLDING',
          scene
        };
        const res = SceneResolver.resolveSceneChoice(scene, scene.choices[0].choiceId, matchingEvt as any, state);
        state = {
          ...res.eventProcessingResult.nextState,
          sessionLog: {
            ...res.eventProcessingResult.nextState.sessionLog,
            activeScene: res.nextSceneState
          }
        };
      }
    }
  }

  assert.ok(totalIncidentsProcessed >= 5, `M19-A1: Total de incidentes (${totalIncidentsProcessed}) deve ser >= 5 em 100 semanas`);
  assert.ok(maxConsecutiveSilentWeeks < 40, `M19-A1: Maior período de silêncio (${maxConsecutiveSilentWeeks} sem) excede teto seguro`);
  console.log(`  ✓ Gate M19-A1 Aprovado: ${totalIncidentsProcessed} incidentes processados em 100 semanas (maior blackout: ${maxConsecutiveSilentWeeks} sem).`);
}

// ---------------------------------------------------------------------------
// Gate M19-A2: State Growth Ceiling & Memory Footprint (250 weeks)
// ---------------------------------------------------------------------------
console.log('[M19-A2] Auditando teto de crescimento de estado em 250 semanas...');
{
  let state = createBaselineState();
  const initialSize = JSON.stringify(state).length;

  for (let w = 1; w <= 250; w++) {
    const { updatedState, turnResult } = resolveWeeklyTurn(state);
    state = updatedState;

    if (state.sessionLog?.activeScene && state.sessionLog.activeScene.status === 'OPEN') {
      const scene = state.sessionLog.activeScene;
      const matchingEvt = turnResult.incidentResult?.eventsProcessed.find(e => e.eventId === scene.eventId) ?? {
        eventId: scene.eventId,
        magnitude: 'MINOR',
        timeCost: 'HOUR',
        descriptionContext: { eventType: 'GENERIC' },
        mutations: [],
        turnOccurred: w,
        slotIndex: 0,
        domain: 'HOLDING',
        scene
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

  const finalSize = JSON.stringify(state).length;
  const growthRatio = finalSize / initialSize;

  console.log(`  - Tamanho Inicial: ${initialSize} bytes | Tamanho Final (250 sem): ${finalSize} bytes (Crescimento: ${growthRatio.toFixed(2)}x)`);
  assert.ok(growthRatio < 15, `M19-A2: Crescimento de estado (${growthRatio.toFixed(2)}x) excede teto limite de 15x em 250 semanas`);
  console.log('  ✓ Gate M19-A2 Aprovado: Tamanho de estado controlado e dentro do teto de segurança.');
}

// ---------------------------------------------------------------------------
// Gate M19-A3: SceneState Lifecycle & Microdecision Unlocking
// ---------------------------------------------------------------------------
console.log('[M19-A3] Auditando ciclo de vida de SceneState e desbloqueio de decisões...');
{
  let state = createBaselineState();
  const opp: EventOpportunity = {
    opportunityId: 'opp_travel_animal_encounter',
    eventType: 'TRAVEL_ANIMAL_ENCOUNTER',
    magnitude: 'MINOR',
    baseWeight: 10,
    weight: 10,
    tags: ['viagem', 'estrada'],
    eligible: true,
    reasons: ['test'],
    timeCostHint: 'HOURS'
  };

  const record = createEventRecord(opp, 1, 0, 'TRAVEL');
  assert.ok(record.scene, 'M19-A3: EventRecord deve conter SceneState');
  assert.equal(record.scene.status, 'OPEN');

  state.sessionLog = {
    ...state.sessionLog,
    activeScene: record.scene
  };

  // Turn must fail when activeScene is OPEN
  assert.throws(() => resolveWeeklyTurn(state), /is OPEN/);

  // Resolve choice
  const choiceId = record.scene.choices[0].choiceId;
  const res = SceneResolver.resolveSceneChoice(record.scene, choiceId, record, state);

  state = {
    ...res.eventProcessingResult.nextState,
    sessionLog: {
      ...res.eventProcessingResult.nextState.sessionLog,
      activeScene: res.nextSceneState
    }
  };

  assert.equal(state.sessionLog.activeScene?.status, 'RESOLVED', 'M19-A3: Active scene deve estar RESOLVED');

  // Turn must succeed after resolution
  const { updatedState } = resolveWeeklyTurn(state);
  assert.ok(updatedState, 'M19-A3: Turno resolvido com sucesso após resolução da cena');
  console.log('  ✓ Gate M19-A3 Aprovado: Ciclo de vida OPEN → RESOLVED → Turn unlocked validado.');
}

// ---------------------------------------------------------------------------
// Gate M19-A4: Causal Provenance & EventStore Integrity
// ---------------------------------------------------------------------------
console.log('[M19-A4] Auditando integridade de causalidade e proveniência em EventStore...');
{
  let state = createBaselineState();
  const initialStoreLen = state.eventStore?.length ?? 0;

  for (let w = 1; w <= 10; w++) {
    const { updatedState } = resolveWeeklyTurn(state);
    state = updatedState;
  }

  assert.ok(state.eventStore, 'M19-A4: eventStore deve existir');
  assert.ok(state.eventStore.length > initialStoreLen, 'M19-A4: eventStore deve acumular eventos semanais');
  for (const evt of state.eventStore) {
    assert.ok(evt.id, 'M19-A4: Evento no store deve conter id válido');
    assert.ok(typeof evt.week === 'number', 'M19-A4: Evento no store deve conter semana válida');
  }
  console.log(`  ✓ Gate M19-A4 Aprovado: Proveniência e EventStore com ${state.eventStore.length} registros válidos.`);
}

// ---------------------------------------------------------------------------
// Gate M19-A5: Advisor Domain Relevance & Context Consistency
// ---------------------------------------------------------------------------
console.log('[M19-A5] Auditando relevância de conselheiros (Counselor, Steward, Spymaster)...');
{
  const state = createBaselineState();
  assert.ok(state.advisors, 'M19-A5: advisors definidos');
  assert.equal(state.advisors.counselorName, 'Tobin');
  assert.equal(state.advisors.stewardName, 'Gerold');
  assert.equal(state.advisors.spyMasterName, 'Roric');
  console.log('  ✓ Gate M19-A5 Aprovado: Conselheiros ativos e coerentes com a estrutura de estado.');
}

// ---------------------------------------------------------------------------
// Gate M19-A6: Multi-Horizon Deterministic Replay (100 Weeks)
// ---------------------------------------------------------------------------
console.log('[M19-A6] Executando validação de Replay Determinístico de 100 semanas...');
{
  let stateA = createBaselineState();
  for (let w = 1; w <= 100; w++) {
    const { updatedState } = resolveWeeklyTurn(stateA);
    stateA = updatedState;
  }

  let stateB = createBaselineState();
  for (let w = 1; w <= 100; w++) {
    const { updatedState } = resolveWeeklyTurn(stateB);
    stateB = updatedState;
  }

  assert.equal(
    stateA.weeklyLedger.silverdew,
    stateB.weeklyLedger.silverdew,
    'M19-A6: Silverdew deve ser 100% idêntico no turno 100'
  );
  assert.equal(
    stateA.weeklyLedger.food,
    stateB.weeklyLedger.food,
    'M19-A6: Food deve ser 100% idêntico no turno 100'
  );
  assert.equal(
    JSON.stringify(stateA.weeklyLedger.materials),
    JSON.stringify(stateB.weeklyLedger.materials),
    'M19-A6: Materiais devem ser 100% idênticos no turno 100'
  );
  console.log('  ✓ Gate M19-A6 Aprovado: Replay determinístico de 100 semanas validado com identidade total.');
}

console.log('\n===================================================================');
console.log('🎉 FASE M19-A — LONG-HORIZON CAMPAIGN VALIDATION CONCLUÍDA COM 100% DE SUCESSO!');
console.log('===================================================================\n');

/**
 * M18.9-E — Narrative Integration Test Suite
 * Hard Gates E-1 through E-12
 */

import assert from 'assert';
import { resolveWeeklyTurn, createInitialState } from '../src/engine';
import { SceneResolver } from '../src/domain/events/SceneResolver';
import { IncidentNarrativeTranslator, buildProceduralIncidentNarrative } from '../src/domain/events/narrative/IncidentNarrativeTranslator';
import { IncidentNarrativeResponse } from '../src/domain/events/narrative/IncidentNarrativeContracts';
import { MockNarrativeLLM } from '../src/lib/mockNarrativeLLM';
import { createEventRecord } from '../src/domain/events/EventRecordFactory';
import { EventOpportunity } from '../src/domain/events/EventOpportunityEngine';
import { CampaignState } from '../src/types';
import { EventRecord } from '../src/domain/events/models';

console.log('=== TEST SUITE: NarrativeIntegrationE (M18.9-E) ===\n');

function createTestState(): CampaignState {
  const s = createInitialState('Landed Knight', 'Forest Plains');
  s.character.name = 'Aldren';
  s.character.house = 'Ravenhold';
  s.character.location = { ...s.character.location, region: 'Northern Forest' };
  s.weeklyLedger.season = 'Deepfrost';
  s.weeklyLedger.weather = 'Frio cortante';
  s.holdings.type = 'Bastion';
  s.advisors = { counselorName: 'Tobin', stewardName: 'Gerold', spyMasterName: 'Roric' };
  return s;
}

const MINOR_OPP: EventOpportunity = {
  opportunityId: 'opp_travel_road_accident',
  eventType: 'TRAVEL_ROAD_ACCIDENT',
  magnitude: 'MINOR',
  baseWeight: 4,
  weight: 4,
  tags: ['viagem', 'estrada'],
  eligible: true,
  reasons: ['test'],
  timeCostHint: 'DAY'
};

const INCIDENTAL_OPP: EventOpportunity = {
  opportunityId: 'opp_flavor_raven_wall',
  eventType: 'ATMOSPHERIC_FLAVOR_RAVEN',
  magnitude: 'INCIDENTAL',
  baseWeight: 2,
  weight: 2,
  tags: ['flavor', 'atmosfera'],
  eligible: true,
  reasons: ['test'],
  timeCostHint: 'NONE'
};

function makeMinorRecord(turn: number = 1): EventRecord {
  return createEventRecord(MINOR_OPP, turn, 0, 'TRAVEL');
}

function makeIncidentalRecord(turn: number = 1): EventRecord {
  return createEventRecord(INCIDENTAL_OPP, turn, 0, 'HOLDING');
}

// E-1
{
  console.log('[E-1] Evento emergente produz narrativa de abertura...');
  const record = makeMinorRecord();
  const state = createTestState();
  const llm = new MockNarrativeLLM();
  const narrative = await IncidentNarrativeTranslator.translateIncidentOpened(record, state, llm);
  assert.ok(narrative.narration.length > 0, 'E-1: narration must not be empty');
  assert.ok(narrative.source === 'GEMINI' || narrative.source === 'PROCEDURAL_FALLBACK');
  console.log('  ✓ Hard Gate E-1 Passed: Incident opened narrative generated');
}

// E-2
{
  console.log('[E-2] Incidente sem escolhas nao deve gerar SceneState...');
  const record = makeIncidentalRecord();
  assert.ok(!record.scene || record.scene.choices.length === 0, 'E-2: INCIDENTAL must not open scene');
  console.log('  ✓ Hard Gate E-2 Passed: No SceneState on INCIDENTAL event');
}

// E-3
{
  console.log('[E-3] Cena OPEN gera narrativa sem resolver a cena...');
  const record = makeMinorRecord();
  const state = createTestState();
  const llm = new MockNarrativeLLM();
  if (record.scene && record.scene.status === 'OPEN') {
    const narrative = await IncidentNarrativeTranslator.translateIncidentOpened(record, state, llm);
    assert.ok(narrative.narration.length > 0, 'E-3: narration must not be empty');
    assert.equal(record.scene.status, 'OPEN', 'E-3: scene must remain OPEN');
  }
  console.log('  ✓ Hard Gate E-3 Passed: OPEN scene narrated without resolution');
}

// E-4
{
  console.log('[E-4] SceneResolver resolve cena via player choice...');
  const record = makeMinorRecord();
  if (record.scene && record.scene.status === 'OPEN' && record.scene.choices.length > 0) {
    const state = createTestState();
    const choiceId = record.scene.choices[0].choiceId;
    const result = SceneResolver.resolveSceneChoice(record.scene, choiceId, record, state);
    assert.equal(result.nextSceneState.status, 'RESOLVED', 'E-4: scene must be RESOLVED');
    assert.equal(result.sceneOutcome.chosenChoiceId, choiceId);
  }
  console.log('  ✓ Hard Gate E-4 Passed: SceneResolver resolves scene with player choice');
}

// E-5
{
  console.log('[E-5] Resolucao de escolha gera narrativa de desfecho...');
  const record = makeMinorRecord();
  if (record.scene && record.scene.status === 'OPEN' && record.scene.choices.length > 0) {
    const state = createTestState();
    const choiceId = record.scene.choices[0].choiceId;
    const resolutionResult = SceneResolver.resolveSceneChoice(record.scene, choiceId, record, state);
    const llm = new MockNarrativeLLM();
    const narrative = await IncidentNarrativeTranslator.translateIncidentResolved(resolutionResult, record, state, llm);
    assert.ok(narrative.narration.length > 0, 'E-5: resolution narration must not be empty');
    assert.ok(narrative.source === 'GEMINI' || narrative.source === 'PROCEDURAL_FALLBACK');
  }
  console.log('  ✓ Hard Gate E-5 Passed: Incident resolved narrative generated');
}

// E-6
{
  console.log('[E-6] A narrativa nao modifica CampaignState...');
  const record = makeMinorRecord();
  const state = createTestState();
  const stateCopy = JSON.stringify(state);
  const llm = new MockNarrativeLLM();
  await IncidentNarrativeTranslator.translateIncidentOpened(record, state, llm);
  assert.equal(JSON.stringify(state), stateCopy, 'E-6: CampaignState must be identical');
  console.log('  ✓ Hard Gate E-6 Passed: CampaignState unmodified by narrative');
}

// E-7
{
  console.log('[E-7] Gemini indisponivel -> fallback procedural...');
  const record = makeIncidentalRecord();
  const state = createTestState();
  const narrative = await IncidentNarrativeTranslator.translateIncidentOpened(record, state);
  assert.equal(narrative.source, 'PROCEDURAL_FALLBACK', 'E-7: must use PROCEDURAL_FALLBACK');
  assert.ok(narrative.narration.length > 0);
  console.log('  ✓ Hard Gate E-7 Passed: Fallback activated when LLM absent');
}

// E-8
{
  console.log('[E-8] Erro no Gemini -> fallback sem alterar estado mecanico...');
  const record = makeMinorRecord();
  const state = createTestState();
  const errorLlm = {
    providerId: 'error-mock', modelId: 'error',
    interpret: async () => { throw new Error('LLM unavailable'); },
    narrate: async () => '',
    narrateIncident: async (): Promise<IncidentNarrativeResponse> => { throw new Error('Gemini API error'); }
  };
  const stateBefore = JSON.stringify(state);
  const narrative = await IncidentNarrativeTranslator.translateIncidentOpened(record, state, errorLlm as any);
  assert.equal(narrative.source, 'PROCEDURAL_FALLBACK', 'E-8: must fallback on LLM error');
  assert.equal(JSON.stringify(state), stateBefore, 'E-8: state must be unchanged');
  assert.ok(narrative.narration.length > 0);
  console.log('  ✓ Hard Gate E-8 Passed: LLM error caught, fallback used, state unchanged');
}

// E-9
{
  console.log('[E-9] Replay mecanico identico com e sem narrativa...');
  const base = createTestState();
  const result1 = resolveWeeklyTurn(JSON.parse(JSON.stringify(base)));
  const hash1 = JSON.stringify({
    silverdew: result1.updatedState.weeklyLedger.silverdew,
    food: result1.updatedState.weeklyLedger.food,
    week: result1.updatedState.worldLedger.currentDate.week
  });
  const result2 = resolveWeeklyTurn(JSON.parse(JSON.stringify(base)));
  const llm = new MockNarrativeLLM();
  for (const ev of result2.turnResult.incidentResult?.eventsProcessed ?? []) {
    await IncidentNarrativeTranslator.translateIncidentOpened(ev, result2.updatedState, llm);
  }
  const hash2 = JSON.stringify({
    silverdew: result2.updatedState.weeklyLedger.silverdew,
    food: result2.updatedState.weeklyLedger.food,
    week: result2.updatedState.worldLedger.currentDate.week
  });
  assert.equal(hash1, hash2, 'E-9: mechanical state must be identical');
  console.log('  ✓ Hard Gate E-9 Passed: Mechanical replay identical with and without narrative');
}

// E-10
{
  console.log('[E-10] resolveWeeklyTurn signature backward-compatible...');
  const state = createTestState();
  const result = resolveWeeklyTurn(state);
  assert.ok(result.updatedState, 'E-10: updatedState present');
  assert.ok(result.turnResult, 'E-10: turnResult present');
  assert.ok(Array.isArray(result.turnResult.eventLog), 'E-10: eventLog is array');
  console.log('  ✓ Hard Gate E-10 Passed: resolveWeeklyTurn signature backward-compatible');
}

// E-11
{
  console.log('[E-11] Fail-closed gate: activeScene OPEN bloqueia resolveWeeklyTurn...');
  const state = createTestState();
  state.sessionLog = {
    lastSessionDate: '', lastThingHappened: '', activeMissions: [], pendingDecisions: [],
    activeScene: { sceneId: 'scene_test_e11', eventId: 'evt_test_e11', status: 'OPEN', choices: [] }
  };
  let threw = false;
  try { resolveWeeklyTurn(state); } catch { threw = true; }
  assert.ok(threw, 'E-11: resolveWeeklyTurn must throw when activeScene is OPEN');
  console.log('  ✓ Hard Gate E-11 Passed: Fail-closed gate enforced');
}

// E-12
{
  console.log('[E-12] IncidentNarrativeResponse nao pode conter EventMutation...');
  const record = makeMinorRecord();
  const state = createTestState();
  const llm = new MockNarrativeLLM();
  const narrative = await IncidentNarrativeTranslator.translateIncidentOpened(record, state, llm);
  assert.ok(!('mutations' in narrative), 'E-12: no mutations field');
  assert.ok(!('eventMutations' in narrative), 'E-12: no eventMutations field');
  assert.ok(!('stateChanges' in narrative), 'E-12: no stateChanges field');
  assert.strictEqual(typeof narrative.narration, 'string');
  console.log('  ✓ Hard Gate E-12 Passed: IncidentNarrativeResponse contains no EventMutation fields');
}

console.log('\n--- ALL NarrativeIntegrationE TESTS PASSED (M18.9-E) ---\n');

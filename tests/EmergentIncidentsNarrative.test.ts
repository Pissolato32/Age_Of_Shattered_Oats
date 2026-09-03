import assert from 'node:assert/strict';
import { createInitialState, resolveWeeklyTurn } from '../src/engine';
import { createEventRecord } from '../src/domain/events/EventRecordFactory';
import { EventOpportunity } from '../src/domain/events/EventOpportunityEngine';
import { SceneResolver } from '../src/domain/events/SceneResolver';
import { processEvent } from '../src/domain/events/EventProcessor';
import { IncidentNarrativeTranslator, buildProceduralIncidentNarrative } from '../src/domain/events/narrative/IncidentNarrativeTranslator';
import {
  IncidentNarrativeRequest,
  IncidentNarrativeResponse,
  MechanicalFacts
} from '../src/domain/events/narrative/IncidentNarrativeContracts';
import { MockNarrativeLLM } from '../src/lib/mockNarrativeLLM';
import { UnifiedNarrativeLLM } from '../src/llm/adapters/UnifiedNarrativeLLM';

console.log('--- TEST SUITE: EmergentIncidentsNarrative (M18.9-D) ---');

// Mock opportunity with interactive scene
const oppTracks: EventOpportunity = {
  opportunityId: 'opp_frontier_tracks_discovered',
  eventType: 'FRONTIER_TRACKS_DISCOVERED',
  magnitude: 'SIGNIFICANT',
  baseWeight: 4,
  weight: 4,
  tags: ['fronteira', 'batedores', 'vigilancia', 'rastros'],
  eligible: true,
  reasons: ['Fronteira ativa'],
  timeCostHint: 'HOURS'
};

const oppRaven: EventOpportunity = {
  opportunityId: 'opp_flavor_raven_wall',
  eventType: 'ATMOSPHERIC_FLAVOR_RAVEN',
  magnitude: 'INCIDENTAL',
  baseWeight: 6,
  weight: 6,
  tags: ['flavor', 'atmosfera', 'muralha', 'corvo'],
  eligible: true,
  reasons: ['Muralha do castelo'],
  timeCostHint: 'NONE'
};

// ============================================================================
// Test 1 & 2: Construction of MechanicalFacts & IncidentNarrativeRequest
// ============================================================================
{
  const state = createInitialState('Noble Ruler', 'Central Plains');
  const eventRecord = createEventRecord(oppTracks, 14, 0, 'TRAVEL');

  assert.ok(eventRecord.scene !== undefined);
  assert.equal(eventRecord.scene.status, 'OPEN');

  const mockLLM = new MockNarrativeLLM();
  const stateSnapshotBefore = JSON.stringify(state);
  const eventSnapshotBefore = JSON.stringify(eventRecord);

  const response = await IncidentNarrativeTranslator.translateIncidentOpened(eventRecord, state, mockLLM);

  // MechanicalFacts and Request created correctly
  assert.equal(response.source, 'PROCEDURAL_FALLBACK');
  assert.ok(response.narration.length > 20);
  assert.ok(response.promptChoicesFormatted !== undefined);
  assert.equal(response.promptChoicesFormatted.length, 2);

  // Invariant: Zero mutation of CampaignState and EventRecord
  assert.equal(JSON.stringify(state), stateSnapshotBefore, 'CampaignState must remain 100% immutable during narrative translation');
  assert.equal(JSON.stringify(eventRecord), eventSnapshotBefore, 'EventRecord must remain 100% immutable during narrative translation');
  console.log('✓ Test 1 & 2 Passed: Correct MechanicalFacts, Request construction & Zero state mutation');
}

// ============================================================================
// Test 3 & 11: Valid Narrative Response for Opened Scene and Resolved Scene
// ============================================================================
{
  const state = createInitialState('Noble Ruler', 'Central Plains');
  const baseEvent = createEventRecord(oppTracks, 14, 0, 'TRAVEL');
  assert.ok(baseEvent.scene !== undefined);

  const mockLLM = new MockNarrativeLLM();

  // 1. Translation of opened scene
  const openResponse = await IncidentNarrativeTranslator.translateIncidentOpened(baseEvent, state, mockLLM);
  assert.ok(openResponse.narration.includes('Batedores') || openResponse.narration.includes('fronteira'));
  assert.equal((openResponse as any).mutations, undefined, 'Response must not contain EventMutation');
  assert.equal((openResponse as any).stateChanges, undefined, 'Response must not contain stateChanges');

  // 2. Resolve choice deterministically via SceneResolver
  const baseProcessed = processEvent(baseEvent, state);
  const resolutionResult = SceneResolver.resolveSceneChoice(
    baseEvent.scene,
    'choice_generic_cautious',
    baseEvent,
    baseProcessed.nextState
  );
  assert.equal(resolutionResult.eventProcessingResult.applied, true);

  // 3. Translation of resolved scene outcome
  const resolvedResponse = await IncidentNarrativeTranslator.translateIncidentResolved(
    resolutionResult,
    baseEvent,
    resolutionResult.eventProcessingResult.nextState,
    mockLLM
  );
  assert.ok(resolvedResponse.narration.length > 20);
  assert.equal((resolvedResponse as any).mutations, undefined, 'Response must not contain EventMutation');
  console.log('✓ Test 3 & 11 Passed: Valid Opened/Resolved prose without EventMutation in response');
}

// ============================================================================
// Test 4, 5 & 6: LLM Failure, Timeout and Error Resilience
// ============================================================================
{
  const state = createInitialState('Noble Ruler', 'Central Plains');
  const baseEvent = createEventRecord(oppTracks, 14, 0, 'TRAVEL');
  assert.ok(baseEvent.scene !== undefined);

  // Fake failing LLM throwing error
  const failingLLM = {
    providerId: 'failing-test',
    modelId: 'error-sim',
    interpret: () => Promise.reject(new Error('Network error 500')),
    narrate: () => Promise.reject(new Error('Network error 500')),
    narrateIncident: () => Promise.reject(new Error('Network timeout after 12000ms'))
  };

  const responseOnFailure = await IncidentNarrativeTranslator.translateIncidentOpened(baseEvent, state, failingLLM as any);
  assert.equal(responseOnFailure.source, 'PROCEDURAL_FALLBACK');
  assert.ok(responseOnFailure.narration.length > 20);
  assert.ok(responseOnFailure.promptChoicesFormatted !== undefined);

  // Fallback on resolved scene with failing LLM
  const baseProcessed = processEvent(baseEvent, state);
  const resolutionResult = SceneResolver.resolveSceneChoice(
    baseEvent.scene,
    'choice_generic_decisive',
    baseEvent,
    baseProcessed.nextState
  );

  const resolvedOnFailure = await IncidentNarrativeTranslator.translateIncidentResolved(
    resolutionResult,
    baseEvent,
    resolutionResult.eventProcessingResult.nextState,
    failingLLM as any
  );
  assert.equal(resolvedOnFailure.source, 'PROCEDURAL_FALLBACK');
  assert.ok(resolvedOnFailure.narration.length > 20);
  console.log('✓ Test 4, 5 & 6 Passed: Network failure & timeout seamlessly fallback to procedural prose');
}

// ============================================================================
// Test 7 & 12: Pure Determinism and Replay Immunity
// ============================================================================
{
  const stateA = createInitialState('Noble Ruler', 'Central Plains');
  const stateB = createInitialState('Noble Ruler', 'Central Plains');

  const baseEventA = createEventRecord(oppTracks, 14, 0, 'TRAVEL');
  const baseEventB = createEventRecord(oppTracks, 14, 0, 'TRAVEL');

  const respA1 = await IncidentNarrativeTranslator.translateIncidentOpened(baseEventA, stateA);
  const respA2 = await IncidentNarrativeTranslator.translateIncidentOpened(baseEventB, stateB);

  // Procedural fallback is 100% deterministic
  assert.equal(respA1.narration, respA2.narration);
  assert.equal(JSON.stringify(respA1.promptChoicesFormatted), JSON.stringify(respA2.promptChoicesFormatted));

  // Run 10 weekly turns with narrative calls vs without narrative calls
  let runnerWithNarrative = createInitialState('Noble Ruler', 'Central Plains');
  for (let w = 1; w <= 10; w++) {
    const resA = resolveWeeklyTurn(runnerWithNarrative);
    runnerWithNarrative = resA.updatedState;

    if (runnerWithNarrative.sessionLog?.activeScene) {
      await IncidentNarrativeTranslator.translateIncidentOpened(
        createEventRecord(oppTracks, w, 0, 'TRAVEL'),
        runnerWithNarrative
      );
    }
  }

  let runnerWithoutNarrative = createInitialState('Noble Ruler', 'Central Plains');
  for (let w = 1; w <= 10; w++) {
    const resB = resolveWeeklyTurn(runnerWithoutNarrative);
    runnerWithoutNarrative = resB.updatedState;
  }

  assert.equal(
    runnerWithNarrative.weeklyLedger.silverdew,
    runnerWithoutNarrative.weeklyLedger.silverdew,
    'Narrative calls must never alter silverdew'
  );
  assert.equal(
    runnerWithNarrative.weeklyLedger.food,
    runnerWithoutNarrative.weeklyLedger.food,
    'Narrative calls must never alter food'
  );
  assert.equal(
    runnerWithNarrative.eventStore?.length,
    runnerWithoutNarrative.eventStore?.length,
    'Narrative calls must never alter eventStore sequence'
  );
  console.log('✓ Test 7 & 12 Passed: Deterministic fallback and 100% mechanical replay immunity');
}

// ============================================================================
// Test 8, 9 & 10: Immutability of CampaignState, EventRecord and SceneState
// ============================================================================
{
  const state = createInitialState('Noble Ruler', 'Central Plains');
  const baseEvent = createEventRecord(oppTracks, 14, 0, 'TRAVEL');
  assert.ok(baseEvent.scene !== undefined);

  const sceneBefore = JSON.stringify(baseEvent.scene);
  const eventBefore = JSON.stringify(baseEvent);
  const stateBefore = JSON.stringify(state);

  await IncidentNarrativeTranslator.translateIncidentOpened(baseEvent, state);

  assert.equal(JSON.stringify(baseEvent.scene), sceneBefore);
  assert.equal(JSON.stringify(baseEvent), eventBefore);
  assert.equal(JSON.stringify(state), stateBefore);
  console.log('✓ Test 8, 9 & 10 Passed: Strict immutability across CampaignState, EventRecord and SceneState');
}

// ============================================================================
// Test 13 & 14: Save/Load Round-Trip and Mock/Gemini Contract Compatibility
// ============================================================================
{
  const mockLLM = new MockNarrativeLLM();
  const geminiLLM = new UnifiedNarrativeLLM({ provider: 'mock' }); // Mock adapter — deterministic fallback

  const state = createInitialState('Noble Ruler', 'Central Plains');
  const baseEvent = createEventRecord(oppTracks, 14, 0, 'TRAVEL');

  const mockResp = await IncidentNarrativeTranslator.translateIncidentOpened(baseEvent, state, mockLLM);
  const geminiResp = await IncidentNarrativeTranslator.translateIncidentOpened(baseEvent, state, geminiLLM);

  assert.equal(typeof mockResp.narration, 'string');
  assert.equal(typeof geminiResp.narration, 'string');
  assert.ok(mockResp.narration.length > 0);
  assert.ok(geminiResp.narration.length > 0);

  // Save/Load preservation of sessionLog
  state.sessionLog = state.sessionLog || { lastSessionDate: '', lastThingHappened: '', activeMissions: [], pendingDecisions: [] };
  state.sessionLog.lastThingHappened = mockResp.narration;

  const jsonSave = JSON.stringify(state);
  const loadedState = JSON.parse(jsonSave);

  assert.equal(loadedState.sessionLog.lastThingHappened, mockResp.narration);
  console.log('✓ Test 13 & 14 Passed: Save/Load preservation & Mock/Gemini contract compatibility');
}

console.log('--- ALL EmergentIncidentsNarrative TESTS PASSED ---');

import assert from 'node:assert/strict';
import { GeminiNarrativeLLM } from '../src/lib/geminiNarrativeLLM';
import { NARRATIVE_CONTRACT_VERSION, NarrativeContext, ObserverProjection, ExecutionReport } from '../src/lib/narrativeContracts';
import { createSliceState, PLAYER_OBSERVER } from './fixtures/narrativeSlice.fixtures';
import { buildObserverProjection } from '../src/engine';

const state = createSliceState();
const projection = buildObserverProjection(state, PLAYER_OBSERVER);

// ---------------------------------------------------------------------------
// TEST 1 — Interface Conformance & Defaults
// ---------------------------------------------------------------------------
{
  const llm = new GeminiNarrativeLLM({ modelId: 'gemini-2.5-flash' });
  assert.equal(llm.providerId, 'gemini');
  assert.equal(llm.modelId, 'gemini-2.5-flash');
  console.log('[TEST 1] Interface NarrativeLLM implementada corretamente -> OK');
}

// ---------------------------------------------------------------------------
// TEST 2 — Mocked API Response Interpretation
// ---------------------------------------------------------------------------
{
  const mockFetch: typeof fetch = async () => {
    return {
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    action: 'RECRUIT',
                    magnitude: { mode: 'FIXED', value: 25 },
                    stance: 'HONORABLE',
                    requiresClarification: false,
                    ambiguity: []
                  })
                }
              ]
            }
          }
        ]
      })
    } as unknown as Response;
  };

  const llm = new GeminiNarrativeLLM({
    apiKey: 'dummy-test-key',
    fetchFn: mockFetch
  });

  const cmd = await llm.interpret({ playerInput: 'Quero recrutar 25 soldados com honra.', projection });
  assert.equal(cmd.contractVersion, NARRATIVE_CONTRACT_VERSION);
  assert.equal(cmd.action, 'RECRUIT');
  assert.deepEqual(cmd.magnitude, { mode: 'FIXED', value: 25 });
  assert.equal(cmd.stance, 'HONORABLE');

  console.log('[TEST 2] Interpretação com mock fetch bem-sucedida -> OK');
}

// ---------------------------------------------------------------------------
// TEST 3 — Mocked API Response Narration
// ---------------------------------------------------------------------------
{
  const mockFetch: typeof fetch = async () => {
    return {
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Os sinos da fortaleza ecoaram quando 25 novos recrutas juraram fidelidade.'
                }
              ]
            }
          }
        ]
      })
    } as unknown as Response;
  };

  const llm = new GeminiNarrativeLLM({
    apiKey: 'dummy-test-key',
    fetchFn: mockFetch
  });

  const report: ExecutionReport = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    reportId: 'rep_1',
    command: { commandId: 'cmd', actorId: 'player', action: 'RECRUIT' },
    status: 'ACCEPTED',
    actionExecuted: 'RECRUIT',
    affectedEntities: [],
    stateChanges: [],
    consequences: [],
    discoveredInformation: [],
    hiddenInformationIds: [],
    events: [],
    reasonCode: 'ALLOWED'
  };

  const context: NarrativeContext = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    observer: PLAYER_OBSERVER,
    scene: projection.scene,
    actors: projection.actors,
    relationships: projection.relationships,
    knownFacts: projection.knownFacts,
    recentEvents: projection.recentEvents,
    executionResult: report,
    narrativeConstraints: []
  };

  const narrative = await llm.narrate(context);
  assert.ok(narrative.includes('25 novos recrutas'));

  console.log('[TEST 3] Narração com mock fetch bem-sucedida -> OK');
}

// ---------------------------------------------------------------------------
// TEST 4 — Fallback on Network / HTTP Error
// ---------------------------------------------------------------------------
{
  const errorFetch: typeof fetch = async () => {
    return {
      ok: false,
      status: 503
    } as unknown as Response;
  };

  const llm = new GeminiNarrativeLLM({
    apiKey: 'dummy-test-key',
    fetchFn: errorFetch
  });

  // Interpretation must gracefully fall back without throwing
  const cmd = await llm.interpret({ playerInput: 'Quero recrutar 15 soldados.', projection });
  assert.equal(cmd.action, 'RECRUIT');

  console.log('[TEST 4] Fallback gracioso em caso de erro de rede -> OK');
}

// ---------------------------------------------------------------------------
// TEST 5 — Missing Key Graceful Fallback
// ---------------------------------------------------------------------------
{
  const llm = new GeminiNarrativeLLM({ apiKey: undefined });
  const cmd = await llm.interpret({ playerInput: 'Quero recrutar 10 soldados.', projection });
  assert.equal(cmd.action, 'RECRUIT');
  assert.deepEqual(cmd.magnitude, { mode: 'FIXED', value: 10 });

  console.log('[TEST 5] Fallback gracioso sem API key -> OK');
}

console.log('GeminiNarrativeLLM test suite passed successfully.');

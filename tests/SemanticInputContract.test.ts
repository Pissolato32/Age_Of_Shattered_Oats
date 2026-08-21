import assert from 'node:assert/strict';
import { MockNarrativeLLM } from '../src/lib/mockNarrativeLLM';
import { buildObserverProjection } from '../src/engine';
import { createSliceState, PLAYER_OBSERVER } from './fixtures/narrativeSlice.fixtures';
import { NARRATIVE_CONTRACT_VERSION } from '../src/lib/narrativeContracts';

const mock = new MockNarrativeLLM();
const state = createSliceState();
const projection = buildObserverProjection(state, PLAYER_OBSERVER);

// ---------------------------------------------------------------------------
// TEST 1 — Structured Contract Guarantee
// ---------------------------------------------------------------------------
{
  const cmd = await mock.interpret({ playerInput: 'Quero recrutar 30 soldados.', projection });

  assert.equal(cmd.contractVersion, NARRATIVE_CONTRACT_VERSION);
  assert.equal(cmd.actorId, 'player');
  assert.equal(cmd.action, 'RECRUIT');
  assert.deepEqual(cmd.magnitude, { mode: 'FIXED', value: 30 });
  assert.equal(typeof cmd.confidence, 'number');
  assert.ok(Array.isArray(cmd.ambiguity));
  assert.equal(cmd.requiresClarification, false);

  // Interpreter MUST NOT emit mechanical execution properties
  assert.equal('decision' in cmd, false);
  assert.equal('delta' in cmd, false);
  assert.equal('stateChanges' in cmd, false);
  assert.equal('consequences' in cmd, false);

  console.log('[TEST 1] Contrato estruturado sem vazamento mecânico -> OK');
}

// ---------------------------------------------------------------------------
// TEST 2 — Stance Extraction (Honor, Aggression, Caution, Diplomacy)
// ---------------------------------------------------------------------------
{
  const agg = await mock.interpret({ playerInput: 'Ameaçar os camponeses e recrutar à força.', projection });
  assert.equal(agg.stance, 'AGGRESSIVE');

  const caut = await mock.interpret({ playerInput: 'Viajar cautelosamente para Central Plains.', projection });
  assert.equal(caut.stance, 'CAUTIOUS');

  const diplo = await mock.interpret({ playerInput: 'Negociar acordo diplomático com os vizinhos.', projection });
  assert.equal(diplo.stance, 'DIPLOMATIC');

  const hon = await mock.interpret({ playerInput: 'Recrutar com honra e lealdade.', projection });
  assert.equal(hon.stance, 'HONORABLE');

  console.log('[TEST 2] Extração de Stance semântico (AGGRESSIVE, CAUTIOUS, DIPLOMATIC, HONORABLE) -> OK');
}

// ---------------------------------------------------------------------------
// TEST 3 — Ambiguous Target / Missing Entity Handling
// ---------------------------------------------------------------------------
{
  // Fala sem alvo especificado
  const speakNoTarget = await mock.interpret({ playerInput: 'Quero falar com ele agora.', projection });
  assert.equal(speakNoTarget.requiresClarification, true);
  assert.ok(speakNoTarget.ambiguity.length > 0);

  // Construção sem estrutura especificada
  const buildNoStructure = await mock.interpret({ playerInput: 'Quero construir algo no pátio.', projection });
  assert.equal(buildNoStructure.requiresClarification, true);
  assert.ok(buildNoStructure.ambiguity.length > 0);

  // Viagem sem destino
  const travelNoDest = await mock.interpret({ playerInput: 'Quero marchar com as tropas.', projection });
  assert.equal(travelNoDest.requiresClarification, true);

  console.log('[TEST 3] Ambiguidade e alvos ausentes exigem esclarecimento -> OK');
}

// ---------------------------------------------------------------------------
// TEST 4 — Impossible Actions
// ---------------------------------------------------------------------------
{
  const killKing = await mock.interpret({ playerInput: 'Eu mato o rei instantaneamente.', projection });
  assert.equal(killKing.action, 'UNKNOWN');
  assert.equal(killKing.requiresClarification, false);

  console.log('[TEST 4] Ações impossíveis geram ação não-canônica UNKNOWN -> OK');
}

// ---------------------------------------------------------------------------
// TEST 5 — Determinism of Interpretation
// ---------------------------------------------------------------------------
{
  const input = { playerInput: 'Quero comprar madeira no mercado.', projection };
  const res1 = await mock.interpret(input);
  const res2 = await mock.interpret(input);

  assert.deepEqual(res1, res2, 'Interpretações da mesma entrada devem ser estritamente idênticas');

  console.log('[TEST 5] Determinismo estrito do interpretador -> OK');
}

console.log('SemanticInputContract test suite passed successfully.');

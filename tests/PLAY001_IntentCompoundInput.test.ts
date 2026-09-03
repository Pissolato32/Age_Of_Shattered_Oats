import assert from 'node:assert/strict';
import { MockNarrativeLLM } from '../src/lib/mockNarrativeLLM';
import { interpretIntentHeuristically } from '../src/lib/intentHeuristics';
import { buildObserverProjection } from '../src/engine';
import { createSliceState, PLAYER_OBSERVER } from './fixtures/narrativeSlice.fixtures';

const mock = new MockNarrativeLLM();
const state = createSliceState();
const projection = buildObserverProjection(state, PLAYER_OBSERVER);

// ---------------------------------------------------------------------------
// TEST A — "Qual a situação do acampamento?" → consulta situacional, sem ação fictícia
// ---------------------------------------------------------------------------
{
  const cmd = await mock.interpret({ playerInput: 'Qual a situação do acampamento?', projection });
  assert.equal(cmd.action, 'INFORMATION', 'Ação deve ser INFORMATION para consulta situacional');
  assert.equal(cmd.requiresClarification, false, 'Não deve pedir esclarecimento');
  console.log('[TEST A] Consulta situacional "Qual a situação do acampamento?" -> INFORMATION OK');
}

// ---------------------------------------------------------------------------
// TEST B — "Temos acampamento montado?" → consulta situacional
// ---------------------------------------------------------------------------
{
  const cmd = await mock.interpret({ playerInput: 'Temos acampamento montado?', projection });
  assert.equal(cmd.action, 'INFORMATION', 'Ação deve ser INFORMATION para consulta situacional');
  console.log('[TEST B] Consulta situacional "Temos acampamento montado?" -> INFORMATION OK');
}

// ---------------------------------------------------------------------------
// TEST C — "Garantir um local para meus homens." → não inferir RECRUIT apenas por "homens"
// ---------------------------------------------------------------------------
{
  const cmd = interpretIntentHeuristically('Garantir um local para meus homens.');
  assert.notEqual(cmd.action, 'RECRUIT', 'Não deve inferir RECRUIT apenas por substantivo "homens"');
  console.log('[TEST C] "Garantir um local para meus homens." -> NÃO RECRUIT OK');
}

// ---------------------------------------------------------------------------
// TEST D — Entrada composta: ação + pergunta contextual
// ---------------------------------------------------------------------------
{
  // Via heurística: sem verbo reconhecido, deve cair em UNKNOWN (não inventa ação)
  const cmdH = interpretIntentHeuristically(
    'Garantir um local para meus 60 homens e estabelecer um pequeno acampamento. Onde estamos?'
  );
  // O parser heurístico não reconhece "garantir"/"estabelecer" como verbos de ação.
  // O resultado deve ser UNKNOWN ou INFORMATION, NUNCA uma ação inventada.
  assert.ok(
    cmdH.action === 'UNKNOWN' || cmdH.action === 'INFORMATION',
    `Ação deve ser UNKNOWN ou INFORMATION, não ${cmdH.action}`
  );

  // Via MockNarrativeLLM (usa interpretIntentHeuristically internamente)
  const cmdM = await mock.interpret({
    playerInput: 'Garantir um local para meus 60 homens e estabelecer um pequeno acampamento. Onde estamos?',
    projection
  });
  assert.ok(
    cmdM.action === 'UNKNOWN' || cmdM.action === 'INFORMATION',
    `MockNarrativeLLM: ação deve ser UNKNOWN ou INFORMATION, não ${cmdM.action}`
  );
  console.log('[TEST D] Entrada composta (ação + pergunta) -> sem invenção mecânica OK');
}

// ---------------------------------------------------------------------------
// TEST E — "Recrutar 20 homens." → continuar reconhecendo RECRUIT corretamente
// ---------------------------------------------------------------------------
{
  const cmd = await mock.interpret({ playerInput: 'Recrutar 20 homens.', projection });
  assert.equal(cmd.action, 'RECRUIT', 'Ação deve ser RECRUIT');
  assert.deepEqual(cmd.magnitude, { mode: 'FIXED', value: 20 }, 'Magnitude deve ser FIXED 20');
  console.log('[TEST E] "Recrutar 20 homens." -> RECRUIT com magnitude 20 OK');
}

// ---------------------------------------------------------------------------
// TEST F — Ação inexistente sugerida pela LLM deve continuar sendo rejeitada
// ---------------------------------------------------------------------------
{
  // Simula o que acontece quando a LLM retorna uma ação não modelada
  const cmd = interpretIntentHeuristically('Estabelecer acampamento na planície.');
  // O parser heurístico não reconhece "estabelecer" como verbo → UNKNOWN
  // Se por acaso reconhecesse, a Engine rejeitaria como UNKNOWN_MECHANIC
  assert.ok(
    cmd.action !== 'BUILD' && cmd.action !== 'RECRUIT' && cmd.action !== 'TRAVEL',
    `Ação "${cmd.action}" não deve ser uma capacidade mecânica para entrada não modelada`
  );
  console.log('[TEST F] Ação inexistente "estabelecer acampamento" -> não aceita como mecânica OK');
}

// ---------------------------------------------------------------------------
// TEST BONUS — F1: "Recrutar 20 homens. Onde estamos?" preserva RECRUIT
// ---------------------------------------------------------------------------
{
  const cmd = interpretIntentHeuristically('Recrutar 20 homens. Onde estamos?');
  assert.equal(cmd.action, 'RECRUIT', 'F1: ação composta com pergunta deve preservar RECRUIT');
  assert.deepEqual(cmd.magnitude, { mode: 'FIXED', value: 20 }, 'F1: magnitude preservada');
  console.log('[TEST BONUS F1] "Recrutar 20 homens. Onde estamos?" -> RECRUIT preservado OK');
}

console.log('\n[PLAY-001] Todos os testes de regressão A-F + F1 passaram.');

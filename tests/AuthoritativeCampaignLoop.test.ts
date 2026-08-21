import assert from 'node:assert/strict';
import { runNarrativeCycle } from '../src/lib/narrativeCycle';
import { MockNarrativeLLM } from '../src/lib/mockNarrativeLLM';
import { RandomService } from '../src/core/RandomService';
import { CampaignState } from '../src/types';
import { createInitialState } from '../src/engine';
import { NarrativeObserver } from '../src/lib/narrativeContracts';

const PLAYER_OBSERVER: NarrativeObserver = {
  kind: 'PLAYER',
  observerId: 'player'
};

function createFreshState(): CampaignState {
  const s = createInitialState('Noble Ruler', 'Central Plains');
  s.weeklyLedger.silverdew = 10000;
  s.holdings.laborPool = 5000;
  return s;
}

console.log('=== INICIANDO TESTE END-TO-END DO LOOP NARRATIVO INTERATIVO (1000 CICLOS) ===');

const mockLLM = new MockNarrativeLLM();
const rng = new RandomService(998877);

const ACTION_PROMPTS = [
  'Quero recrutar 10 soldados.',
  'Quero recrutar soldados.',
  'Construir palisada de madeira.',
  'Quanto custa o recrutamento?',
  'Viajar para Central Plains.',
  'Comprar madeira no mercado.',
  'Ameaçar o senhor local rebelde.',
  'Quero falar com ele.', // Ambíguo
  'Eu mato o rei instantaneamente.' // Impossível
];

let currentState = createFreshState();
const snapshots: string[] = [];

for (let i = 0; i < 1000; i++) {
  const prompt = ACTION_PROMPTS[i % ACTION_PROMPTS.length];
  const preMutationSilverdew = currentState.weeklyLedger.silverdew;
  const preMutationLevies = currentState.army.units.find(u => u.type === 'Levy')?.size ?? 0;

  const cycleResult = await runNarrativeCycle({
    playerInput: prompt,
    state: currentState,
    observer: PLAYER_OBSERVER,
    llm: mockLLM,
    rng
  });

  // 1. Semantic validation check (0 violations allowed)
  assert.equal(
    cycleResult.validation.length,
    0,
    `Violação semântica detectada no ciclo ${i} (${prompt}): ${JSON.stringify(cycleResult.validation)}`
  );

  // 2. Engine authority check: If REJECTED, state must NOT be mutated
  if (cycleResult.report.status === 'REJECTED') {
    assert.equal(
      cycleResult.resultState.weeklyLedger.silverdew,
      preMutationSilverdew,
      `Mutação indevida de tesouro no ciclo ${i} em ação rejeitada`
    );
  }

  // 3. Information leakage check
  const serializedProjection = JSON.stringify(cycleResult.projection);
  assert.ok(!serializedProjection.includes('conspira secretamente'));
  assert.ok(!serializedProjection.includes('"rng"'));
  assert.ok(!serializedProjection.includes('"formula"'));

  currentState = cycleResult.resultState;

  if (i % 100 === 0) {
    snapshots.push(JSON.stringify(currentState));
  }
}

console.log('✅ 1000 ciclos determinísticos executados com sucesso com 0 violações semânticas!');

// Replay verification of the 1000 cycles with the same seed
console.log('=== VERIFICANDO REPRODUCIBILIDADE E DETERMINISMO DO LOOP INTERATIVO ===');

const replayRng = new RandomService(998877);
let replayState = createFreshState();

for (let i = 0; i < 1000; i++) {
  const prompt = ACTION_PROMPTS[i % ACTION_PROMPTS.length];

  const cycleResult = await runNarrativeCycle({
    playerInput: prompt,
    state: replayState,
    observer: PLAYER_OBSERVER,
    llm: mockLLM,
    rng: replayRng
  });

  replayState = cycleResult.resultState;

  if (i % 100 === 0) {
    const expectedSnapshot = snapshots[i / 100];
    const currentSnapshot = JSON.stringify(replayState);
    assert.equal(
      currentSnapshot,
      expectedSnapshot,
      `Divergência determinística de replay no ponto de checagem do ciclo ${i}!`
    );
  }
}

console.log('✅ REPLAY DETERMINÍSTICO DE 1000 CICLOS VALIDADO COM SUCESSO (10/10 SNAPSHOTS IDÊNTICOS)!');
console.log('AuthoritativeCampaignLoop test suite passed successfully.');

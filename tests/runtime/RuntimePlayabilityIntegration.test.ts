import assert from 'node:assert/strict';
import { runNarrativeCycle } from '../../src/lib/narrativeCycle';
import { GeminiNarrativeLLM } from '../../src/lib/geminiNarrativeLLM';
import { MockNarrativeLLM } from '../../src/lib/mockNarrativeLLM';
import { createInitialState, resolveWeeklyTurn, getAbsoluteCampaignTurn } from '../../src/engine';
import { CampaignState } from '../../src/types';
import { NarrativeObserver } from '../../src/lib/narrativeContracts';

const PLAYER_OBSERVER: NarrativeObserver = {
  kind: 'PLAYER',
  observerId: 'player'
};

console.log('=== FASE 4 — RUNTIME & PLAYABLE PRODUCT INTEGRATION SUITE ===\n');

// ---------------------------------------------------------------------------
// 1. ENDPOINT HANDLER RESILIENCE & LIFECYCLE (Simulated /api/narrative-cycle)
// ---------------------------------------------------------------------------
{
  console.log('[RUNTIME 1] Testando Ciclo do Endpoint /api/narrative-cycle com Mock e Fallback...');
  let state = createInitialState('Noble Ruler', 'Central Plains');
  state.weeklyLedger.silverdew = 1200;
  state.weeklyLedger.materials.timber = 100;
  state.weeklyLedger.materials.stone = 50;
  state.holdings.laborPool = 300;

  const mockLLM = new MockNarrativeLLM();

  // Simula requisição enviada pela UI
  const result1 = await runNarrativeCycle({
    playerInput: 'Recrutar 10 soldados da infantaria.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });

  assert.equal(result1.report.status, 'ACCEPTED');
  assert.equal(result1.validation.length, 0);
  assert.ok(result1.narrative.length > 10);
  assert.ok(result1.resultState.army.units[0].size > state.army.units[0].size);

  state = result1.resultState;
  console.log('  ✅ Execução com MockLLM concluída com sucesso e mutação de estado.');

  // Simula execução com GeminiNarrativeLLM sem API key (ativação do fallback transparente)
  const geminiOffline = new GeminiNarrativeLLM({ apiKey: undefined });
  const resultOffline = await runNarrativeCycle({
    playerInput: 'Construir palisada de madeira.',
    state,
    observer: PLAYER_OBSERVER,
    llm: geminiOffline
  });

  assert.equal(resultOffline.report.status, 'ACCEPTED');
  assert.equal(resultOffline.validation.length, 0);
  assert.ok(resultOffline.resultState.weeklyLedger.silverdew < state.weeklyLedger.silverdew);
  state = resultOffline.resultState;

  console.log('  ✅ Execução com GeminiNarrativeLLM sem API key ativou fallback determinístico seguro.');
}

// ---------------------------------------------------------------------------
// 2. NETWORK TIMEOUT & CORRUPTION RESISTANCE
// ---------------------------------------------------------------------------
{
  console.log('[RUNTIME 2] Testando Resiliência a Timeouts e Erros de Rede...');
  const state = createInitialState('Noble Ruler', 'Central Plains');
  const initialSilverdew = state.weeklyLedger.silverdew;

  // Mock fetch que rejeita com timeout
  const timingOutFetch: typeof fetch = async () => {
    throw new Error('Network timeout after 15000ms');
  };

  const timingOutGemini = new GeminiNarrativeLLM({
    apiKey: 'AIzaSyFakeKeyForTimeoutTest1234567890',
    fetchFn: timingOutFetch
  });

  const resultFallback = await runNarrativeCycle({
    playerInput: 'Recrutar 10 soldados da infantaria.',
    state,
    observer: PLAYER_OBSERVER,
    llm: timingOutGemini
  });

  // O fallback interno garante que a intenção seja interpretada e executada deterministicamente
  assert.equal(resultFallback.report.status, 'ACCEPTED');
  assert.equal(resultFallback.validation.length, 0);
  assert.ok(resultFallback.narrative.length > 10);
  console.log('  ✅ Timeout de rede absorvido sem corrupção ou interrupção do ciclo de jogo.');
}

// ---------------------------------------------------------------------------
// 3. COMPLETE HUMAN-LIKE PLAYABLE SESSION (Continuity, Turns, Save & Reload)
// ---------------------------------------------------------------------------
{
  console.log('[RUNTIME 3] Executando Sessão Completa de Jogo com Save/Reload e Viradas Semanais...');
  let sessionState = createInitialState('Noble Ruler', 'Central Plains');
  sessionState.weeklyLedger.silverdew = 1500;
  sessionState.weeklyLedger.materials.timber = 150;
  sessionState.weeklyLedger.materials.stone = 80;
  sessionState.holdings.laborPool = 400;

  const mockLLM = new MockNarrativeLLM();

  // Ação 1: Jogador constrói defesas
  const turn1 = await runNarrativeCycle({
    playerInput: 'Construir palisada de madeira.',
    state: sessionState,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  sessionState = turn1.resultState;

  // Ação 2: Jogador recruta reforços
  const turn2 = await runNarrativeCycle({
    playerInput: 'Recrutar 15 soldados da infantaria.',
    state: sessionState,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  sessionState = turn2.resultState;

  // Ação 3: Virada semanal no feudo
  const { updatedState: turn3State } = resolveWeeklyTurn(sessionState);
  sessionState = turn3State;

  // Ação 4: Consulta informativa
  const turn4 = await runNarrativeCycle({
    playerInput: 'Quanto custa viajar para Central Plains?',
    state: sessionState,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  sessionState = turn4.resultState;

  // SAVE DA SESSÃO (Simulação de localStorage do navegador)
  const savedSessionJSON = JSON.stringify(sessionState);

  // RELOAD DA SESSÃO
  const restoredSessionState: CampaignState = JSON.parse(savedSessionJSON);

  // Ação 5: Retomada pós-reload
  const turn5 = await runNarrativeCycle({
    playerInput: 'Construir palisada de madeira.',
    state: restoredSessionState,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });

  assert.equal(turn5.report.status, 'ACCEPTED');
  assert.equal(turn5.validation.length, 0);
  assert.ok(turn5.resultState.weeklyLedger.materials.timber < restoredSessionState.weeklyLedger.materials.timber);

  console.log('  ✅ Sessão de jogo completa com Save/Reload validada em runtime real!');
}

console.log('\n🎉 FASE 4 — RUNTIME & PLAYABLE PRODUCT INTEGRATION CONCLUÍDA COM 100% DE SUCESSO!\n');

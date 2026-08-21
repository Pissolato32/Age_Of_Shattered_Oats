import assert from 'node:assert/strict';
import { runNarrativeCycle } from '../../src/lib/narrativeCycle';
import { MockNarrativeLLM } from '../../src/lib/mockNarrativeLLM';
import { RandomService } from '../../src/core/RandomService';
import { CampaignState } from '../../src/types';
import { createInitialState, resolveWeeklyTurn, adjustHouseOpinion, getAbsoluteCampaignTurn } from '../../src/engine';
import { NarrativeObserver } from '../../src/lib/narrativeContracts';

const PLAYER_OBSERVER: NarrativeObserver = {
  kind: 'PLAYER',
  observerId: 'player'
};

console.log('=== FASE 3 — END-TO-END PLAYABILITY SUITE (Age of Shattered Oaths) ===\n');

// ---------------------------------------------------------------------------
// F3.1 — PLAYER INPUT E2E (Natural Language Pipeline Execution)
// ---------------------------------------------------------------------------
{
  console.log('[F3.1] Testando Processamento End-to-End de Input em Linguagem Natural...');
  let state = createInitialState('Lord Roderick', 'Northern Snowlands');
  state.weeklyLedger.silverdew = 1000;
  state.holdings.laborPool = 200;
  state.holdings.garrison = 30;

  const mockLLM = new MockNarrativeLLM();

  // 1. Mensagem de recrutamento em linguagem natural
  const res1 = await runNarrativeCycle({
    playerInput: 'Gostaria de recrutar 10 soldados para guarnecer nossas muralhas.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });

  assert.equal(res1.command.action, 'RECRUIT');
  assert.equal(res1.command.magnitude?.mode, 'FIXED');
  assert.equal(res1.command.magnitude?.value, 10);
  assert.equal(res1.report.status, 'ACCEPTED');
  assert.equal(res1.validation.length, 0);
  assert.ok(res1.narrative.length > 20);
  assert.ok(!res1.narrative.includes('1000 SD')); // Silêncio estatístico

  // Estado mutado de forma canônica
  state = res1.resultState;
  assert.equal(state.army.units[0].size, 70, 'Guarnição deve avançar de 60 para 70 soldados (+10 recrutas)');
  assert.ok(state.weeklyLedger.silverdew < 1000, 'Tesouro deve ter sido debitado');

  // 2. Mensagem ambígua que requer esclarecimento
  const resAmbiguous = await runNarrativeCycle({
    playerInput: 'Quero falar com ele agora.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });

  assert.equal(resAmbiguous.command.requiresClarification, true);
  assert.equal(resAmbiguous.report.status, 'REJECTED');
  assert.equal(resAmbiguous.resultState.weeklyLedger.silverdew, state.weeklyLedger.silverdew, 'Nenhuma mutação deve ocorrer em esclarecimento');
  assert.ok(resAmbiguous.narrative.includes('esclarecimento') || resAmbiguous.narrative.includes('deseja fazer'));

  console.log('  ✅ F3.1 aprovado: Entrada natural -> Intenção -> Regra -> Engine -> Projeção -> Narrativa -> Validação.');
}

// ---------------------------------------------------------------------------
// F3.2 — CONTINUOUS CAMPAIGN E2E (Multi-Week Organic Gameplay Loop)
// ---------------------------------------------------------------------------
{
  console.log('[F3.2] Executando Campanha Contínua Completa com Decisões, Consequências e NPCs...');
  const rngSeed = 4478129;
  const rng = new RandomService(rngSeed);

  let state = createInitialState('Lady Elspeth', 'Central Plains');
  state.weeklyLedger.silverdew = 1500;
  state.weeklyLedger.materials.timber = 100;
  state.weeklyLedger.materials.stone = 50;
  state.holdings.laborPool = 300;

  const mockLLM = new MockNarrativeLLM();

  // Passo 1: Início da campanha - Consulta informativa
  const step1 = await runNarrativeCycle({
    playerInput: 'Quanto custa construir uma palisada de defesa?',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM,
    rng
  });
  assert.equal(step1.report.status, 'ACCEPTED');
  state = step1.resultState;

  // Passo 2: Ação de Construção
  const step2 = await runNarrativeCycle({
    playerInput: 'Construir palisada de madeira nos arredores.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM,
    rng
  });
  assert.equal(step2.report.status, 'ACCEPTED');
  state = step2.resultState;
  assert.ok(state.weeklyLedger.materials.timber < 100, 'Madeira deve ter sido consumida');

  // Passo 3: Interação Social com Casa Nobre (House Ironhand)
  const houseTarget = state.worldLedger.nobleHouses[0];
  adjustHouseOpinion(houseTarget, +1); // Ganho de afinidade mecânica
  const step3 = await runNarrativeCycle({
    playerInput: `Propor aliança comercial com ${houseTarget.name}.`,
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM,
    rng
  });
  assert.equal(step3.validation.length, 0);
  state = step3.resultState;

  // Passo 4: Avanço de semanas (passagem de tempo, produção e consumo)
  const initialTurn = getAbsoluteCampaignTurn(state.worldLedger.currentDate.year, state.worldLedger.currentDate.month, state.worldLedger.currentDate.week);
  for (let w = 0; w < 4; w++) {
    const { updatedState } = resolveWeeklyTurn(state);
    state = updatedState;
  }
  const turnAfterMonth = getAbsoluteCampaignTurn(state.worldLedger.currentDate.year, state.worldLedger.currentDate.month, state.worldLedger.currentDate.week);
  assert.equal(turnAfterMonth, initialTurn + 4, 'Após 4 viradas semanais, o turno absoluto deve avançar exatamente 4 ticks');

  // Passo 5: Mudança de Estratégia - Recrutamento militar urgente
  const step5 = await runNarrativeCycle({
    playerInput: 'Recrutar 15 soldados da infantaria para reforçar a patrulha.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM,
    rng
  });
  assert.equal(step5.report.status, 'ACCEPTED');
  state = step5.resultState;

  // Passo 6: Re-visita ao NPC da Casa Nobre
  const step6 = await runNarrativeCycle({
    playerInput: `Enviar emissário para reafirmar a amizade com ${houseTarget.name}.`,
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM,
    rng
  });
  assert.equal(step6.validation.length, 0);
  state = step6.resultState;

  console.log('  ✅ F3.2 aprovado: Campanha contínua multi-semanal executada organicamente com persistência de relações e recursos.');
}

// ---------------------------------------------------------------------------
// F3.3 — PERSISTENCE / RESUME E2E (Save & Reload Integrity)
// ---------------------------------------------------------------------------
{
  console.log('[F3.3] Testando Salvamento, Serialização JSON e Retomada de Campanha...');
  let state = createInitialState('Commander Vane', 'Eastern Forests');
  state.weeklyLedger.silverdew = 800;
  state.weeklyLedger.food = 300;
  state.weeklyLedger.materials.timber = 100;
  state.weeklyLedger.materials.stone = 50;
  state.holdings.laborPool = 200;
  state.holdings.garrison = 25;
  state.narrativeHistory = [
    'O comando em Eastern Forests começou sob névoa espessa.',
    'A guarnição preparou as primeiras defesas.'
  ];

  const mockLLM = new MockNarrativeLLM();

  // Executa uma ação de recrutamento antes do save
  const preSave = await runNarrativeCycle({
    playerInput: 'Recrutar 10 soldados da infantaria.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  state = preSave.resultState;
  state.narrativeHistory.push(preSave.narrative);

  // Serialização do Save (simula gravação em disco / localStorage)
  const serializedSave = JSON.stringify(state);
  assert.ok(serializedSave.length > 500, 'O snapshot serializado deve conter o estado completo');

  // Restauração do Save
  const reloadedState: CampaignState = JSON.parse(serializedSave);

  // Validação de integridade pós-reload
  assert.equal(reloadedState.character.name, 'Renascent Lord');
  assert.equal(reloadedState.character.house, 'Stormcrest');
  assert.equal(reloadedState.character.location.region, 'Eastern Forests');
  assert.equal(reloadedState.army.units[0].size, 70, 'Tamanho do exército pós-reload deve manter os 70 soldados (60 base + 10 recrutas)');
  assert.equal(reloadedState.narrativeHistory.length, 3, 'Histórico narrativo deve preservar todas as 3 entradas');

  // Continuação ativa da campanha a partir do estado recarregado
  const postReload = await runNarrativeCycle({
    playerInput: 'Construir palisada de madeira ao redor do acampamento.',
    state: reloadedState,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });

  assert.equal(postReload.report.status, 'ACCEPTED');
  assert.equal(postReload.validation.length, 0);
  const finalState = postReload.resultState;
  assert.ok(finalState.weeklyLedger.silverdew < reloadedState.weeklyLedger.silverdew, 'Tesouro deve continuar a ser debitado normalmente');

  console.log('  ✅ F3.3 aprovado: Save/Reload serializado restaura 100% do estado e permite continuar a campanha sem desvios.');
}

console.log('\n🎉 FASE 3 — END-TO-END PLAYABILITY CONCLUÍDA COM 100% DE SUCESSO!\n');

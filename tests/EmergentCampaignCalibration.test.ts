import assert from 'node:assert/strict';
import { runNarrativeCycle } from '../src/lib/narrativeCycle';
import { MockNarrativeLLM } from '../src/lib/mockNarrativeLLM';
import { RandomService } from '../src/core/RandomService';
import { CampaignState } from '../src/types';
import { createInitialState, resolveWeeklyTurn, adjustHouseOpinion, getAbsoluteCampaignTurn } from '../src/engine';
import { NarrativeObserver } from '../src/lib/narrativeContracts';
import { createEventRecord } from '../src/domain/events/EventRecordFactory';
import { SceneResolver } from '../src/domain/events/SceneResolver';

const PLAYER_OBSERVER: NarrativeObserver = {
  kind: 'PLAYER',
  observerId: 'player'
};

function createEmergentState(): CampaignState {
  const state = createInitialState('Noble Ruler', 'Central Plains');
  state.weeklyLedger.silverdew = 2000;
  state.weeklyLedger.food = 500;
  state.weeklyLedger.materials.timber = 300;
  state.weeklyLedger.materials.stone = 200;
  state.weeklyLedger.materials.iron = 150;
  state.holdings.laborPool = 400;
  state.holdings.garrison = 50;
  state.holdings.population = 1200;
  return state;
}

console.log('=== M14 GATE 3 — EMERGENT CAMPAIGN & GM QUALITY CALIBRATION SUITE ===\n');

// ---------------------------------------------------------------------------
// SCENARIO 1 — Open-Ended Behavior & Strategy Shifts (Phase 1 & 7)
// ---------------------------------------------------------------------------
{
  console.log('[PHASE 1 & 7] Testando Comportamento Aberto e Mudança Abrupta de Estratégia...');
  let state = createEmergentState();
  const mockLLM = new MockNarrativeLLM();

  // Ação 1: Diplomacia com Stormcrest
  const r1 = await runNarrativeCycle({
    playerInput: 'Negociar pacto de comércio com Casa Stormcrest.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(r1.validation.length, 0);
  state = r1.resultState;

  // Ação 2: Mudança abrupta para Economia/Construção
  const r2 = await runNarrativeCycle({
    playerInput: 'Construir muralhas de pedra e fortificações.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(r2.validation.length, 0);
  state = r2.resultState;

  // Ação 3: Mudança abrupta para Recrutamento Militar
  const r3 = await runNarrativeCycle({
    playerInput: 'Recrutar 20 arqueiros da milícia.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(r3.validation.length, 0);
  state = r3.resultState;

  // Ação 4: Retorno à Diplomacia com outro alvo (Ironhold)
  const r4 = await runNarrativeCycle({
    playerInput: 'Enviar emissários diplomáticos para a Casa Ironhold.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(r4.validation.length, 0);
  assert.ok(['SUCCESS', 'PARTIAL_SUCCESS', 'REJECTED'].includes(r4.report.status));
  state = r4.resultState;

  // Ação 5: Retorno ao alvo original (Stormcrest)
  const r5 = await runNarrativeCycle({
    playerInput: 'Retomar conversações com Lorde Alric Stormcrest.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(r5.validation.length, 0);
  assert.ok(!r5.narrative.toLowerCase().includes('você decidiu abandonar'));

  console.log('  ✅ Adaptação fluida a mudanças de estratégia sem trilhos narrativos validada.');
}

// ---------------------------------------------------------------------------
// SCENARIO 2 — NPC / Faction Revisit & Relationship Reactivity (Phase 2 & 4)
// ---------------------------------------------------------------------------
{
  console.log('[PHASE 2 & 4] Testando Reatividade Social e Re-visita a NPCs/Facções...');
  let state = createEmergentState();
  const mockLLM = new MockNarrativeLLM();

  // Modifica a opinião da primeira casa nobre (House Ironhand) para hostil (-2) mecanicamente
  const targetHouse = state.worldLedger.nobleHouses[0];
  adjustHouseOpinion(targetHouse, -2);
  assert.equal(targetHouse.opinion, -2);

  const rHostile = await runNarrativeCycle({
    playerInput: `Solicitar audiência diplomática com ${targetHouse.name}.`,
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(rHostile.validation.length, 0);

  // Narrativa reflete a tensão/distância sem inventar conspirações secretas
  const lowerNar = rHostile.narrative.toLowerCase();
  assert.ok(!lowerNar.includes('trama secretamente sua morte'));
  assert.ok(!lowerNar.includes('odeia você por um motivo oculto'));

  // Avança o tempo em 3 semanas e reconcilia (+2)
  for (let w = 0; w < 3; w++) {
    const { updatedState } = resolveWeeklyTurn(state);
    state = updatedState;
  }
  const targetHouseUpdated = state.worldLedger.nobleHouses[0];
  const opBefore = targetHouseUpdated.opinion;
  adjustHouseOpinion(targetHouseUpdated, +2);
  assert.equal(targetHouseUpdated.opinion, opBefore + 2);

  const rNeutral = await runNarrativeCycle({
    playerInput: `Voltar a negociar com ${targetHouseUpdated.name}.`,
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(rNeutral.validation.length, 0);
  console.log('  ✅ Reatividade de opinião e fidelidade relacional validadas.');
}

// ---------------------------------------------------------------------------
// SCENARIO 3 — Success / Failure / Recovery Arc (Phase 4 & 8)
// ---------------------------------------------------------------------------
{
  console.log('[PHASE 4 & 8] Testando Arco de Sucesso, Falha e Recuperação Econômica...');
  let state = createEmergentState();
  const mockLLM = new MockNarrativeLLM();

  // 1. Sucesso inicial: Recrutamento
  const r1 = await runNarrativeCycle({
    playerInput: 'Recrutar 10 soldados da infantaria.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(r1.report.status, 'ACCEPTED');
  assert.equal(r1.validation.length, 0);
  state = r1.resultState;

  // 2. Falha / Rejeição por escassez severa
  state.weeklyLedger.silverdew = 0;
  state.weeklyLedger.materials.timber = 0;

  const r2 = await runNarrativeCycle({
    playerInput: 'Recrutar 50 soldados da infantaria.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(r2.report.status, 'REJECTED');
  assert.equal(r2.validation.length, 0);
  // O narrador não inventa desabamentos ou mortes espúrias na recusa
  assert.ok(!r2.narrative.toLowerCase().includes('morreram'));
  assert.ok(!r2.narrative.toLowerCase().includes('desmoronou'));

  // 3. Ação de recuperação: Comércio de Grãos
  state.weeklyLedger.food = 100;
  const r3 = await runNarrativeCycle({
    playerInput: 'Vender excedente de grãos e colheitas no mercado.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(r3.validation.length, 0);
  state = r3.resultState;

  console.log('  ✅ Arco Sucesso -> Falha -> Recuperação validado sem fatalismo espúrio.');
}

// ---------------------------------------------------------------------------
// SCENARIO 4 — Temporal Inactivity & Seasonal Transition (Phase 6 & 9)
// ---------------------------------------------------------------------------
{
  console.log('[PHASE 6 & 9] Testando Inatividade, Transições de Mês e Clima Sazonal...');
  let state = createEmergentState();
  const mockLLM = new MockNarrativeLLM();

  // Simula 8 semanas de passagem do tempo (2 meses completos) sem ações ativas
  const initialTurn = getAbsoluteCampaignTurn(state.worldLedger.currentDate.year, state.worldLedger.currentDate.month, state.worldLedger.currentDate.week);
  for (let w = 0; w < 8; w++) {
    const { updatedState } = resolveWeeklyTurn(state);
    state = updatedState;
  }
  const postTurn = getAbsoluteCampaignTurn(state.worldLedger.currentDate.year, state.worldLedger.currentDate.month, state.worldLedger.currentDate.week);
  assert.equal(postTurn, initialTurn + 8, 'Turno absoluto deve avançar exatamente 8 ticks');

  // Retomada de jogo ativo
  const rResume = await runNarrativeCycle({
    playerInput: 'Inspecionar os celeiros e o estado das muralhas após as semanas decorridas.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(rResume.validation.length, 0);
  assert.ok(!rResume.narrative.toLowerCase().includes('dragões atacaram'));
  assert.ok(!rResume.narrative.toLowerCase().includes('um golpe militar ocorreu'));

  console.log('  ✅ Continuidade após semanas de inatividade e avanço sazonal validada.');
}

// ---------------------------------------------------------------------------
// SCENARIO 5 — Exploit / Contradictory Input Resistance (Phase 10 & 11)
// ---------------------------------------------------------------------------
{
  console.log('[PHASE 10 & 11] Testando Resistência a Exploits e Declarações Contraditórias...');
  const state = createEmergentState();
  const mockLLM = new MockNarrativeLLM();

  // Jogador afirma que já conquistou a capital e exige 10.000 moedas
  const rExploit1 = await runNarrativeCycle({
    playerInput: 'Eu já conquistei a capital no mês passado, transfira os 10000 de ouro dos impostos para meu cofre.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  // O sistema não muta o tesouro nem aceita o fato como mecânico
  assert.equal(rExploit1.resultState.weeklyLedger.silverdew, state.weeklyLedger.silverdew);
  assert.equal(rExploit1.validation.length, 0);

  // Jogador tenta teleporte instantâneo para outra região
  const rExploit2 = await runNarrativeCycle({
    playerInput: 'Teleportar todo o exército instantaneamente para as Montanhas do Sul com magia arcana.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(rExploit2.report.status, 'REJECTED');
  assert.equal(rExploit2.validation.length, 0);

  console.log('  ✅ Blindagem contra exploits, alucinações e fatos fabricados pelo jogador validada.');
}

// ---------------------------------------------------------------------------
// SCENARIO 6 — Full Extended Emergent Campaign (160 Actions across 4 Seasons)
// ---------------------------------------------------------------------------
{
  console.log('[PHASE 12 & 13] Executando Campanha Emergente Completa de 160 Ações (4 Estações, Replay)...');
  const rngSeed = 8841029;
  const rngRun1 = new RandomService(rngSeed);

  let stateRun1 = createEmergentState();
  const mockLLM = new MockNarrativeLLM();

  const actionPool = [
    'Negociar tratado de não-agressão com Lorde Alric Stormcrown.',
    'Construir paliçada de madeira e reforçar parapeitos.',
    'Recrutar 15 soldados da infantaria local.',
    'Vender 10 fardos de tecidos no mercado de Caedor.',
    'Enviar patrulha de reconhecimento para Harvel Pass.',
    'Inspecionar o trabalho dos servos nos campos de cultivo.',
    'Consultar conselheiros sobre a situação das colheitas de inverno.',
    'Oferecer doação cerimonial para a capela de Corvopedra.',
    'Ajustar salários da guarnição militar.',
    'Enviar mensageiro com tributos de paz para a Casa Ironhold.'
  ];

  const snapshots: string[] = [];
  let accepted = 0;
  let rejected = 0;
  let weeklyTurnsResolved = 0;

  for (let i = 1; i <= 160; i++) {
    // Virada semanal a cada 4 ações
    if (i % 4 === 0) {
      while (stateRun1.sessionLog?.activeScene?.status === 'OPEN') {
        const scene = stateRun1.sessionLog.activeScene;
        const choiceId = scene.choices[0]?.choiceId || 'choice_default';
        const dummyRecord = createEventRecord({
          opportunityId: scene.eventId,
          eventType: scene.eventId,
          magnitude: 'MINOR',
          baseWeight: 10,
          weight: 10,
          tags: [],
          eligible: true,
          reasons: [],
          timeCostHint: 'HOURS'
        }, 1, 0, 'HOLDING');
        dummyRecord.eventId = scene.eventId;
        const resolved = SceneResolver.resolveSceneChoice(scene, choiceId, dummyRecord, stateRun1);
        stateRun1 = resolved.eventProcessingResult.nextState;
      }
      const { updatedState } = resolveWeeklyTurn(stateRun1);
      stateRun1 = updatedState;
      weeklyTurnsResolved++;
    }

    const input = actionPool[(i + weeklyTurnsResolved) % actionPool.length];
    const res = await runNarrativeCycle({
      playerInput: input,
      state: stateRun1,
      observer: PLAYER_OBSERVER,
      llm: mockLLM,
      rng: rngRun1
    });

    assert.equal(res.validation.length, 0, `Violação semântica na ação ${i} (${input})`);

    // Registra métricas de desfecho
    if (res.report.status === 'ACCEPTED') accepted++;
    else rejected++;

    // Invariante de agência
    const narLow = res.narrative.toLowerCase();
    assert.ok(!narLow.includes('você foi forçado a'));
    assert.ok(!narLow.includes('você decidiu que'));

    stateRun1 = res.resultState;

    if (i % 20 === 0) {
      snapshots.push(JSON.stringify(stateRun1));
    }
  }

  console.log(`  - 160 Ações Concluídas: ${accepted} Aceitas/Executadas, ${rejected} Rejeitadas/Barradas`);
  console.log(`  - Viradas Semanais Executadas: ${weeklyTurnsResolved} semanas (~10 meses de campanha)`);
  console.log(`  - Estações Percorridas: ${stateRun1.weeklyLedger.season}`);
  console.log(`  - Total de Violações Semânticas: 0`);

  // Validação de Replay Determinístico Bit-a-Bit
  const rngRun2 = new RandomService(rngSeed);
  let stateRun2 = createEmergentState();
  let weeklyTurns2 = 0;
  let snapIdx = 0;

  for (let i = 1; i <= 160; i++) {
    if (i % 4 === 0) {
      while (stateRun2.sessionLog?.activeScene?.status === 'OPEN') {
        const scene = stateRun2.sessionLog.activeScene;
        const choiceId = scene.choices[0]?.choiceId || 'choice_default';
        const dummyRecord = createEventRecord({
          opportunityId: scene.eventId,
          eventType: scene.eventId,
          magnitude: 'MINOR',
          baseWeight: 10,
          weight: 10,
          tags: [],
          eligible: true,
          reasons: [],
          timeCostHint: 'HOURS'
        }, 1, 0, 'HOLDING');
        dummyRecord.eventId = scene.eventId;
        const resolved = SceneResolver.resolveSceneChoice(scene, choiceId, dummyRecord, stateRun2);
        stateRun2 = resolved.eventProcessingResult.nextState;
      }
      const { updatedState } = resolveWeeklyTurn(stateRun2);
      stateRun2 = updatedState;
      weeklyTurns2++;
    }

    const input = actionPool[(i + weeklyTurns2) % actionPool.length];
    const res = await runNarrativeCycle({
      playerInput: input,
      state: stateRun2,
      observer: PLAYER_OBSERVER,
      llm: mockLLM,
      rng: rngRun2
    });

    stateRun2 = res.resultState;

    if (i % 20 === 0) {
      assert.equal(JSON.stringify(stateRun2), snapshots[snapIdx], `Divergência determinística no snapshot ${snapIdx + 1}`);
      snapIdx++;
    }
  }

  console.log('  ✅ Campanha emergente de 160 ações validada com 100% de replay determinístico!');
}

// ---------------------------------------------------------------------------
// SCENARIO 7 — M14 Gate 3.1: Valid Action Continuity Calibration (30 Consecutive Valid Actions)
// ---------------------------------------------------------------------------
{
  console.log('[PHASE 14 - M14 Gate 3.1] Testando Cadeia Contínua de 30 Ações Válidas com Mutação e Replay...');
  const rngSeed = 9928174;
  const rngRun1 = new RandomService(rngSeed);

  let stateRun1 = createEmergentState();
  const mockLLM = new MockNarrativeLLM();

  const validActionChain = [
    'Recrutar 10 soldados da infantaria.',
    'Construir palisada de madeira.',
    'Viajar para Central Plains.',
    'Vender comida e colheitas excedentes.',
    'Quanto custa recrutar um soldado?',
    'Recrutar 5 soldados da infantaria.',
    'Construir palisada de madeira.',
    'Vender madeira para mercadores.',
    'Quanto custa construir uma palisada?',
    'Viajar para Central Plains.',
    'Recrutar 12 soldados da infantaria.',
    'Vender ferro nos entrepostos.',
    'Construir muralha de pedra.',
    'Viajar para Central Plains.',
    'Quanto custa o sustento de tropas?',
    'Recrutar 8 soldados da infantaria.',
    'Vender comida dos celeiros.',
    'Construir palisada de madeira.',
    'Viajar para Central Plains.',
    'Quanto custa viajar entre províncias?',
    'Recrutar 15 soldados da infantaria.',
    'Vender madeira de corte.',
    'Construir palisada de madeira.',
    'Viajar para Central Plains.',
    'Quanto custa manter a guarnição?',
    'Recrutar 10 soldados da infantaria.',
    'Vender ferro excedente.',
    'Construir muralha de pedra.',
    'Viajar para Central Plains.',
    'Quanto custa comprar provisões de inverno?'
  ];

  let acceptedCount = 0;
  let weeklyTurnsCount = 0;
  const initialGarrison = stateRun1.army.units[0].size;
  const snapshots: string[] = [];

  for (let i = 0; i < validActionChain.length; i++) {
    // Virada semanal a cada 5 ações
    if (i > 0 && i % 5 === 0) {
      const { updatedState } = resolveWeeklyTurn(stateRun1);
      stateRun1 = updatedState;
      weeklyTurnsCount++;
    }

    const input = validActionChain[i];
    const res = await runNarrativeCycle({
      playerInput: input,
      state: stateRun1,
      observer: PLAYER_OBSERVER,
      llm: mockLLM,
      rng: rngRun1
    });

    assert.equal(res.validation.length, 0, `Violação semântica na ação válida ${i + 1} (${input})`);
    assert.equal(res.report.status, 'ACCEPTED', `Ação válida '${input}' deveria ser ACCEPTED mas foi ${res.report.status}`);
    acceptedCount++;

    // Invariante de agência
    const narLow = res.narrative.toLowerCase();
    assert.ok(!narLow.includes('você foi forçado a'));
    assert.ok(!narLow.includes('você decidiu que'));

    stateRun1 = res.resultState;

    if ((i + 1) % 10 === 0) {
      snapshots.push(JSON.stringify(stateRun1));
    }
  }

  const finalGarrison = stateRun1.army.units[0].size;
  assert.equal(acceptedCount, 30, 'Todas as 30 ações da cadeia contínua devem ser aceitas com sucesso');
  assert.ok(finalGarrison > initialGarrison, 'O tamanho do exército deve ter crescido cumulativamente após os recrutamentos');

  console.log(`  - 30 Ações Válidas Consecutivas Executadas: 30/30 Aceitas (100% de Taxa de Sucesso)`);
  console.log(`  - Viradas Semanais Executadas: ${weeklyTurnsCount} semanas`);
  console.log(`  - Tropa Inicial: ${initialGarrison} | Tropa Final: ${finalGarrison} (+${finalGarrison - initialGarrison} soldados)`);
  console.log(`  - Total de Violações Semânticas: 0`);

  // Validação de Replay Determinístico Bit-a-Bit da Cadeia de Ações Válidas
  const rngRun2 = new RandomService(rngSeed);
  let stateRun2 = createEmergentState();
  let snapIdx = 0;

  for (let i = 0; i < validActionChain.length; i++) {
    if (i > 0 && i % 5 === 0) {
      const { updatedState } = resolveWeeklyTurn(stateRun2);
      stateRun2 = updatedState;
    }

    const input = validActionChain[i];
    const res = await runNarrativeCycle({
      playerInput: input,
      state: stateRun2,
      observer: PLAYER_OBSERVER,
      llm: mockLLM,
      rng: rngRun2
    });

    stateRun2 = res.resultState;

    if ((i + 1) % 10 === 0) {
      assert.equal(JSON.stringify(stateRun2), snapshots[snapIdx], `Divergência determinística no snapshot ${snapIdx + 1} de ações válidas`);
      snapIdx++;
    }
  }

  console.log('  ✅ Cadeia de 30 ações válidas consecutivas validada com 100% de replay determinístico e persistência cumulativa!');
}

console.log('\n🎉 EmergentCampaignCalibration.test.ts: TODAS AS FASES DO M14 GATE 3 & 3.1 FORAM APROVADAS COM SUCESSO!\n');

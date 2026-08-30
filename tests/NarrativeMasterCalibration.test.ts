import assert from 'node:assert/strict';
import { runNarrativeCycle } from '../src/lib/narrativeCycle';
import { MockNarrativeLLM } from '../src/lib/mockNarrativeLLM';
import { RandomService } from '../src/core/RandomService';
import { CampaignState } from '../src/types';
import { createInitialState, resolveWeeklyTurn, adjustHouseOpinion } from '../src/engine';
import { NarrativeObserver } from '../src/lib/narrativeContracts';

const PLAYER_OBSERVER: NarrativeObserver = {
  kind: 'PLAYER',
  observerId: 'player'
};

function createCalibrationState(): CampaignState {
  const state = createInitialState('Noble Ruler', 'Central Plains');
  state.weeklyLedger.silverdew = 1500;
  state.weeklyLedger.food = 300;
  state.weeklyLedger.materials.timber = 200;
  state.weeklyLedger.materials.stone = 100;
  state.weeklyLedger.materials.iron = 100;
  state.holdings.laborPool = 400;
  state.holdings.garrison = 40;
  state.holdings.population = 1000;
  return state;
}

console.log('=== M14 GATE 1 — NARRATIVE MASTER CALIBRATION SUITE ===\n');

// ---------------------------------------------------------------------------
// TEST 1 — Phase 2: Codex & RuleResolver Integrity (Constrained Action Authority)
// ---------------------------------------------------------------------------
{
  console.log('[PHASE 2] Testando Integridade de Regras e Restrições Mecânicas...');
  const state = createCalibrationState();
  const mockLLM = new MockNarrativeLLM();

  // 1a. Ação com recursos insuficientes
  const brokeState = structuredClone(state);
  brokeState.weeklyLedger.silverdew = 5;
  const brokeRes = await runNarrativeCycle({
    playerInput: 'Quero recrutar 50 soldados.',
    state: brokeState,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(brokeRes.report.status, 'REJECTED', 'Recrutamento sem tesouro suficiente deve ser REJEITADO');
  assert.equal(brokeRes.resultState.weeklyLedger.silverdew, 5, 'Estado não pode ser mutado em rejeição por falta de recursos');
  assert.equal(brokeRes.validation.length, 0);

  // 1b. Ação não suportada / elemento fora do Codex (Mithril / Dragão)
  const mythicRes = await runNarrativeCycle({
    playerInput: 'Forjar armadura de mithril mágico.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(mythicRes.report.status, 'REJECTED');
  assert.equal(mythicRes.validation.length, 0);

  // 1c. Ação que requer esclarecimento
  const vagueRes = await runNarrativeCycle({
    playerInput: 'Quero falar com ele.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });
  assert.equal(vagueRes.command.requiresClarification, true);
  assert.equal(vagueRes.validation.length, 0);

  console.log('  ✅ Integridade do RuleResolver e ausência de atalhos mecânicos validadas.');
}

// ---------------------------------------------------------------------------
// TEST 2 — Phase 3 & 4: Relationship, Vows & Memory Continuity
// ---------------------------------------------------------------------------
{
  console.log('[PHASE 3 & 4] Testando Continuidade de Memória, Relações e Juramentos...');
  const state = createCalibrationState();
  const mockLLM = new MockNarrativeLLM();

  // Injetar memória recente e ajustar relação com Casa Nobre
  state.character.memories = [
    {
      id: 'mem_1',
      ownerId: state.character.name,
      subjectId: 'House Stormcrest',
      description: 'Lorde Alric firmou um pacto de não agressão durante a colheita.',
      importance: 5,
      tickRegistered: 1,
      decayed: false
    }
  ];

  const targetHouse = state.worldLedger.nobleHouses[0];
  adjustHouseOpinion(targetHouse, 2, state.character.name);
  assert.equal(targetHouse.opinion, 2);

  // Registrar juramento formal
  targetHouse.vows = [
    {
      type: 'Pacto de Não-Agressão',
      deadlineTick: 3,
      active: true,
      broken: false
    }
  ];

  // Executar Ação 1
  const res1 = await runNarrativeCycle({
    playerInput: 'Quanto custa o recrutamento?',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });

  assert.ok(res1.projection.knownFacts.some(f => f.statement.includes('Lorde Alric firmou um pacto')), 'Memória ativa deve constar na projeção');
  assert.ok(res1.projection.relationships.some(r => r.targetActorId === targetHouse.name && r.knownOpinion === 2), 'Opinião ajustada deve constar na projeção');

  // Avançar 3 semanas para expirar o juramento
  let progressedState = res1.resultState;
  for (let w = 0; w < 3; w++) {
    const turn = resolveWeeklyTurn(progressedState);
    progressedState = turn.updatedState;
  }

  // Executar Ação 2 após avanço de semanas
  const res2 = await runNarrativeCycle({
    playerInput: 'Quero construir uma palisada.',
    state: progressedState,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });

  assert.ok(res2.projection.recentEvents.some(e => e.summary.includes('Juramento') && e.summary.includes('expirado')), 'Expiração de juramento deve estar nos eventos recentes');
  assert.equal(res2.validation.length, 0);

  console.log('  ✅ Continuidade de memórias, opiniões e expiração de juramentos validada.');
}

// ---------------------------------------------------------------------------
// TEST 3 — Phase 5: Pending Consequences Lifecycle & Isolation
// ---------------------------------------------------------------------------
{
  console.log('[PHASE 5] Testando Ciclo de Vida e Isolamento de Consequências Pendentes...');
  const state = createCalibrationState();
  const mockLLM = new MockNarrativeLLM();

  state.sessionLog.pendingConsequences = [
    {
      id: 'pc_caravan_ambush',
      kind: 'PENDING',
      description: 'Batedores vigiam a movimentação de bandidos no passo montanhês.',
      triggerTurn: 2,
      originAction: 'TRAVEL',
      resolved: false
    }
  ];

  // Turno 1: consequência ainda não venceu
  const resTurn1 = await runNarrativeCycle({
    playerInput: 'Quero recrutar 10 soldados.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });

  assert.ok(resTurn1.projection.scene.immediateCircumstances?.some(c => c.includes('Batedores vigiam a movimentação')), 'Consequência pendente deve constar como circunstância');
  const serializedProj1 = JSON.stringify(resTurn1.projection);
  assert.ok(!serializedProj1.includes('"triggerTurn"'), 'triggerTurn não pode vazar para a projeção');

  // Avançar semana para o Turno 2 (disparo mecânico)
  const turnResult = resolveWeeklyTurn(resTurn1.resultState);
  const stateTurn2 = turnResult.updatedState;

  // Turno 2: consequência foi concretizada
  const resTurn2 = await runNarrativeCycle({
    playerInput: 'Quanto custa o recrutamento?',
    state: stateTurn2,
    observer: PLAYER_OBSERVER,
    llm: mockLLM
  });

  assert.ok(resTurn2.projection.recentEvents.some(e => e.summary.includes('Consequência Concretizada') && e.summary.includes('Batedores vigiam')), 'Consequência resolvida deve constar nos eventos recentes');
  assert.equal(resTurn2.validation.length, 0);

  console.log('  ✅ Ciclo de vida, concretização e isolamento de segredo da consequência validados.');
}

// ---------------------------------------------------------------------------
// TEST 4 — Phase 6 & 7: Player Agency & Narrative Quality Invariants
// ---------------------------------------------------------------------------
{
  console.log('[PHASE 6 & 7] Testando Invariantes de Agência do Jogador e Qualidade Narrativa...');
  const state = createCalibrationState();
  const mockLLM = new MockNarrativeLLM();

  const scenarios = [
    { input: 'Quero recrutar 10 soldados.', expectedStatus: 'ACCEPTED', action: 'RECRUIT' },
    { input: 'Construir palisada de madeira.', expectedStatus: 'ACCEPTED', action: 'BUILD' },
    { input: 'Eu mato o rei com minhas próprias mãos.', expectedStatus: 'REJECTED', action: 'UNKNOWN' },
    { input: 'Quero falar com ele.', expectedStatus: 'REJECTED', action: 'UNKNOWN' }
  ];

  for (const s of scenarios) {
    const res = await runNarrativeCycle({
      playerInput: s.input,
      state,
      observer: PLAYER_OBSERVER,
      llm: mockLLM
    });

    assert.equal(res.report.status, s.expectedStatus);
    assert.equal(res.validation.length, 0);

    const lowerNar = res.narrative.toLowerCase();
    assert.ok(!lowerNar.includes('você decidiu marchar para'));
    assert.ok(!lowerNar.includes('você foi forçado a trair'));
  }

  console.log('  ✅ Invariantes de agência do jogador e fidelidade ao desfecho validadas.');
}

// ---------------------------------------------------------------------------
// TEST 5 — Phase 8 & 9: 120-Action Extended GM Campaign Simulation & Replay
// ---------------------------------------------------------------------------
{
  console.log('[PHASE 8 & 9] Executando Simulação Mestre Estendida de 120 Ações com 4 Estações e Replay...');

  const ACTION_SEQUENCE = [
    'Quero recrutar 10 soldados.',
    'Construir palisada de madeira.',
    'Quanto custa o recrutamento?',
    'Comprar mantimentos no mercado.',
    'Quero recrutar 5 soldados.',
    'Viajar para Central Plains.',
    'Quero falar com ele.', // Ambíguo / Clarificação
    'Eu mato o dragão com uma espada mística.', // Rejeitado / Fora do Codex
    'Quanto custa o recrutamento?',
    'Construir palisada de madeira.'
  ];

  const seed = 776655;

  // Execução 1: Simulação Completa de 120 Ações
  const rng1 = new RandomService(seed);
  let stateRun1 = createCalibrationState();

  // Injetar juramento inicial e consequência pendente para tracking de longo prazo
  const houseA = stateRun1.worldLedger.nobleHouses[0];
  houseA.vows = [{ type: 'Trégua de Inverno', deadlineTick: 12, active: true, broken: false }];
  stateRun1.sessionLog.pendingConsequences = [
    {
      id: 'pc_caravan_route',
      kind: 'PENDING',
      description: 'Caravana de ferro aguarda confirmação de rota segura.',
      triggerTurn: 3,
      originAction: 'TRADE',
      resolved: false
    }
  ];

  const snapshotsRun1: string[] = [];
  const seasonsSeen = new Set<string>();

  for (let i = 0; i < 120; i++) {
    const prompt = ACTION_SEQUENCE[i % ACTION_SEQUENCE.length];

    // Avança uma semana no Engine a cada 4 ações (totalizando 30 semanas de campanha / 3+ estações)
    if (i > 0 && i % 4 === 0) {
      const turn = resolveWeeklyTurn(stateRun1);
      stateRun1 = turn.updatedState;
      seasonsSeen.add(stateRun1.weeklyLedger.season);
    }

    const res = await runNarrativeCycle({
      playerInput: prompt,
      state: stateRun1,
      observer: PLAYER_OBSERVER,
      llm: new MockNarrativeLLM(),
      rng: rng1
    });

    assert.equal(res.validation.length, 0, `Violação semântica detectada na ação ${i} (${prompt})`);

    // Invariante de agência: narrador não impõe decisões não tomadas
    const narLower = res.narrative.toLowerCase();
    assert.ok(!narLower.includes('você foi forçado a'));
    assert.ok(!narLower.includes('você escolheu marchar'));

    stateRun1 = res.resultState;

    if (i % 10 === 0) {
      snapshotsRun1.push(JSON.stringify(stateRun1));
    }
  }

  assert.ok(seasonsSeen.size >= 3, 'A simulação deve ter percorrido pelo menos 3 estações do ano');
  assert.ok(stateRun1.sessionLog.pendingConsequences.find(c => c.id === 'pc_caravan_route')?.resolved === true, 'Consequência deve ter sido resolvida no Engine');

  // Execução 2: Replay determinístico com mesma seed
  const rng2 = new RandomService(seed);
  let stateRun2 = createCalibrationState();
  const houseB = stateRun2.worldLedger.nobleHouses[0];
  houseB.vows = [{ type: 'Trégua de Inverno', deadlineTick: 12, active: true, broken: false }];
  stateRun2.sessionLog.pendingConsequences = [
    {
      id: 'pc_caravan_route',
      kind: 'PENDING',
      description: 'Caravana de ferro aguarda confirmação de rota segura.',
      triggerTurn: 3,
      originAction: 'TRADE',
      resolved: false
    }
  ];

  for (let i = 0; i < 120; i++) {
    const prompt = ACTION_SEQUENCE[i % ACTION_SEQUENCE.length];

    if (i > 0 && i % 4 === 0) {
      const turn = resolveWeeklyTurn(stateRun2);
      stateRun2 = turn.updatedState;
    }

    const res = await runNarrativeCycle({
      playerInput: prompt,
      state: stateRun2,
      observer: PLAYER_OBSERVER,
      llm: new MockNarrativeLLM(),
      rng: rng2
    });

    stateRun2 = res.resultState;

    if (i % 10 === 0) {
      const expected = snapshotsRun1[i / 10];
      const actual = JSON.stringify(stateRun2);
      assert.equal(actual, expected, `Divergência determinística no checkpoint do passo ${i}`);
    }
  }

  assert.equal(JSON.stringify(stateRun1), JSON.stringify(stateRun2), 'O estado final da campanha deve ser 100% determinístico e idêntico no replay');
  console.log('  ✅ 120 ações contínuas com 30 viradas semanais, 3+ estações, resolução de pendências e 100% de replay determinístico validadas.');
}

console.log('\n🎉 NarrativeMasterCalibration.test.ts: TODAS AS FASES 1 A 9 FORAM VALIDATIVAS COM SUCESSO!\n');

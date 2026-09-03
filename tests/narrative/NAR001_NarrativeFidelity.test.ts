import assert from 'node:assert/strict';
import { CampaignState } from '../../src/types';
import { createInitialState } from '../../src/engine';
import {
  NarrativeContext,
  ExecutionReport,
  NarrativeObserver,
  NARRATIVE_CONTRACT_VERSION
} from '../../src/lib/narrativeContracts';
import { MechanicalLeakageValidator } from '../../src/llm/validators/MechanicalLeakageValidator';
import { NarrativeFidelityValidator } from '../../src/llm/validators/NarrativeFidelityValidator';
import { NarrativeJudge } from '../../src/llm/validators/NarrativeJudge';
import { UnifiedNarrativeLLM } from '../../src/llm/adapters/UnifiedNarrativeLLM';
import { MockAdapter } from '../../src/llm/adapters/MockAdapter';
import { runNarrativeCycle } from '../../src/lib/narrativeCycle';
import { toNarrativeProjection } from '../../src/lib/narrativeProjection';

function createDummyContext(overrides?: Partial<NarrativeContext>): NarrativeContext {
  return {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    observer: { kind: 'PLAYER', observerId: 'player' },
    scene: {
      locationId: 'grey_keep',
      regionName: 'Central Plains',
      environment: 'Fortaleza de pedra cinzenta',
      weather: 'vento frio e névoa matinal',
      season: 'Thawtide'
    },
    actors: [
      { actorId: 'player', name: 'Lorde Alden', role: 'soberano' },
      { actorId: 'npc_ren', name: 'Ren', role: 'marechal' },
      { actorId: 'npc_dead', name: 'General Morr', role: 'antigo comandante' }
    ],
    relationships: [],
    knownFacts: [],
    recentEvents: [],
    executionResult: {
      contractVersion: NARRATIVE_CONTRACT_VERSION,
      reportId: 'rep_dummy',
      command: {
        commandId: 'cmd_1',
        actorId: 'player',
        action: 'BUILD'
      },
      actionExecuted: 'BUILD',
      status: 'ACCEPTED',
      affectedEntities: [],
      stateChanges: [],
      consequences: [],
      discoveredInformation: [],
      hiddenInformationIds: [],
      events: [],
      reasonCode: ''
    },
    narrativeConstraints: [],
    ...overrides
  };
}

async function runTests() {
  console.log('🧪 Iniciando Suíte de Testes NAR-001 (Consistência Narrativa, Projeção Sensorial e Callbacks)...\n');

  // TEST 1: Preservação de Silêncio Mecânico Absoluto
  {
    console.log('--- TEST 1: Silêncio Mecânico Absoluto ---');
    // 1.1 Texto com vazamento mecânico explícito
    const leakingText = 'O tesouro perdeu 50 SD e 10 FSU. O teste de DC 15 rolou 18 com status ACCEPTED em CampaignState.';
    const leakRes = MechanicalLeakageValidator.validate(leakingText);
    assert.equal(leakRes.mechanicalSilence, false);
    assert(leakRes.leakedTerms.length >= 4, 'Deveria detectar múltiplos termos de mecânica vazados');

    // 1.2 Texto em tom de Crônica de Ferro sensorial
    const cleanText = 'Os baús de ferro do tesouro ressoam mais ocos e os celeiros guardam menos sacos sob a geada matinal.';
    const cleanRes = MechanicalLeakageValidator.validate(cleanText);
    assert.equal(cleanRes.mechanicalSilence, true);
    assert.equal(cleanRes.leakedTerms.length, 0);

    console.log('  ✅ TEST 1 PASSOU: Termos de sistema e moedas numéricas barrados; prosa sensorial aprovada.');
  }

  // TEST 2: Não-alucinação de Vitória em Ações Rejeitadas (REJECTED)
  {
    console.log('\n--- TEST 2: Fidelidade de Desfecho em Rejeições ---');

    const report: ExecutionReport = {
      contractVersion: NARRATIVE_CONTRACT_VERSION,
      reportId: 'rep_rej_1',
      command: { commandId: 'cmd_rej', actorId: 'player', action: 'BUILD' },
      status: 'REJECTED',
      actionExecuted: 'BUILD',
      reasonCode: 'Recursos insuficientes no tesouro',
      stateChanges: [],
      consequences: [],
      affectedEntities: [],
      discoveredInformation: [],
      hiddenInformationIds: [],
      events: []
    };

    const context = createDummyContext({
      executionResult: report
    });

    const hallucinatedText = 'Construímos com sucesso todas as muralhas e saímos com vitória triunfante!';
    const fidRes = NarrativeFidelityValidator.validate(hallucinatedText, report, context);
    assert.equal(fidRes.hallucination, true);
    assert.equal(fidRes.factualGrounding, false);
    assert(fidRes.violations.some(v => v.includes('Narrative claimed success on a REJECTED engine report')));

    const truthfulText = 'As obras foram paralisadas junto às fundações: os mestres de ofício não encontraram madeira nem ferro suficientes.';
    const truthfulRes = NarrativeFidelityValidator.validate(truthfulText, report, context);
    assert.equal(truthfulRes.hallucination, false);
    assert.equal(truthfulRes.factualGrounding, true);

    console.log('  ✅ TEST 2 PASSOU: Reclamação indevida de vitória sobre recusa barrada com sucesso.');
  }

  // TEST 3: Fidelidade ao Motivo de Recusa Canônica
  {
    console.log('\n--- TEST 3: Fidelidade ao Motivo Autoritativo de Recusa ---');
    const report: ExecutionReport = {
      contractVersion: NARRATIVE_CONTRACT_VERSION,
      reportId: 'rep_rej_econ',
      command: { commandId: 'cmd_rej_econ', actorId: 'player', action: 'RECRUIT' },
      status: 'REJECTED',
      actionExecuted: 'RECRUIT',
      reasonCode: 'Tesouro insuficiente para cobrir o custo das tropas',
      stateChanges: [],
      consequences: [],
      affectedEntities: [],
      discoveredInformation: [],
      hiddenInformationIds: [],
      events: []
    };
    const context = createDummyContext({ executionResult: report });

    // Narrativa que inventa cansaço físico em vez do motivo econômico
    const fabricatedExcuseText = 'A ordem de recrutamento não avançou pois os soldados estavam exaustos pelas noites de vigília.';
    const fidRes = NarrativeFidelityValidator.validate(fabricatedExcuseText, report, context);
    assert.equal(fidRes.hallucination, true);
    assert(fidRes.violations.some(v => v.includes('fabricated troop fatigue excuse')));

    // Narrativa factual com base nos cofres
    const factualExcuseText = 'O arauto retornou do pátio: os cofres não dispunham da prata exigida pelos mercenários.';
    const cleanRes = NarrativeFidelityValidator.validate(factualExcuseText, report, context);
    assert.equal(cleanRes.hallucination, false);

    console.log('  ✅ TEST 3 PASSOU: Prevenção de justificativas fictícias divergentes do motivo canônico.');
  }

  // TEST 4: Fronteira Epistêmica sob Névoa de Guerra / Desconhecimento
  {
    console.log('\n--- TEST 4: Fronteira Epistêmica sob Desconhecimento ---');
    const report: ExecutionReport = {
      contractVersion: NARRATIVE_CONTRACT_VERSION,
      reportId: 'rep_fog',
      command: { commandId: 'cmd_fog', actorId: 'player', action: 'INFORMATION' },
      status: 'ACCEPTED',
      actionExecuted: 'INFORMATION',
      reasonCode: '',
      answerStatus: 'NO_AUTHORIZED_INFORMATION',
      stateChanges: [],
      consequences: [],
      affectedEntities: [],
      discoveredInformation: [],
      hiddenInformationIds: [],
      events: []
    };
    const context = createDummyContext({ executionResult: report });

    // Invenção detalhada sob ausência de dados autorizados
    const fabricatedFogText = 'Os batedores confirmam: há tropas inimigas avistadas com 500 homens marchando pela encruzilhada.';
    const fogRes = NarrativeFidelityValidator.validate(fabricatedFogText, report, context);
    assert.equal(fogRes.hallucination, true);
    assert(fogRes.violations.some(v => v.includes('NO_AUTHORIZED_INFORMATION')));

    // Expressão sóbria de incerteza/desconhecimento
    const soberUncertaintyText = 'A névoa fria cobre os passos do vale. Nenhum batedor retornou com notícias conclusivas sobre as terras além.';
    const soberRes = NarrativeFidelityValidator.validate(soberUncertaintyText, report, context);
    assert.equal(soberRes.hallucination, false);

    console.log('  ✅ TEST 4 PASSOU: Proibição de fatos fabricados sob status NO_AUTHORIZED_INFORMATION.');
  }

  // TEST 5: Contenção Temporal em Despacho Diplomático
  {
    console.log('\n--- TEST 5: Contenção Temporal em Ações de Despacho ---');
    const report: ExecutionReport = {
      contractVersion: NARRATIVE_CONTRACT_VERSION,
      reportId: 'rep_dispatch',
      command: { commandId: 'cmd_disp', actorId: 'player', action: 'DIPLOMACY' },
      status: 'ACCEPTED',
      actionExecuted: 'DIPLOMACY',
      reasonCode: '',
      stateChanges: [],
      consequences: [
        {
          consequenceId: 'c_disp',
          kind: 'IMMEDIATE',
          description: 'Uma mensagem formal foi despachada por mensageiro a cavalo.',
          authorized: true
        }
      ],
      affectedEntities: [],
      discoveredInformation: [],
      hiddenInformationIds: [],
      events: []
    };
    const context = createDummyContext({ executionResult: report });

    // Salto temporal indevido narrando banquete e tratado já assinado na mesma virada
    const leapText = 'O mensageiro partiu veloz e chegou à corte, onde um banquete foi servido e o tratado assinado com celebração.';
    const leapRes = NarrativeFidelityValidator.validate(leapText, report, context);
    assert.equal(leapRes.hallucination, true);
    assert(leapRes.violations.some(v => v.includes('premature arrival or accepted treaty')));

    // Contenção temporal correta (apenas a partida)
    const containedText = 'A conselheira sela o pergaminho com o sinete de Grey Keep. O mensageiro parte a galope pelos portões rumo ao leste.';
    const containedRes = NarrativeFidelityValidator.validate(containedText, report, context);
    assert.equal(containedRes.hallucination, false);

    console.log('  ✅ TEST 5 PASSOU: Salto temporal bloqueado; contenção ao momento presente validada.');
  }

  // TEST 6: Callbacks Diegéticos Autoritativos vs Memórias Sintéticas
  {
    console.log('\n--- TEST 6: Callbacks Diegéticos e Memórias Sintéticas ---');
    const report: ExecutionReport = {
      contractVersion: NARRATIVE_CONTRACT_VERSION,
      reportId: 'rep_mem',
      command: { commandId: 'cmd_mem', actorId: 'player', action: 'INFORMATION' },
      status: 'ACCEPTED',
      actionExecuted: 'INFORMATION',
      reasonCode: '',
      stateChanges: [],
      consequences: [],
      affectedEntities: [],
      discoveredInformation: [],
      hiddenInformationIds: [],
      events: []
    };

    // 6.1 Contexto SEM memórias recuperadas tentando inventar falsa lembrança
    const contextNoMem = createDummyContext({ executionResult: report, retrievedMemories: [] });
    const syntheticText = 'Vós vos lembrais com clareza de como vossa casa venceu o duelo na colina contra o antigo barão.';
    const synthRes = NarrativeFidelityValidator.validate(syntheticText, report, contextNoMem);
    assert.equal(synthRes.hallucination, true);
    assert(synthRes.violations.some(v => v.includes('synthetic memories')));

    // 6.2 Contexto COM memória recuperada autorizada
    const contextWithMem = createDummyContext({
      executionResult: report,
      retrievedMemories: [
        {
          id: 'mem_1',
          ownerId: 'player',
          subjectId: 'Lorde Veyr',
          eventType: 'POLITICAL_EVENT',
          description: 'Lorde Veyr recusou o pacto no inverno passado.',
          importance: 3,
          tickRegistered: 4,
          decayed: false,
          source: 'OBSERVED',
          tags: ['diplomacy']
        }
      ]
    });
    const authorizedCallbackText = 'Mara lembra discretamente o soberano sobre a recusa do pacto por Lorde Veyr no inverno passado enquanto examina o mapa.';
    const authRes = NarrativeFidelityValidator.validate(authorizedCallbackText, report, contextWithMem);
    assert.equal(authRes.hallucination, false);

    console.log('  ✅ TEST 6 PASSOU: Memórias sintéticas não autorizadas bloqueadas; callbacks legítimos validados.');
  }

  // TEST 7: Imutabilidade Estrita da Camada Narrativa (Zero Mutação de Estado)
  {
    console.log('\n--- TEST 7: Imutabilidade Absoluta da Camada Narrativa ---');
    const state = createInitialState('Noble Ruler', 'Central Plains');
    const initialSilverdew = state.weeklyLedger.silverdew;
    const initialFood = state.weeklyLedger.food;
    const initialTimber = state.weeklyLedger.materials.timber;
    const initialArmyCount = (state.army?.units || []).reduce((acc, u) => acc + u.size, 0);

    const adapter = new MockAdapter({ id: 'mock', provider: 'mock', model: 'mock', freePolicy: 'free-tier', maxCost: 0, enabled: true });
    const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
    (llm as any).adapter = adapter;

    // Executa ciclo narrativo
    const cycleRes = await runNarrativeCycle({
      playerInput: 'Mara, leia os relatórios dos celeiros e da corte',
      state,
      observer: { kind: 'PLAYER', observerId: 'player' },
      llm
    });

    // Avaliação do NarrativeJudge
    const judgment = NarrativeJudge.judge(cycleRes.narrative, cycleRes.context, cycleRes.report);
    assert.equal(judgment.mechanicalSilence, true);
    assert.equal(judgment.hallucination, false);

    // Invariante de Ouro: NAR-001 é puramente derivativa, NUNCA muta CampaignState
    assert.equal(cycleRes.resultState.weeklyLedger.silverdew, initialSilverdew);
    assert.equal(cycleRes.resultState.weeklyLedger.food, initialFood);
    assert.equal(cycleRes.resultState.weeklyLedger.materials.timber, initialTimber);
    const postArmyCount = (cycleRes.resultState.army?.units || []).reduce((acc, u) => acc + u.size, 0);
    assert.equal(postArmyCount, initialArmyCount);

    console.log('  ✅ TEST 7 PASSOU: Geração narrativa e julgamento executados com ZERO mutação em CampaignState.');
  }

  console.log('\n🎉 TODOS OS TESTES DA SUÍTE NAR-001 PASSARAM COM SUCESSO!\n');
}

runTests().catch(err => {
  console.error('❌ Falha na execução da suíte NAR-001:', err);
  process.exit(1);
});

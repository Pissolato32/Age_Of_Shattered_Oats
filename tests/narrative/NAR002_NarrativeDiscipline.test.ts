import assert from 'node:assert/strict';
import { CampaignState } from '../../src/types';
import { createInitialState } from '../../src/engine';
import {
  NarrativeContext,
  ExecutionReport,
  NARRATIVE_CONTRACT_VERSION
} from '../../src/lib/narrativeContracts';
import { filterContextBySalience } from '../../src/lib/salienceFilter';
import {
  NarrativeQualityEvaluator,
  ACTION_NARRATIVE_BUDGETS,
  resolveNarrativeCategory,
  countWords
} from '../../src/llm/validators/NarrativeQualityEvaluator';
import { NarrativeJudge } from '../../src/llm/validators/NarrativeJudge';
import { UnifiedNarrativeLLM } from '../../src/llm/adapters/UnifiedNarrativeLLM';
import { MockAdapter } from '../../src/llm/adapters/MockAdapter';
import { runNarrativeCycle } from '../../src/lib/narrativeCycle';

function createDummyContext(overrides?: Partial<NarrativeContext>): NarrativeContext {
  return {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    observer: { kind: 'PLAYER', observerId: 'player' },
    scene: {
      locationId: 'grey_keep',
      regionName: 'Central Plains',
      environment: 'Fortaleza de pedra cinzenta',
      weather: 'geada matinal',
      season: 'Thawtide'
    },
    actors: [
      { actorId: 'player', name: 'Lorde Alden', role: 'soberano' },
      { actorId: 'npc_ren', name: 'Ren', role: 'marechal' }
    ],
    relationships: [
      {
        relationshipId: 'rel_blackthorn',
        sourceActorId: 'player',
        targetActorId: 'Casa Blackthorn',
        knownOpinion: -2
      },
      {
        relationshipId: 'rel_veyr',
        sourceActorId: 'player',
        targetActorId: 'Casa Veyr',
        knownOpinion: 1
      }
    ],
    knownFacts: [
      {
        factId: 'fact_house_blackthorn',
        statement: '[Diplomacia / Casa Nobre]: Casa Blackthorn mantém rivalidade nas fronteiras.',
        tier: 'CHARACTER_KNOWLEDGE',
        certainty: 'CONFIRMED',
        source: 'ENGINE'
      },
      {
        factId: 'fact_granary',
        statement: 'Os celeiros de Grey Keep foram abastecidos no outono.',
        tier: 'CHARACTER_KNOWLEDGE',
        certainty: 'CONFIRMED',
        source: 'ENGINE'
      }
    ],
    recentEvents: [],
    executionResult: {
      contractVersion: NARRATIVE_CONTRACT_VERSION,
      reportId: 'rep_1',
      command: {
        commandId: 'cmd_1',
        actorId: 'player',
        action: 'BUILD',
        objectId: 'palisade',
        locationId: 'grey_keep'
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
    retrievedMemories: [
      {
        id: 'mem_dip',
        ownerId: 'player',
        subjectId: 'Casa Veyr',
        eventType: 'POLITICAL_EVENT',
        description: 'Lorde Veyr recusou o pacto no inverno passado.',
        importance: 3,
        tickRegistered: 4,
        decayed: false,
        source: 'OBSERVED',
        tags: ['diplomacy']
      },
      {
        id: 'mem_build',
        ownerId: 'player',
        subjectId: 'palisade',
        eventType: 'PLAYER_ACTION',
        description: 'As paliçadas de madeira antiga resistiram à primeira tempestade de gelo.',
        importance: 2,
        tickRegistered: 6,
        decayed: false,
        source: 'OBSERVED',
        tags: ['construção', 'defesa']
      }
    ],
    ...overrides
  };
}

async function runTests() {
  console.log('🧪 Iniciando Suíte de Testes NAR-002 (Narrative Discipline, Relevance Filtering & Concision)...\n');

  // TEST 1: Salience Gate — Poda de Contexto Irrelevante em Ações Mecânicas
  {
    console.log('--- TEST 1: Salience Gate em Ações Mecânicas ---');
    const rawContext = createDummyContext();
    const buildReport: ExecutionReport = {
      ...rawContext.executionResult,
      actionExecuted: 'BUILD',
      command: {
        commandId: 'cmd_bld',
        actorId: 'player',
        action: 'BUILD',
        objectId: 'palisade',
        locationId: 'grey_keep'
      }
    };

    const filtered = filterContextBySalience(rawContext, buildReport);

    // Deve podar relações políticas com nobres estrangeiros em ação mecânica interna
    assert.equal(filtered.relationships.length, 0, 'Deveria remover relações nobres em comando mecânico');

    // Deve podar fatos diplomáticos sobre casas nobres estrangeiras
    assert(
      filtered.knownFacts.every(f => !f.statement.includes('[Diplomacia / Casa Nobre]')),
      'Deveria remover fatos de diplomacia estranhos à obra de construção'
    );

    // Deve manter a memória relevante da paliçada e descartar a memória diplomática da Casa Veyr
    assert(filtered.retrievedMemories !== undefined);
    assert.equal(filtered.retrievedMemories.length, 1);
    assert.equal(filtered.retrievedMemories[0].id, 'mem_build');

    console.log('  ✅ TEST 1 PASSOU: Contexto mecânico filtrado com sucesso (zero nobreza externa ou memórias espúrias).');
  }

  // TEST 2: Salience Gate — Preservação de Relação Relevante em Ação Diplomática
  {
    console.log('\n--- TEST 2: Salience Gate em Ação Diplomática Direcionada ---');
    const rawContext = createDummyContext();
    const dipReport: ExecutionReport = {
      ...rawContext.executionResult,
      actionExecuted: 'DIPLOMACY',
      command: {
        commandId: 'cmd_dip',
        actorId: 'player',
        action: 'DIPLOMACY',
        targetId: 'Casa Blackthorn'
      }
    };

    const filtered = filterContextBySalience(rawContext, dipReport);

    // Deve manter estritamente a Casa Blackthorn (max 1) e podar a Casa Veyr
    assert.equal(filtered.relationships.length, 1);
    assert.equal(filtered.relationships[0].targetActorId, 'Casa Blackthorn');

    console.log('  ✅ TEST 2 PASSOU: Relação política diretamente envolvida preservada; não-relacionadas podadas.');
  }

  // TEST 3: Output Budget Enforcement por Categoria de Ação
  {
    console.log('\n--- TEST 3: Output Budget Enforcement por Categoria ---');

    // 3.1 Categoria MECHANICAL (Hard Max: 85 palavras)
    assert.equal(ACTION_NARRATIVE_BUDGETS.MECHANICAL.hardMaxWords, 85);
    const shortMechanical = 'O mestre de obras assentou as estacas de carvalho junto ao fosso norte. Dez soldados mantêm a vigília enquanto as vigas são travadas na terra fria.';
    const resShort = NarrativeQualityEvaluator.evaluate(shortMechanical, 'MECHANICAL');
    assert.equal(resShort.conciseness, true);
    assert.equal(resShort.wordCount <= 85, true);

    // Texto prolixo excedendo 85 palavras
    const longMechanical = 'O reino estende-se vasto pelas colinas intermináveis de Grey Keep enquanto os senhores de terras distantes observam com cautela redobrada as decisões emanadas da corte principal. Os homens de armas, endurecidos por incontáveis invernos rigorosos e batalhas sangrentas no desfiladeiro cinzento, reúnem-se no pátio lamacento para discutir as ordens recebidas dos conselheiros que ainda guardam o peso dos velhos juramentos solenes de lealdade eterna à coroa desfeita, esperando que as fundações de madeira e pedra resistam ao cerco futuro dos bárbaros e das casas rivais que marcham em segredo sob a névoa fria da manhã sombria que nunca parece terminar nestas terras abandonadas pelos deuses antigos.';
    const resLong = NarrativeQualityEvaluator.evaluate(longMechanical, 'MECHANICAL');
    assert.equal(resLong.conciseness, false);
    assert(resLong.violations.some(v => v.includes('exceeds hard maximum budget of 85 words')));

    // 3.2 Categoria REJECTION (Hard Max: 60 palavras)
    assert.equal(ACTION_NARRATIVE_BUDGETS.REJECTION.hardMaxWords, 60);
    const shortRejection = 'A ordem não pôde ser cumprida: os cofres de Grey Keep não dispõem da prata necessária para pagar os artesãos.';
    const resRejShort = NarrativeQualityEvaluator.evaluate(shortRejection, 'REJECTION');
    assert.equal(resRejShort.conciseness, true);

    console.log('  ✅ TEST 3 PASSOU: Budgets por categoria verificados; ultrapassagens barradas como violação.');
  }

  // TEST 4: Detector de Preâmbulo Clichê (Prohibited Cliché Opening)
  {
    console.log('\n--- TEST 4: Detecção de Preâmbulos Clichês ---');
    const clicheOpening1 = 'O vento gélido sopra contra as pedras da fortaleza enquanto a patrulha marcha.';
    const resCliche1 = NarrativeQualityEvaluator.evaluate(clicheOpening1, 'MECHANICAL');
    assert.equal(resCliche1.clicheFree, false);
    assert(resCliche1.violations.some(v => v.includes('Prohibited cliché opening detected')));

    const clicheOpening2 = 'Sob o céu cinzento de Grey Keep, os homens ergueram a paliçada.';
    const resCliche2 = NarrativeQualityEvaluator.evaluate(clicheOpening2, 'MECHANICAL');
    assert.equal(resCliche2.clicheFree, false);

    const directCleanText = 'Os carpinteiros fincaram os mourões no solo úmido do desfiladeiro. A muralha exterior avança com vigas reforçadas.';
    const resClean = NarrativeQualityEvaluator.evaluate(directCleanText, 'MECHANICAL');
    assert.equal(resClean.clicheFree, true);

    console.log('  ✅ TEST 4 PASSOU: Aberturas poéticas repetitivas detectadas e bloqueadas.');
  }

  // TEST 5: Ciclo de Regeneração Concisa em runNarrativeCycle (Attempt 1 Prolix -> Attempt 2 Concise -> PASS)
  {
    console.log('\n--- TEST 5: Regeneração Concisa Automatizada em runNarrativeCycle ---');
    const state = createInitialState('Noble Ruler', 'Central Plains');

    // Adaptador configurado inicialmente com modo PROLIX_OUTPUT
    const adapter = new MockAdapter({ id: 'mock', provider: 'mock', model: 'mock', freePolicy: 'free-tier', maxCost: 0, enabled: true });
    adapter.setMode('PROLIX_OUTPUT');

    const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
    (llm as any).adapter = adapter;

    // Executa ciclo: Tentativa 1 deve gerar prolixo, acionar regeneração concisa e passar
    const cycleRes = await runNarrativeCycle({
      playerInput: 'Construa paliçada ao redor do pátio',
      state,
      observer: { kind: 'PLAYER', observerId: 'player' },
      llm
    });

    const judgment = NarrativeJudge.judge(cycleRes.narrative, cycleRes.context, cycleRes.report);
    assert.equal(judgment.isPass, true);
    assert.equal(judgment.conciseness, true);
    assert(judgment.wordCount <= 85, `Esperado <= 85 palavras, obteve ${judgment.wordCount}`);

    console.log(`  ✅ TEST 5 PASSOU: Ciclo detectou prolixidade, regenerou concisamente (${judgment.wordCount} palavras) e aprovou.`);
  }

  // TEST 6: Fallback Determinístico Seguro em Falha Persistente
  {
    console.log('\n--- TEST 6: Fallback Seguro em Falha Persistente de Regeneração ---');
    const state = createInitialState('Noble Ruler', 'Central Plains');

    // Adaptador sem suporte ao prompt de regeneração (sempre vazando termo mecânico proibido)
    const adapter = new MockAdapter({ id: 'mock', provider: 'mock', model: 'mock', freePolicy: 'free-tier', maxCost: 0, enabled: true });
    adapter.setMode('MECHANICAL_LEAK');

    const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
    (llm as any).adapter = adapter;

    const cycleRes = await runNarrativeCycle({
      playerInput: 'Construa paliçada ao redor do pátio',
      state,
      observer: { kind: 'PLAYER', observerId: 'player' },
      llm
    });

    // Deve ter acionado fallback autoritativo limpo
    assert(cycleRes.narrative.includes('conforme registrado nos livros de ferro') || cycleRes.narrative.includes('obras da fortificação foram iniciadas'));
    const judgment = NarrativeJudge.judge(cycleRes.narrative, cycleRes.context, cycleRes.report);
    assert.equal(judgment.mechanicalSilence, true);
    assert.equal(judgment.conciseness, true);

    console.log('  ✅ TEST 6 PASSOU: Fallback autoritativo seguro acionado com sucesso diante de violações persistentes.');
  }

  // TEST 7: Amostras Reais e Densidade Factual dos 3 Arquétipos
  {
    console.log('\n--- TEST 7: Conformidade de Amostras Reais (Noble Ruler, Landed Knight, Landless) ---');

    const samples = [
      {
        archetype: 'Noble Ruler',
        action: 'DIPLOMACY',
        text: 'A conselheira Mara lacrou a missiva com a cera carmesim de vossa linhagem. O cavaleiro de escol partiu ao galope pelo vale leste antes do cair da noite.'
      },
      {
        archetype: 'Landed Knight',
        action: 'BUILD',
        text: 'Ren posicionou a guarda sobre as ameias superiores. As vigas de freixo foram fincadas no perímetro norte sem qualquer incidente nas fronteiras.'
      },
      {
        archetype: 'Landless',
        action: 'RECRUIT',
        text: 'Oito homens calejados da estrada aceitaram o aço e a prata da companhia. As tendas do acampamento foram reforçadas sob a vigília noturna.'
      }
    ];

    for (const sample of samples) {
      const category = resolveNarrativeCategory(sample.action);
      const budget = ACTION_NARRATIVE_BUDGETS[category];
      const judgment = NarrativeQualityEvaluator.evaluate(sample.text, category);

      assert.equal(judgment.conciseness, true, `Amostra de ${sample.archetype} deve ser concisa`);
      assert.equal(judgment.clicheFree, true, `Amostra de ${sample.archetype} deve ser livre de clichês`);
      assert(judgment.wordCount <= budget.hardMaxWords && judgment.wordCount >= 15,
        `${sample.archetype}: esperado até ${budget.hardMaxWords} palavras (obteve ${judgment.wordCount})`);
    }

    console.log('  ✅ TEST 7 PASSOU: Amostras dos 3 arquétipos validadas na faixa ideal com alta densidade factual.');
  }

  console.log('\n🎉 TODOS OS TESTES DA SUÍTE NAR-002 PASSARAM COM SUCESSO!\n');
}

runTests().catch(err => {
  console.error('❌ Falha na execução da suíte NAR-002:', err);
  process.exit(1);
});

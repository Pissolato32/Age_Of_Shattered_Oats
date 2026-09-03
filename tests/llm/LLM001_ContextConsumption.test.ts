import assert from 'node:assert/strict';
import { UnifiedNarrativeLLM } from '../../src/llm/adapters/UnifiedNarrativeLLM';
import { BaseLLMAdapter } from '../../src/llm/adapters/LLMAdapter';
import { LLMGenerationRequest, LLMGenerationResponse } from '../../src/llm/contracts/LLMContract';
import { NarrativeContext, ObserverProjection } from '../../src/lib/narrativeContracts';
import { runNarrativeCycle } from '../../src/lib/narrativeCycle';
import { createInitialState } from '../../src/engine';
import { MemoryRecord, KnowledgeRecord } from '../../src/memory/contracts';

class SpyingAdapter extends BaseLLMAdapter {
  readonly providerId = 'mock' as const;
  public lastRequest?: LLMGenerationRequest;

  constructor() {
    super({
      id: 'spy-adapter',
      provider: 'mock',
      model: 'spy',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true
    }, 'mock-key');
  }

  async generate(request: LLMGenerationRequest): Promise<LLMGenerationResponse> {
    this.lastRequest = request;
    if (request.responseFormat === 'json') {
      return {
        text: JSON.stringify({
          action: 'INFORMATION',
          confidence: 0.95,
          requiresClarification: false,
          ambiguity: []
        }),
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20, cost: 0, isExplicitFree: true },
        latencyMs: 5,
        modelId: 'spy',
        providerId: 'mock'
      };
    }
    return {
      text: 'O conselheiro consulta os velhos pergaminhos na penumbra da fortaleza.',
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20, cost: 0, isExplicitFree: true },
      latencyMs: 5,
      modelId: 'spy',
      providerId: 'mock'
    };
  }
}

const dummyProjection: ObserverProjection = {
  contractVersion: 1,
  observer: { kind: 'PLAYER', observerId: 'player' },
  scene: {
    locationId: 'grey_keep',
    regionName: 'Central Plains',
    environment: 'Fortaleza de pedra e dependências',
    weather: 'tempo firme e frio',
    season: 'Thawtide'
  },
  actors: [
    { actorId: 'player', name: 'Alden', role: 'Senhor do Feudo', house: 'Valenfort' }
  ],
  relationships: [],
  knownFacts: [],
  recentEvents: [],
  narrativeConstraints: []
};

async function runTests() {
  console.log('🧪 Executando Suíte de Testes: LLM-001 Structured Context Consumption...');

  // TEST 1
  {
    const spy = new SpyingAdapter();
    const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
    (llm as any).adapter = spy;

    const dummyMemory: MemoryRecord = {
      id: 'mem_1',
      ownerId: 'player',
      subjectId: 'Lorde Veyr',
      eventType: 'DIPLOMACY_EVENT',
      description: 'Lorde Veyr recusou o pacto de não agressão.',
      importance: 3,
      tickRegistered: 5,
      decayed: false,
      source: 'OBSERVED',
      tags: ['diplomacy', 'veyr']
    };

    const dummyKnowledge: KnowledgeRecord = {
      id: 'kno_1',
      agentId: 'player',
      factId: 'garrison_strength',
      value: '70 soldados veteranos',
      source: 'DIRECT_OBSERVATION',
      certainty: 'CONFIRMED',
      visibility: 'PUBLIC'
    };

    await llm.interpret({
      playerInput: 'Qual a postura de Veyr?',
      projection: dummyProjection,
      retrievedContext: [dummyMemory, dummyKnowledge]
    });

    assert(spy.lastRequest !== undefined, 'SpyingAdapter should have captured a request');
    const prompt = spy.lastRequest.userPrompt;
    assert(prompt.includes('ENTIDADES E CONTEXTO CONHECIDOS PELO OBSERVADOR:'), 'Prompt should include retrieved entities section');
    assert(prompt.includes('[Memória]: Lorde Veyr recusou o pacto de não agressão. (Sujeito: Lorde Veyr)'), 'Prompt should include memory description');
    assert(prompt.includes('[Conhecimento]: garrison_strength = 70 soldados veteranos'), 'Prompt should include knowledge fact');
    assert(prompt.includes('<PLAYER_INPUT>\nQual a postura de Veyr?\n</PLAYER_INPUT>'), 'Prompt should retain player input');
    console.log('  ✅ TEST 1: UnifiedNarrativeLLM.interpret includes retrievedContext in prompt for disambiguation');
  }

  // TEST 2
  {
    const spy = new SpyingAdapter();
    const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
    (llm as any).adapter = spy;

    await llm.interpret({
      playerInput: 'Inspecionar as muralhas',
      projection: dummyProjection
    });

    assert(spy.lastRequest !== undefined, 'SpyingAdapter should have captured a request');
    const prompt = spy.lastRequest.userPrompt;
    assert(!prompt.includes('ENTIDADES E CONTEXTO CONHECIDOS PELO OBSERVADOR:'), 'Prompt should not include retrieved entities section when empty');
    assert(prompt.includes('<PLAYER_INPUT>\nInspecionar as muralhas\n</PLAYER_INPUT>'), 'Prompt should retain player input');
    console.log('  ✅ TEST 2: UnifiedNarrativeLLM.interpret works cleanly without retrievedContext');
  }

  // TEST 3
  {
    const spy = new SpyingAdapter();
    const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
    (llm as any).adapter = spy;

    const dummyMemory: MemoryRecord = {
      id: 'mem_2',
      ownerId: 'player',
      subjectId: 'grain_caravan',
      eventType: 'MILITARY_EVENT',
      description: 'A caravana de trigo vinda do sul foi atacada há dois invernos.',
      importance: 2,
      tickRegistered: 8,
      decayed: false,
      source: 'OBSERVED',
      tags: ['food', 'caravan']
    };

    const dummyKnowledge: KnowledgeRecord = {
      id: 'kno_2',
      agentId: 'player',
      factId: 'granary_reserves',
      value: '10 fardos de centeio',
      source: 'DIRECT_OBSERVATION',
      certainty: 'CONFIRMED',
      visibility: 'PUBLIC'
    };

    const context: NarrativeContext = {
      contractVersion: 1,
      observer: { kind: 'PLAYER', observerId: 'player' },
      scene: dummyProjection.scene,
      actors: dummyProjection.actors,
      relationships: [
        {
          relationshipId: 'rel_valenfort_veyr',
          sourceActorId: 'Valenfort',
          targetActorId: 'Veyr',
          knownOpinion: -2
        }
      ],
      knownFacts: [],
      recentEvents: [],
      executionResult: {
        contractVersion: 1,
        commandId: 'cmd_1',
        actionExecuted: 'INFORMATION',
        status: 'ACCEPTED',
        magnitude: { value: 0, source: 'ENGINE_CALCULATED' },
        stateChanges: []
      },
      narrativeConstraints: [],
      retrievedMemories: [dummyMemory],
      retrievedKnowledge: [dummyKnowledge],
      retrievalStatus: 'FOUND'
    };

    const text = await llm.narrate(context);
    assert(typeof text === 'string' && text.length > 0, 'Narrative text should be produced');

    assert(spy.lastRequest !== undefined, 'SpyingAdapter should have captured a request');
    const prompt = spy.lastRequest.userPrompt;
    assert(prompt.includes('MEMÓRIA EVOCADA DO OBSERVADOR:'), 'Prompt should include evocative memory block');
    assert(prompt.includes('[Lembrança]: A caravana de trigo vinda do sul foi atacada há dois invernos.'), 'Prompt should include memory description');
    assert(prompt.includes('CONHECIMENTO ESTABELECIDO:'), 'Prompt should include established knowledge block');
    assert(prompt.includes('[Fato Registrado]: granary_reserves: 10 fardos de centeio'), 'Prompt should include knowledge fact');
    assert(prompt.includes('RELAÇÕES POLÍTICAS CONHECIDAS:'), 'Prompt should include political relationship block');
    assert(prompt.includes('Relação com Veyr: postura/opinião -2'), 'Prompt should include opinion');

    const sys = spy.lastRequest.systemPrompt;
    assert(sys.includes('SILÊNCIO MECÂNICO ABSOLUTO:'), 'System prompt should enforce mechanical silence');
    assert(sys.includes('Se houver lembranças ou memórias evocadas do observador'), 'System prompt should instruct sobre diegetic memories');
    console.log('  ✅ TEST 3: UnifiedNarrativeLLM.narrate incorporates retrievedMemories and retrievedKnowledge preserving Mechanical Silence');
  }

  // TEST 4
  {
    const spy = new SpyingAdapter();
    const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
    (llm as any).adapter = spy;

    const state = createInitialState('Noble Ruler', 'Central Plains');
    state.memoryStores = {
      memories: [
        {
          id: 'mem_stored_1',
          ownerId: 'player',
          subjectId: 'Grey Keep',
          eventType: 'POLITICAL_EVENT',
          description: 'O arauto de Grey Keep anunciou a posse das terras.',
          importance: 3,
          tickRegistered: 1,
          decayed: false,
          source: 'OBSERVED',
          tags: ['intro', 'domain']
        }
      ],
      knowledge: [
        {
          id: 'kno_stored_1',
          agentId: 'player',
          factId: 'vassal_loyalty',
          value: 'inabalável',
          source: 'DIRECT_OBSERVATION',
          certainty: 'CONFIRMED',
          visibility: 'PUBLIC'
        }
      ]
    };

    const result = await runNarrativeCycle({
      playerInput: 'Qual a situação do domínio?',
      state,
      observer: { kind: 'PLAYER', observerId: 'player' },
      llm
    });

    assert(result.command !== undefined, 'Command should be resolved');
    assert(result.context !== undefined, 'Context should be constructed');
    assert(result.context.retrievedMemories !== undefined, 'Retrieved memories should be defined');
    assert(result.context.retrievedMemories.length > 0, 'Retrieved memories should have items');
    assert.strictEqual(result.context.retrievedMemories[0].description, 'O arauto de Grey Keep anunciou a posse das terras.');
    assert(result.context.retrievedKnowledge !== undefined, 'Retrieved knowledge should be defined');
    assert(result.context.retrievedKnowledge.length > 0, 'Retrieved knowledge should have items');
    assert.strictEqual(result.context.retrievalStatus, 'FOUND');
    console.log('  ✅ TEST 4: runNarrativeCycle orchestrates retrieval from state.memoryStores and delivers to both interpret and narrate');
  }

  console.log('🎉 LLM001_ContextConsumption.test.ts: TODOS OS 4 TESTES PASSARAM COM SUCESSO!\n');
}

runTests().catch(err => {
  console.error('❌ Falha na execução dos testes:', err);
  process.exit(1);
});

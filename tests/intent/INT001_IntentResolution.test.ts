import assert from 'node:assert/strict';
import { CampaignState } from '../../src/types';
import { NarrativeContext, NarrativeCommand, ObserverProjection } from '../../src/lib/narrativeContracts';
import { runNarrativeCycle } from '../../src/lib/narrativeCycle';
import { UnifiedNarrativeLLM } from '../../src/llm/adapters/UnifiedNarrativeLLM';
import { BaseLLMAdapter } from '../../src/llm/adapters/LLMAdapter';
import { LLMGenerationRequest, LLMGenerationResponse } from '../../src/llm/contracts/LLMContract';
import {
  hasPendingClarification,
  getPendingClarification,
  createPendingClarification,
  setPendingClarification,
  buildClarificationContext,
  clearPendingClarification,
  isNewActionIntentOrCancel
} from '../../src/lib/clarificationManager';
import { interpretIntentHeuristically } from '../../src/lib/intentHeuristics';

// Mock Adapter configurável para testar intenção e clarificação
class ConfigurableMockAdapter extends BaseLLMAdapter {
  readonly providerId = 'mock' as const;
  public nextIntentResponse?: Partial<NarrativeCommand>;
  public nextNarrativeText: string = 'O vento sopra frio sobre as ameias de pedra.';
  public lastRequest?: LLMGenerationRequest;

  constructor() {
    super({
      id: 'mock-test',
      provider: 'mock',
      model: 'mock',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true
    }, 'mock-key');
  }

  async generate(request: LLMGenerationRequest): Promise<LLMGenerationResponse> {
    this.lastRequest = request;

    if (request.responseFormat === 'json') {
      if (this.nextIntentResponse) {
        return {
          text: JSON.stringify(this.nextIntentResponse),
          usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20, cost: 0, isExplicitFree: true },
          latencyMs: 5,
          modelId: 'mock-llm',
          providerId: 'mock'
        };
      }

      // Default mock interpretation based on heuristics
      const isClarificationPrompt = request.userPrompt.includes('CONTEXTO DA SESSÃO DE ESCLARECIMENTO');
      let cmd: NarrativeCommand;

      if (isClarificationPrompt) {
        const origMatch = request.userPrompt.match(/ORIGINAL DO JOGADOR:\s*"([^"]+)"/i);
        const actionMatch = request.userPrompt.match(/INTENÇÃO PROPOSTA:\s*([A-Z_]+)/i);
        const qMatch = request.userPrompt.match(/PERGUNTA DO MESTRE:\s*"([^"]+)"/i);
        const ansMatch = request.userPrompt.match(/RESPOSTA DO JOGADOR:\s*"([^"]+)"/i);
        const optMatch = request.userPrompt.match(/OPÇÃO SELECIONADA:\s*([^\n\r]+)/i);

        cmd = interpretIntentHeuristically(ansMatch ? ansMatch[1] : '', {
          originalInput: origMatch ? origMatch[1] : '',
          proposedCommand: {
            contractVersion: 1,
            commandId: 'cmd_test',
            actorId: 'player',
            action: (actionMatch ? actionMatch[1] : 'UNKNOWN') as any,
            constraints: [],
            confidence: 0.8,
            ambiguity: [],
            requiresClarification: true
          },
          masterQuestion: qMatch ? qMatch[1] : '',
          playerAnswer: ansMatch ? ansMatch[1] : '',
          selectedOption: optMatch ? optMatch[1].trim() : undefined
        });
      } else {
        const playerInputMatch = request.userPrompt.match(/<PLAYER_INPUT>([\s\S]*?)<\/PLAYER_INPUT>/i);
        cmd = interpretIntentHeuristically(playerInputMatch ? playerInputMatch[1].trim() : '');
      }

      return {
        text: JSON.stringify({
          action: cmd.action,
          targetId: cmd.targetId || null,
          objectId: cmd.objectId || null,
          locationId: cmd.locationId || null,
          magnitude: cmd.magnitude || null,
          stance: cmd.stance || 'NEUTRAL',
          desiredOutcome: cmd.desiredOutcome || null,
          confidence: cmd.confidence,
          requiresClarification: cmd.requiresClarification,
          ambiguity: cmd.ambiguity
        }),
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20, cost: 0, isExplicitFree: true },
        latencyMs: 5,
        modelId: 'mock-llm',
        providerId: 'mock'
      };
    }

    return {
      text: this.nextNarrativeText,
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20, cost: 0, isExplicitFree: true },
      latencyMs: 5,
      modelId: 'mock-llm',
      providerId: 'mock'
    };
  }
}

import { createInitialState } from '../../src/engine';

function createBaseState(): CampaignState {
  return createInitialState('Landed Knight', 'Central Plains');
}

async function runTests() {
  console.log('🧪 Iniciando Suíte de Testes INT-001 (Resolução de Intenção e Clarificação)...\n');

  // TEST 1: Classificação precisa de comandos canônicos claros
  {
    console.log('--- TEST 1: Classificação de Comandos Canônicos Claros ---');
    const adapter = new ConfigurableMockAdapter();
    const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
    (llm as any).adapter = adapter;

    const state = createBaseState();

    // 1.1 RECRUIT
    const resRecruit = await runNarrativeCycle({
      playerInput: 'Recrute 5 soldados para a guarnição',
      state,
      observer: { kind: 'PLAYER', observerId: 'player' },
      llm
    });
    assert.equal(resRecruit.command.action, 'RECRUIT');
    assert.equal(resRecruit.command.requiresClarification, false);
    assert.equal(resRecruit.command.magnitude?.value, 5);

    // 1.2 BUILD
    const resBuild = await runNarrativeCycle({
      playerInput: 'Construa paliçada no desfiladeiro',
      state,
      observer: { kind: 'PLAYER', observerId: 'player' },
      llm
    });
    assert.equal(resBuild.command.action, 'BUILD');
    assert.equal(resBuild.command.requiresClarification, false);
    assert.equal(resBuild.command.objectId, 'palisade');
    assert.equal(resBuild.command.locationId, 'desfiladeiro');

    // 1.3 TRAVEL
    const resTravel = await runNarrativeCycle({
      playerInput: 'Viaje para Ironpeak com os batedores',
      state,
      observer: { kind: 'PLAYER', observerId: 'player' },
      llm
    });
    assert.equal(resTravel.command.action, 'TRAVEL');
    assert.equal(resTravel.command.requiresClarification, false);
    assert.equal(resTravel.command.targetId, 'Ironpeak');

    console.log('  ✅ TEST 1 PASSOU: Comandos canônicos claros classificados com parâmetros corretos.');
  }

  // TEST 2: Consultas informativas (INFORMATION) nunca mutam recursos
  {
    console.log('\n--- TEST 2: Consultas Informativas (INFORMATION) e Imutabilidade ---');
    const adapter = new ConfigurableMockAdapter();
    const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
    (llm as any).adapter = adapter;

    const state = createBaseState();
    const initialSilverdew = state.weeklyLedger.silverdew;
    const initialFood = state.weeklyLedger.food;
    const initialTimber = state.weeklyLedger.materials.timber;

    // 2.1 Consulta a conselheiro
    const resMara = await runNarrativeCycle({
      playerInput: 'Mara, quanto trigo temos nos celeiros?',
      state,
      observer: { kind: 'PLAYER', observerId: 'player' },
      llm
    });
    assert.equal(resMara.command.action, 'INFORMATION');
    assert.equal(resMara.command.requiresClarification, false);
    assert.equal(resMara.report.status, 'ACCEPTED');
    assert.equal(resMara.resultState.weeklyLedger.silverdew, initialSilverdew);
    assert.equal(resMara.resultState.weeklyLedger.food, initialFood);
    assert.equal(resMara.resultState.weeklyLedger.materials.timber, initialTimber);

    // 2.2 Inspeção da guarnição
    const resRen = await runNarrativeCycle({
      playerInput: 'Ren, inspecione a prontidão das sentinelas na muralha',
      state,
      observer: { kind: 'PLAYER', observerId: 'player' },
      llm
    });
    assert.equal(resRen.command.action, 'INFORMATION');
    assert.equal(resRen.command.requiresClarification, false);
    assert.equal(resRen.report.status, 'ACCEPTED');
    assert.equal(resRen.resultState.weeklyLedger.silverdew, initialSilverdew);

    console.log('  ✅ TEST 2 PASSOU: Comandos INFORMATION classificados sem produzir efeitos colaterais materiais.');
  }

  // TEST 3: Detecção de Ambiguidade e Criação de Clarificação (Round 1)
  {
    console.log('\n--- TEST 3: Detecção de Ambiguidade e Loop de Clarificação ---');
    const adapter = new ConfigurableMockAdapter();
    const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
    (llm as any).adapter = adapter;

    const state = createBaseState();
    const initialSilverdew = state.weeklyLedger.silverdew;

    // Comando vago sem local/alvo obrigatório
    const resAmbiguous = await runNarrativeCycle({
      playerInput: 'Construa defesas',
      state,
      observer: { kind: 'PLAYER', observerId: 'player' },
      llm
    });

    assert.equal(resAmbiguous.command.action, 'BUILD');
    assert.equal(resAmbiguous.command.requiresClarification, true);
    assert.equal(resAmbiguous.report.status, 'REJECTED');
    // Verificação de imutabilidade mecânica durante comando ambíguo
    assert.equal(resAmbiguous.resultState.weeklyLedger.silverdew, initialSilverdew);

    // Criação de PendingClarification
    const pending = createPendingClarification(
      'Construa defesas',
      resAmbiguous.command,
      'Onde deseja erguer tais fortificações, meu senhor?',
      undefined,
      1
    );
    assert.notEqual(pending, null);
    assert.equal(pending?.round, 1);

    const stateWithPending = setPendingClarification(state, pending!);
    assert.equal(hasPendingClarification(stateWithPending), true);
    assert.equal(getPendingClarification(stateWithPending)?.round, 1);

    console.log('  ✅ TEST 3 PASSOU: Ambiguidade detectada, PendingClarification criado e zero mutação mecânica.');
  }

  // TEST 4: Resolução de Esclarecimento no Round 1 (Recomposição)
  {
    console.log('\n--- TEST 4: Resolução no Round 1 com Recomposição ---');
    const adapter = new ConfigurableMockAdapter();
    const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
    (llm as any).adapter = adapter;

    const state = createBaseState();
    const initialPending = createPendingClarification(
      'Construa defesas',
      {
        contractVersion: 1,
        commandId: 'cmd_orig',
        actorId: 'player',
        action: 'BUILD',
        constraints: [],
        confidence: 0.5,
        ambiguity: ['locationId'],
        requiresClarification: true
      },
      'Em qual setor?',
      undefined,
      1
    )!;

    const clarificationContext = buildClarificationContext(
      initialPending,
      'Na velha ponte de pedra'
    );

    const resResolved = await runNarrativeCycle({
      playerInput: 'Na velha ponte de pedra',
      state,
      observer: { kind: 'PLAYER', observerId: 'player' },
      llm,
      clarificationContext
    });

    assert.equal(resResolved.command.action, 'BUILD');
    assert.equal(resResolved.command.requiresClarification, false);
    assert.equal(resResolved.command.locationId, 'velha ponte de pedra');
    assert.equal(resResolved.clarificationTrace.resolution, 'RESOLVED');

    const cleanState = clearPendingClarification(resResolved.resultState);
    assert.equal(hasPendingClarification(cleanState), false);

    console.log('  ✅ TEST 4 PASSOU: Resposta de esclarecimento recompôs a ação pretendida (BUILD + location).');
  }

  // TEST 5: Prevenção de Drift de Ação durante Esclarecimento
  {
    console.log('\n--- TEST 5: Prevenção de Drift de Ação durante Esclarecimento ---');
    const adapter = new ConfigurableMockAdapter();
    // Simula o LLM tentando desviar a ação de BUILD para TRADE arbitrariamente
    adapter.nextIntentResponse = {
      action: 'TRADE',
      confidence: 0.9,
      requiresClarification: false,
      ambiguity: []
    };
    const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
    (llm as any).adapter = adapter;

    const state = createBaseState();
    const initialPending = createPendingClarification(
      'Construa defesas',
      {
        contractVersion: 1,
        commandId: 'cmd_orig',
        actorId: 'player',
        action: 'BUILD',
        constraints: [],
        confidence: 0.5,
        ambiguity: ['locationId'],
        requiresClarification: true
      },
      'Em qual setor?',
      undefined,
      1
    )!;

    const clarificationContext = buildClarificationContext(
      initialPending,
      'Talvez devêssemos comprar trigo no mercado'
    );

    const resDrift = await runNarrativeCycle({
      playerInput: 'Talvez devêssemos comprar trigo no mercado',
      state,
      observer: { kind: 'PLAYER', observerId: 'player' },
      llm,
      clarificationContext
    });

    // O Drift Guard deve forçar UNKNOWN e impedir a mutação arbitrária de comércio
    assert.equal(resDrift.command.action, 'UNKNOWN');
    assert.equal(resDrift.command.requiresClarification, false);
    assert.equal(resDrift.report.status, 'REJECTED');

    console.log('  ✅ TEST 5 PASSOU: Drift Guard interceptou a divergência de ação e forçou UNKNOWN com segurança.');
  }

  // TEST 6: Esgotamento no Round 2 (Fail-Safe: UNKNOWN com ZERO Mutação)
  {
    console.log('\n--- TEST 6: Esgotamento no Round 2 e Fallback UNKNOWN Seguro ---');
    const adapter = new ConfigurableMockAdapter();
    const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
    (llm as any).adapter = adapter;

    const state = createBaseState();
    const initialSilverdew = state.weeklyLedger.silverdew;
    const initialFood = state.weeklyLedger.food;
    const initialTimber = state.weeklyLedger.materials.timber;

    // Pending no Round 2
    const round2Pending = createPendingClarification(
      'Construa defesas',
      {
        contractVersion: 1,
        commandId: 'cmd_orig_2',
        actorId: 'player',
        action: 'BUILD',
        constraints: [],
        confidence: 0.5,
        ambiguity: ['locationId'],
        requiresClarification: true
      },
      'Ainda precisamos saber onde erguer as defesas.',
      undefined,
      2
    )!;

    const clarificationContext = buildClarificationContext(
      round2Pending,
      'Sim, aquilo' // Resposta vaga que não resolve
    );

    const resExhausted = await runNarrativeCycle({
      playerInput: 'Sim, aquilo',
      state,
      observer: { kind: 'PLAYER', observerId: 'player' },
      llm,
      clarificationContext
    });

    // Verificação da Regra Contratual Rígida de INT-001:
    // Round 2 não resolvido deve finalizar como UNKNOWN (falha de resolução),
    // NÃO como tentativa de interpretar livremente a resposta como novo comando independente.
    assert.equal(resExhausted.command.action, 'UNKNOWN');
    assert.equal(resExhausted.command.requiresClarification, false);
    assert.equal(resExhausted.report.status, 'REJECTED');
    assert.equal(resExhausted.clarificationTrace.resolution, 'EXHAUSTED');

    // Imutabilidade mecânica estrita:
    assert.equal(resExhausted.resultState.weeklyLedger.silverdew, initialSilverdew);
    assert.equal(resExhausted.resultState.weeklyLedger.food, initialFood);
    assert.equal(resExhausted.resultState.weeklyLedger.materials.timber, initialTimber);

    const finalState = clearPendingClarification(resExhausted.resultState);
    assert.equal(hasPendingClarification(finalState), false);

    console.log('  ✅ TEST 6 PASSOU: Esgotamento no Round 2 encerrou com UNKNOWN, PendingClarification limpo e zero mutação material.');
  }

  // TEST 7: Pivot de Intenção e Cancelamento durante Esclarecimento
  {
    console.log('\n--- TEST 7: Pivot de Intenção e Cancelamento durante Esclarecimento ---');
    // 1. Resposta de parâmetro não deve pivotar
    assert.equal(isNewActionIntentOrCancel('Na velha ponte de pedra', 'BUILD'), false);
    assert.equal(isNewActionIntentOrCancel('10 soldados', 'RECRUIT'), false);
    assert.equal(isNewActionIntentOrCancel('Opção 1', 'BUILD', 'opt-1'), false);

    // 2. Cancelamento explícito deve pivotar
    assert.equal(isNewActionIntentOrCancel('Cancelar', 'BUILD'), true);
    assert.equal(isNewActionIntentOrCancel('Esquece, não faça nada', 'RECRUIT'), true);
    assert.equal(isNewActionIntentOrCancel('Mudei de ideia', 'TRADE'), true);

    // 3. Novo comando com ação diferente deve pivotar
    assert.equal(
      isNewActionIntentOrCancel('Quero enviar uma mensagem à Casa Blackthorn propondo uma trégua', 'RECRUIT'),
      true
    );
    assert.equal(
      isNewActionIntentOrCancel('Construir uma paliçada nas muralhas', 'ESPIONAGE'),
      true
    );
    assert.equal(
      isNewActionIntentOrCancel('Inspecionar a prontidão dos celeiros', 'BUILD'),
      true
    );

    // 4. Se a ação mencionada for da mesma família, não pivota (continua resolvendo o parâmetro)
    assert.equal(
      isNewActionIntentOrCancel('Construir na velha ponte', 'BUILD'),
      false
    );

    console.log('  ✅ TEST 7 PASSOU: Pivot de intenção e cancelamentos detectados corretamente sem colisão de drift.');
  }

  console.log('\n🎉 TODOS OS TESTES DA SUÍTE INT-001 PASSARAM COM SUCESSO!\n');
}

runTests().catch(err => {
  console.error('❌ Falha na execução da suíte INT-001:', err);
  process.exit(1);
});

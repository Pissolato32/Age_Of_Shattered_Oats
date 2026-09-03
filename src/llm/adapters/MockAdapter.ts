import {
  LLMGenerationRequest,
  LLMGenerationResponse,
  ModelConfig
} from '../contracts/LLMContract';
import { BaseLLMAdapter } from './LLMAdapter';
import { BillingGuard } from '../validators/BillingGuard';
import { interpretIntentHeuristically } from '../../lib/intentHeuristics';

export type MockBehaviorMode =
  | 'CORRECT'
  | 'HALLUCINATED_CHARACTER'
  | 'DEAD_CHARACTER'
  | 'INVALID_JSON'
  | 'INVALID_SCHEMA'
  | 'WRONG_INTENT'
  | 'MECHANICAL_LEAK'
  | 'CLAIM_VICTORY_ON_LOSS'
  | 'TEMPORAL_LEAP'
  | 'FABRICATED_EXCUSE'
  | 'FABRICATED_FOG'
  | 'SYNTHETIC_MEMORY'
  | 'PROLIX_OUTPUT'
  | 'CLICHE_PREAMBLE';

export class MockAdapter extends BaseLLMAdapter {
  readonly providerId = 'mock' as const;
  private mode: MockBehaviorMode;

  constructor(
    modelConfig: ModelConfig = {
      id: 'mock-model-1',
      provider: 'mock',
      model: 'mock-deterministic',
      freePolicy: 'free-tier',
      maxCost: 0,
      enabled: true
    },
    mode: MockBehaviorMode = 'CORRECT'
  ) {
    super(modelConfig, 'mock-key');
    this.mode = mode;
  }

  public setMode(mode: MockBehaviorMode): void {
    this.mode = mode;
  }

  async generate(request: LLMGenerationRequest): Promise<LLMGenerationResponse> {
    const startTime = Date.now();
    const playerInputMatch = request.userPrompt.match(/<PLAYER_INPUT>([\s\S]*?)<\/PLAYER_INPUT>/i);

    let text = '';

    const isClarificationPrompt = request.userPrompt.includes('CONTEXTO DA SESSÃO DE ESCLARECIMENTO');

    // INTENT INTERPRETATION MODE (JSON)
    if ((playerInputMatch || isClarificationPrompt) && request.responseFormat === 'json') {
      const inputStr = playerInputMatch ? playerInputMatch[1].trim() : '';

      switch (this.mode) {
        case 'INVALID_JSON':
          text = `{"action": "RECRUIT", "incomplete_json: true`;
          break;

        case 'INVALID_SCHEMA':
          text = JSON.stringify({
            act: 'SOMETHING_INVALID',
            diceRoll: 18,
            casualties: 3
          });
          break;

        case 'WRONG_INTENT':
          text = JSON.stringify({
            action: 'TRADE',
            confidence: 0.95,
            requiresClarification: false
          });
          break;

        case 'DEAD_CHARACTER':
          text = JSON.stringify({
            action: 'MILITARY',
            targetId: 'General Morr',
            confidence: 0.95,
            requiresClarification: false
          });
          break;

        case 'HALLUCINATED_CHARACTER':
          text = JSON.stringify({
            action: 'DIPLOMACY',
            targetId: 'Lord Fictional Nonexistent Dragon King',
            confidence: 0.95,
            requiresClarification: false
          });
          break;

        case 'CORRECT':
        default: {
          let cmd;
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
                commandId: 'cmd_clarification',
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
            cmd = interpretIntentHeuristically(inputStr);
          }

          text = JSON.stringify({
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
          });
          break;
        }
      }
    } else {
      // NARRATIVE MODE
      if (this.mode === 'MECHANICAL_LEAK') {
        text = `As sentinelas registraram a perda de 50 SD. O teste de DC 15 rolou 18 com roll e status ACCEPTED.`;
      } else if (request.userPrompt.includes('REGENERAÇÃO CONCISA:')) {
        text = 'Os intendentes registraram as obras concluídas nos livros de ferro da fortaleza sem novos incidentes.';
      } else {
        switch (this.mode) {
          case 'CLAIM_VICTORY_ON_LOSS':
            text = `Construímos com sucesso todas as fortificações e os novos soldados contratados marchamos triunfantes com ouro recebido.`;
            break;

          case 'TEMPORAL_LEAP':
            text = `O mensageiro cavalgou veloz e chegou à corte do castelo vizinho, onde um banquete foi servido e o tratado assinado com celebração imediata.`;
            break;

          case 'FABRICATED_EXCUSE':
            text = `A ordem não foi cumprida pelas sentinelas pois os soldados estavam exaustos demais após dias de frio.`;
            break;

          case 'FABRICATED_FOG':
            text = `Os batedores inspecionam o horizonte e relatam tropas inimigas avistadas com quinhentos lanceiros acampados junto ao desfiladeiro.`;
            break;

          case 'SYNTHETIC_MEMORY':
            text = `Vós vos lembrais com clareza de como vossos ancestrais ergueram estas mesmas muralhas sob juramento de sangue com os reis antigos.`;
            break;

          case 'PROLIX_OUTPUT':
            text = 'O reino estende-se vasto pelas colinas intermináveis de Grey Keep enquanto os senhores de terras distantes observam com cautela redobrada as decisões emanadas da corte principal. Os homens de armas, endurecidos por incontáveis invernos rigorosos e batalhas sangrentas no desfiladeiro cinzento, reúnem-se no pátio lamacento para discutir as ordens recebidas dos conselheiros que ainda guardam o peso dos velhos juramentos solenes de lealdade eterna à coroa desfeita, esperando que as fundações de madeira e pedra resistam ao cerco futuro dos bárbaros e das casas rivais que marcham em segredo sob a névoa fria da manhã sombria que nunca parece terminar nestas terras abandonadas pelos deuses antigos.';
            break;

          case 'CLICHE_PREAMBLE':
            text = 'O vento gélido sopra contra as muralhas da fortaleza enquanto a guarnição vigia o fosso sob a geada.';
            break;

          case 'CORRECT':
          default:
            text = `Os batedores retornam das brumas de Grey Keep. A sentinela da torre norte avista patrulhas nas colinas e os homens mantêm vigília.`;
            break;
        }
      }
    }

    const usage = BillingGuard.buildUsage({
      promptTokens: Math.ceil(request.userPrompt.length / 4),
      completionTokens: Math.ceil(text.length / 4),
      cost: 0,
      isExplicitFree: true
    });

    return {
      text,
      usage,
      latencyMs: Date.now() - startTime + 5,
      modelId: this.modelConfig.model,
      providerId: 'mock'
    };
  }
}

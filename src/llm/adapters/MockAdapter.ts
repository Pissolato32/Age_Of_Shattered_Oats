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
  | 'CLAIM_VICTORY_ON_LOSS';

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

    // INTENT INTERPRETATION MODE (JSON)
    if (playerInputMatch && request.responseFormat === 'json') {
      const inputStr = playerInputMatch[1].trim();

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
          const cmd = interpretIntentHeuristically(inputStr);
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
      switch (this.mode) {
        case 'MECHANICAL_LEAK':
          text = `As sentinelas registraram a perda de 50 SD. O teste de DC 15 rolou 18 com roll e status ACCEPTED.`;
          break;

        case 'CLAIM_VICTORY_ON_LOSS':
          text = `Construímos com sucesso todas as fortificações e os novos soldados contratados marchamos triunfantes com ouro recebido.`;
          break;

        case 'CORRECT':
        default:
          text = `Os batedores retornam das brumas de Grey Keep. O vento açoita as ameias da fortaleza enquanto os homens de armas mantêm a vigília em silêncio sob a geada de inverno.`;
          break;
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

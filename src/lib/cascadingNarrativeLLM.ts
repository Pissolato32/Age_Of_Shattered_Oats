import { NarrativeLLM, InterpretInput } from './narrativeLLM';
import { NarrativeContext, NarrativeCommand } from './narrativeContracts';
import {
  IncidentNarrativeRequest,
  IncidentNarrativeResponse
} from '../domain/events/narrative/IncidentNarrativeContracts';
import { UnifiedNarrativeLLM } from '../llm/adapters/UnifiedNarrativeLLM';
import { MockNarrativeLLM } from './mockNarrativeLLM';
import { ModelRegistry, LLMTask } from '../llm/registry/ModelRegistry';
import { BillingMode } from '../llm/validators/BillingGuard';

export interface CascadingProvidersConfig {
  readonly billingMode?: BillingMode;
  readonly geminiApiKey?: string;
  readonly openCodeApiKey?: string;
  readonly openRouterApiKey?: string;
}

/**
 * Adaptive Capability-Based Narrative LLM
 * Dynamically routes tasks (Interpreter vs Narrator) to the highest-performing
 * verified-free active models using the ModelRegistry, with zero-interruption fallback to Mock.
 */
export class CascadingNarrativeLLM implements NarrativeLLM {
  readonly providerId = 'adaptive-capability-router';
  readonly modelId = 'multi-task-free-pool';
  private readonly registry: ModelRegistry;
  private readonly billingMode: BillingMode;

  constructor(config: CascadingProvidersConfig = {}) {
    this.registry = new ModelRegistry();
    this.billingMode = config.billingMode || 'free-tier';
  }

  private createInstanceForTask(task: LLMTask): UnifiedNarrativeLLM {
    const modelConfig = this.registry.resolveModelForTask(task, this.billingMode);
    const apiKey = ModelRegistry.resolveApiKey(modelConfig.provider);

    return new UnifiedNarrativeLLM({
      provider: modelConfig.provider,
      apiKey,
      modelConfig,
      billingMode: this.billingMode
    });
  }

  async interpret(input: InterpretInput): Promise<NarrativeCommand> {
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const instance = this.createInstanceForTask('INTERPRET_INTENT');
      try {
        const cmd = await instance.interpret(input);
        if (cmd && cmd.action !== 'UNKNOWN') {
          return cmd;
        }
      } catch (err: any) {
        const msg = String(err?.message || err).toLowerCase();
        if (msg.includes('429') || msg.includes('rate limit')) {
          this.registry.markRateLimited(instance.modelId || 'unknown-model');
        } else if (msg.includes('404') || msg.includes('not found') || msg.includes('retired')) {
          this.registry.markUnavailable(instance.modelId || 'unknown-model');
        }
        console.warn(`[CascadingNarrativeLLM.interpret] Falha em ${instance.providerId}/${instance.modelId}, tentando próximo:`, err?.message || err);
      }
    }

    const mock = new MockNarrativeLLM();
    return mock.interpret(input);
  }

  async narrate(context: NarrativeContext): Promise<string> {
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const instance = this.createInstanceForTask('NARRATE_EXECUTION');
      try {
        const result = await instance.narrate(context);
        if (result && result.trim().length > 0) {
          return result;
        }
      } catch (err: any) {
        const msg = String(err?.message || err).toLowerCase();
        if (msg.includes('429') || msg.includes('rate limit')) {
          this.registry.markRateLimited(instance.modelId || 'unknown-model');
        } else if (msg.includes('404') || msg.includes('not found') || msg.includes('retired')) {
          this.registry.markUnavailable(instance.modelId || 'unknown-model');
        }
        console.warn(`[CascadingNarrativeLLM.narrate] Falha em ${instance.providerId}/${instance.modelId}, tentando próximo:`, err?.message || err);
      }
    }

    const mock = new MockNarrativeLLM();
    return mock.narrate(context);
  }

  async narrateIncident(request: IncidentNarrativeRequest): Promise<IncidentNarrativeResponse> {
    const mock = new MockNarrativeLLM();
    return mock.narrateIncident(request);
  }
}

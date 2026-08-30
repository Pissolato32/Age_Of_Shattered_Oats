export type LLMProviderId = 'gemini' | 'openrouter' | 'huggingface' | 'opencode' | 'mock';

export type FreePolicy = 'explicit-free' | 'free-tier';

export interface ModelConfig {
  readonly id: string;
  readonly provider: LLMProviderId;
  readonly model: string;
  readonly freePolicy: FreePolicy;
  readonly maxCost: number;
  readonly enabled: boolean;
  readonly fallbackModels?: readonly string[];
  readonly customBaseURL?: string;
}

export interface ModelRegistryConfig {
  readonly version: string;
  readonly description: string;
  readonly models: readonly ModelConfig[];
}

export interface LLMUsage {
  readonly promptTokens?: number;
  readonly completionTokens?: number;
  readonly totalTokens?: number;
  readonly cost?: number;
  readonly verifiedFree: boolean;
  readonly costStatus: 'VERIFIED_ZERO' | 'NON_ZERO_BLOCKED' | 'COST_UNVERIFIED';
}

export interface LLMGenerationRequest {
  readonly systemPrompt?: string;
  readonly userPrompt: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly responseFormat?: 'text' | 'json';
  readonly timeoutMs?: number;
}

export interface LLMGenerationResponse {
  readonly text: string;
  readonly usage: LLMUsage;
  readonly latencyMs: number;
  readonly modelId: string;
  readonly providerId: LLMProviderId;
  readonly inferenceProvider?: string;
  readonly rawResponse?: unknown;
}

export interface QualificationResult {
  readonly provider: LLMProviderId;
  readonly model: string;
  readonly requests: number;
  readonly successful: number;
  readonly jsonValid: number;
  readonly schemaValid: number;
  readonly cost: number;
  readonly avgLatencyMs: number;
  readonly qualified: boolean;
  readonly errorDetails?: readonly string[];
}

export interface RequestTelemetryArtifact {
  readonly runId: string;
  readonly scenarioId: string;
  readonly category: string;
  readonly condition: string;
  readonly provider: LLMProviderId;
  readonly model: string;
  readonly promptVersion: string;
  readonly schemaVersion: string;
  readonly latencyMs: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly jsonValid: boolean;
  readonly schemaValid: boolean;
  readonly semanticValid: boolean;
  readonly engineSafe: boolean;
  readonly firstPassAccepted: boolean;
  readonly mechanicalSilence: boolean;
  readonly hallucination: boolean;
  readonly narrativeScore: number;
  readonly cost: number;
  readonly attempt: number;
  readonly retryReason?: string;
  readonly error?: string;
}

export interface ProviderBenchmarkSummary {
  readonly provider: LLMProviderId;
  readonly model: string;
  readonly totalRequests: number;
  readonly successfulRequests: number;
  readonly jsonValidRate: number;
  readonly schemaValidRate: number;
  readonly semanticValidRate: number;
  readonly engineSafeRate: number;
  readonly firstPassAcceptanceRate: number;
  readonly hallucinationRate: number;
  readonly mechanicalSilenceRate: number;
  readonly averageNarrativeScore: number;
  readonly averageLatencyMs: number;
  readonly totalCost: number;
  readonly rateLimitedCount: number;
  readonly timeoutCount: number;
  readonly serverErrorCount: number;
  readonly firstPassCount: number;
  readonly eventualSuccessCount: number;
  readonly qualified: boolean;
  readonly status: 'PASS' | 'WARN' | 'FAIL';
}

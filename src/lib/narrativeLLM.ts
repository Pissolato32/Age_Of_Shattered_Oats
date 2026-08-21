import { NarrativeCommand, NarrativeContext, ObserverProjection } from './narrativeContracts';

export interface InterpretInput {
  readonly playerInput: string;
  readonly projection: ObserverProjection;
}

export interface NarrativeLLM {
  readonly providerId: string;
  readonly modelId: string;
  interpret(input: InterpretInput): Promise<NarrativeCommand>;
  narrate(context: NarrativeContext): Promise<string>;
}

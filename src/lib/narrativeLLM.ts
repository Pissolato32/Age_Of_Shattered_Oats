import { NarrativeCommand, NarrativeContext, ObserverProjection } from './narrativeContracts';
import {
  IncidentNarrativeRequest,
  IncidentNarrativeResponse
} from '../domain/events/narrative/IncidentNarrativeContracts';

export interface InterpretInput {
  readonly playerInput: string;
  readonly projection: ObserverProjection;
}

export interface NarrativeLLM {
  readonly providerId: string;
  readonly modelId: string;
  interpret(input: InterpretInput): Promise<NarrativeCommand>;
  narrate(context: NarrativeContext): Promise<string>;
  narrateIncident?(request: IncidentNarrativeRequest): Promise<IncidentNarrativeResponse>;
}

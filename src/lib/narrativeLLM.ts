import { NarrativeCommand, NarrativeContext, ObserverProjection } from './narrativeContracts';
import {
  IncidentNarrativeRequest,
  IncidentNarrativeResponse
} from '../domain/events/narrative/IncidentNarrativeContracts';
import { ClarificationContext } from './clarificationContracts';

export interface InterpretInput {
  readonly playerInput: string;
  readonly projection: ObserverProjection;
  /** Present when the player is responding to a clarification question. */
  readonly clarificationContext?: ClarificationContext;
}

export interface NarrativeLLM {
  readonly providerId: string;
  readonly modelId: string;
  interpret(input: InterpretInput): Promise<NarrativeCommand>;
  narrate(context: NarrativeContext): Promise<string>;
  narrateIncident?(request: IncidentNarrativeRequest): Promise<IncidentNarrativeResponse>;
}

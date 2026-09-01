import { NarrativeCommand, NarrativeContext, ObserverProjection } from './narrativeContracts';
import {
  IncidentNarrativeRequest,
  IncidentNarrativeResponse
} from '../domain/events/narrative/IncidentNarrativeContracts';
import { ClarificationContext } from './clarificationContracts';
import type { MemoryRecord, KnowledgeRecord } from '../memory/contracts';

export interface InterpretInput {
  readonly playerInput: string;
  readonly projection: ObserverProjection;
  /** Present when the player is responding to a clarification question. */
  readonly clarificationContext?: ClarificationContext;
  // MEM-004: Retrieved context from memory stores
  readonly retrievedContext?: readonly (MemoryRecord | KnowledgeRecord)[];
}

export interface NarrativeLLM {
  readonly providerId: string;
  readonly modelId: string;
  interpret(input: InterpretInput): Promise<NarrativeCommand>;
  narrate(context: NarrativeContext): Promise<string>;
  narrateIncident?(request: IncidentNarrativeRequest): Promise<IncidentNarrativeResponse>;
}

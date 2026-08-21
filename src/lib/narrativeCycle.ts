import { CampaignState } from '../types';
import {
  ExecutionReport,
  NarrativeCommand,
  NarrativeContext,
  NarrativeObserver,
  ObserverProjection
} from './narrativeContracts';
import { NarrativeLLM } from './narrativeLLM';
import { buildNarrativeContext, buildObserverProjection, resolveNarrativeCommand } from '../engine';
import { SemanticViolation, validateNarrativeConsistency } from './semanticValidation';
import { RandomService } from '../core/RandomService';

export interface NarrativeCycleInput {
  readonly playerInput: string;
  readonly state: CampaignState;
  readonly observer: NarrativeObserver;
  readonly llm: NarrativeLLM;
  readonly rng?: RandomService;
  readonly excludedSecretStatements?: readonly string[];
}

export interface NarrativeCycleResult {
  readonly command: NarrativeCommand;
  readonly report: ExecutionReport;
  readonly projection: ObserverProjection;
  readonly context: NarrativeContext;
  readonly narrative: string;
  readonly validation: readonly SemanticViolation[];
  readonly resultState: CampaignState;
}

export async function runNarrativeCycle(input: NarrativeCycleInput): Promise<NarrativeCycleResult> {
  const initialProjection = buildObserverProjection(input.state, input.observer);

  const command = await input.llm.interpret({
    playerInput: input.playerInput,
    projection: initialProjection
  });

  const resolution = resolveNarrativeCommand(command, input.state, input.rng);
  const resultState = resolution.state;
  const report = resolution.report;

  const resultProjection = buildObserverProjection(resultState, input.observer);
  const context = buildNarrativeContext(resultProjection, report);

  const narrative = await input.llm.narrate(context);

  const validation = validateNarrativeConsistency(report, context, narrative, {
    excludedSecretStatements: input.excludedSecretStatements
  });

  return {
    command,
    report,
    projection: resultProjection,
    context,
    narrative,
    validation,
    resultState
  };
}

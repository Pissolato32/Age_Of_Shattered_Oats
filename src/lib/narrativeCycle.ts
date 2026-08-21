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

export function buildSafeFallbackNarrative(report: ExecutionReport): string {
  if (report.status === 'REJECTED') {
    if (report.reasonCode && report.reasonCode.toLowerCase().includes('esclarecimento')) {
      return 'Antes de qualquer ação, é necessário esclarecimento sobre a ordem solicitada.';
    }
    return `A ordem não foi executada: ${report.reasonCode}`;
  }

  if (report.actionExecuted === 'RECRUIT') {
    const levies = report.stateChanges.find(sc => sc.path === 'army.units.levies')?.delta ?? report.magnitude?.value;
    if (levies !== undefined) {
      return `O recrutamento de ${levies} soldados foi autorizado pelos intendentes da campanha.`;
    }
    return 'O recrutamento foi autorizado conforme os registros do feudo.';
  }

  if (report.actionExecuted === 'BUILD') {
    return 'As obras da fortificação foram iniciadas conforme a ordem registrada nos livros de ferro.';
  }

  return 'A resolução foi selada conforme registrado nos livros de ferro da campanha.';
}

export async function runNarrativeCycle(input: NarrativeCycleInput): Promise<NarrativeCycleResult> {
  const initialProjection = buildObserverProjection(input.state, input.observer);

  console.log(`[NarrativeCycle] 1. Interpretando: "${input.playerInput}"...`);
  const command = await input.llm.interpret({
    playerInput: input.playerInput,
    projection: initialProjection
  });
  console.log(`[NarrativeCycle] -> Comando: ${command.action} (conf: ${command.confidence})`);

  const resolution = resolveNarrativeCommand(command, input.state, input.rng);
  const resultState = resolution.state;
  const report = resolution.report;
  console.log(`[NarrativeCycle] 2. Resolução do Motor: Status ${report.status}, Ação ${report.actionExecuted}`);

  const resultProjection = buildObserverProjection(resultState, input.observer);
  const context = buildNarrativeContext(resultProjection, report);

  console.log(`[NarrativeCycle] 3. Narrando contexto com LLM (${input.llm.providerId})...`);
  let narrative = await input.llm.narrate(context);

  let validation = validateNarrativeConsistency(report, context, narrative, {
    excludedSecretStatements: input.excludedSecretStatements
  });

  if (validation.length > 0) {
    console.warn(`[NarrativeCycle] ⚠️ Violações semânticas detectadas (${validation.length}):`, validation.map(v => v.message));
    narrative = await input.llm.narrate(context);
    validation = validateNarrativeConsistency(report, context, narrative, {
      excludedSecretStatements: input.excludedSecretStatements
    });

    if (validation.length > 0) {
      console.error(`[NarrativeCycle] ❌ Persistiram violações. Acionando fallback autoritativo.`);
      narrative = buildSafeFallbackNarrative(report);
      validation = validateNarrativeConsistency(report, context, narrative, {
        excludedSecretStatements: input.excludedSecretStatements
      });
    }
  } else {
    console.log(`[NarrativeCycle] ✅ Narrativa aprovada sem violações (${narrative.length} chars).`);
  }

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

import { CampaignState } from '../types';
import {
  ExecutionReport,
  NarrativeCommand,
  NarrativeContext,
  NarrativeObserver,
  ObserverProjection,
  NarrativeQueryContext,
  EpistemicAnswerStatus
} from './narrativeContracts';
import { NarrativeLLM } from './narrativeLLM';
import { buildNarrativeContext, buildObserverProjection, resolveNarrativeCommand } from '../engine';
import { SemanticViolation, validateNarrativeConsistency } from './semanticValidation';
import { RandomService } from '../core/RandomService';
import { extractTemporalScope } from './intentHeuristics';

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
  const temporalScope = extractTemporalScope(input.playerInput);
  const initialProjection = buildObserverProjection(input.state, input.observer, temporalScope);

  console.log(`[NarrativeCycle] 1. Interpretando: "${input.playerInput}"...`);
  const command = await input.llm.interpret({
    playerInput: input.playerInput,
    projection: initialProjection
  });
  console.log(`[NarrativeCycle] -> Comando: ${command.action} (conf: ${command.confidence})`);

  const resolution = resolveNarrativeCommand(command, input.state, input.rng);
  const resultState = resolution.state;
  let report = resolution.report;
  console.log(`[NarrativeCycle] 2. Resolução do Motor: Status ${report.status}, Ação ${report.actionExecuted}`);

  const resultProjection = buildObserverProjection(resultState, input.observer, temporalScope);

  // Determinar status epistêmico da resposta para consultas
  if (report.actionExecuted === 'INFORMATION' || command.action === 'INFORMATION') {
    const inputLower = input.playerInput.toLowerCase();
    const factsText = resultProjection.knownFacts.map(f => `${f.statement} ${f.subjectId || ''} ${(f.tags || []).join(' ')}`).join(' ').toLowerCase();

    // Se a pergunta menciona explicitamente uma entidade nomeada (ex: "casa blackthorn", "blackthorn")
    const namedMatch = inputLower.match(/\b(?:casa|lorde|lady|capit[aã]o|mestre|forte|torre)\s+([a-zA-ZÀ-ÿ]+)\b/i);
    if (namedMatch) {
      const entity = namedMatch[1].toLowerCase();
      const found = factsText.includes(entity);
      report = {
        ...report,
        answerStatus: found ? 'AUTHORIZED_FACTS_PRESENT' : 'NO_AUTHORIZED_INFORMATION'
      };
    } else {
      report = {
        ...report,
        answerStatus: resultProjection.knownFacts.length > 0 ? 'AUTHORIZED_FACTS_PRESENT' : 'NO_AUTHORIZED_INFORMATION'
      };
    }
  }

  const query: NarrativeQueryContext = {
    playerInput: input.playerInput,
    originalAction: command.action,
    targetId: command.targetId,
    locationId: command.locationId,
    temporalScope
  };

  const context = buildNarrativeContext(resultProjection, report, query);

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

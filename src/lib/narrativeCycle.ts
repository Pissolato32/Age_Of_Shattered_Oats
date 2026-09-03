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
import { ClarificationContext } from './clarificationContracts';
import { MemoryStore } from '../memory/MemoryStore';
import { KnowledgeStore } from '../memory/KnowledgeStore';
import { ContextRetrievalService, RetrievalResult } from '../memory/retrieval/ContextRetrievalService';
import type { MemoryRecord, KnowledgeRecord } from '../memory/contracts';
import { filterContextBySalience } from './salienceFilter';
import { NarrativeJudge } from '../llm/validators/NarrativeJudge';

export interface NarrativeCycleInput {
  readonly playerInput: string;
  readonly state: CampaignState;
  readonly observer: NarrativeObserver;
  readonly llm: NarrativeLLM;
  readonly rng?: RandomService;
  readonly excludedSecretStatements?: readonly string[];
  /** Present when the player is responding to a clarification question. */
  readonly clarificationContext?: ClarificationContext;
}

export interface NarrativeCycleResult {
  readonly command: NarrativeCommand;
  readonly report: ExecutionReport;
  readonly projection: ObserverProjection;
  readonly context: NarrativeContext;
  readonly narrative: string;
  readonly validation: readonly SemanticViolation[];
  readonly resultState: CampaignState;
  /** Clarification trace data — present only when clarification was involved. */
  readonly clarificationTrace?: {
    readonly originalInput?: string;
    readonly masterQuestion?: string;
    readonly options?: Array<{ readonly id: string; readonly label: string; readonly semanticValue: string }>;
    readonly playerAnswer?: string;
    readonly selectedOption?: string;
    readonly round?: number;
    readonly resolution: 'RESOLVED' | 'EXHAUSTED' | 'NORMAL_TURN';
  };
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

  let retrievalResult: RetrievalResult | undefined = undefined;
  let retrievedContext: readonly (MemoryRecord | KnowledgeRecord)[] | undefined = undefined;

  if (input.state.memoryStores?.memories || input.state.memoryStores?.knowledge) {
    const memoryStore = new MemoryStore({ records: input.state.memoryStores.memories || [] });
    const knowledgeStore = new KnowledgeStore({ records: input.state.memoryStores.knowledge || [] });
    const retrievalService = new ContextRetrievalService(memoryStore, knowledgeStore);

    retrievalResult = retrievalService.retrieve({
      agentId: input.observer.observerId,
      temporalScope,
      limit: 10
    });

    if (retrievalResult.memories.length > 0 || retrievalResult.knowledge.length > 0) {
      retrievedContext = [...retrievalResult.memories, ...retrievalResult.knowledge];
    }
  }

  const initialProjection = buildObserverProjection(input.state, input.observer, temporalScope, retrievalResult);

  console.log(`[NarrativeCycle] 1. Interpretando: "${input.playerInput}"...`);
  let command = await input.llm.interpret({
    playerInput: input.playerInput,
    projection: initialProjection,
    clarificationContext: input.clarificationContext,
    retrievedContext
  });

  // INT-001: Drift Guard de Ação durante Esclarecimento
  if (input.clarificationContext && command.action !== input.clarificationContext.proposedCommand.action && command.action !== 'UNKNOWN') {
    console.warn(`[NarrativeCycle] ⚠️ Drift de ação durante clarificação (${command.action} != ${input.clarificationContext.proposedCommand.action}). Forçando UNKNOWN.`);
    command = {
      ...command,
      action: 'UNKNOWN',
      requiresClarification: false,
      ambiguity: ['Ação divergente durante esclarecimento rejeitada']
    };
  }

  // INT-001: Esgotamento no Round 2 (Fail-safe: UNKNOWN sem mutação)
  const isRoundExhausted = Boolean(
    input.clarificationContext?.round &&
    input.clarificationContext.round >= 2 &&
    command.requiresClarification
  );

  if (isRoundExhausted) {
    console.log(`[NarrativeCycle] 🛑 Limite de 2 rodadas de esclarecimento atingido. Resolvendo para UNKNOWN com zero mutação.`);
    command = {
      ...command,
      action: 'UNKNOWN',
      requiresClarification: false,
      confidence: 1.0,
      ambiguity: ['Limite máximo de esclarecimentos atingido sem resolução conclusiva']
    };
  }

  console.log(`[NarrativeCycle] -> Comando: ${command.action} (conf: ${command.confidence})`);

  const resolution = resolveNarrativeCommand(command, input.state, input.rng);
  const resultState = resolution.state;
  let report = resolution.report;
  console.log(`[NarrativeCycle] 2. Resolução do Motor: Status ${report.status}, Ação ${report.actionExecuted}`);

  let postRetrievalResult = retrievalResult;
  if (resultState.memoryStores?.memories || resultState.memoryStores?.knowledge) {
    const memoryStore = new MemoryStore({ records: resultState.memoryStores.memories || [] });
    const knowledgeStore = new KnowledgeStore({ records: resultState.memoryStores.knowledge || [] });
    const retrievalService = new ContextRetrievalService(memoryStore, knowledgeStore);

    postRetrievalResult = retrievalService.retrieve({
      agentId: input.observer.observerId,
      temporalScope,
      limit: 10
    });
  }

  const resultProjection = buildObserverProjection(resultState, input.observer, temporalScope, postRetrievalResult);

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

  const rawContext = buildNarrativeContext(resultProjection, report, query, postRetrievalResult);
  // Apply Salience Gate (NAR-002 Pilar 1 & 2)
  const context = filterContextBySalience(rawContext, report);

  console.log(`[NarrativeCycle] 3. Narrando contexto com LLM (${input.llm.providerId})...`);
  let narrative = await input.llm.narrate(context);

  let validation = validateNarrativeConsistency(report, context, narrative, {
    excludedSecretStatements: input.excludedSecretStatements
  });
  let judgment = NarrativeJudge.judge(narrative, context, report);

  if (validation.length > 0 || !judgment.isPass) {
    const reasons = [
      ...validation.map(v => v.message),
      ...judgment.violations
    ];
    console.warn(`[NarrativeCycle] ⚠️ Violações detectadas (${reasons.length}):`, reasons);

    // Tentativa 2: Regeneração Concisa (NAR-002 Pilar 4)
    const compressionDirective = 'REGENERAÇÃO CONCISA: A versão anterior excedeu o limite de palavras ou violou regras de clichê/fidelidade. Comprima a narrativa em no máximo 2 frases diretas e objetivas, eliminando introduções climáticas e mantendo apenas os fatos ocorridos.';
    narrative = typeof (input.llm as any).narrate === 'function'
      ? await (input.llm as any).narrate(context, compressionDirective)
      : await input.llm.narrate(context);

    validation = validateNarrativeConsistency(report, context, narrative, {
      excludedSecretStatements: input.excludedSecretStatements
    });
    judgment = NarrativeJudge.judge(narrative, context, report);

    if (validation.length > 0 || !judgment.isPass) {
      console.error(`[NarrativeCycle] ❌ Persistiram violações após regeneração. Acionando fallback autoritativo.`);
      narrative = buildSafeFallbackNarrative(report);
      validation = validateNarrativeConsistency(report, context, narrative, {
        excludedSecretStatements: input.excludedSecretStatements
      });
      judgment = NarrativeJudge.judge(narrative, context, report);
    } else {
      console.log(`[NarrativeCycle] ✅ Narrativa aprovada após regeneração concisa (${narrative.length} chars, ${judgment.wordCount} palavras).`);
    }
  } else {
    console.log(`[NarrativeCycle] ✅ Narrativa aprovada sem violações (${narrative.length} chars, ${judgment.wordCount} palavras).`);
  }

  // Build clarification trace data
  let clarificationTrace: NarrativeCycleResult['clarificationTrace'] = { resolution: 'NORMAL_TURN' };

  if (input.clarificationContext) {
    // This is a clarification response turn
    clarificationTrace = {
      originalInput: input.clarificationContext.originalInput,
      masterQuestion: input.clarificationContext.masterQuestion,
      playerAnswer: input.clarificationContext.playerAnswer,
      selectedOption: input.clarificationContext.selectedOption,
      round: input.clarificationContext.round,
      resolution: (command.requiresClarification || isRoundExhausted) ? 'EXHAUSTED' : 'RESOLVED'
    };
  } else if (command.requiresClarification) {
    // This is a new ambiguity detection — the question will be in the narrative
    clarificationTrace = {
      masterQuestion: narrative, // The LLM's clarification question
      resolution: 'EXHAUSTED' // Will be updated to RESOLVED if resolved later
    };
  }

  return {
    command,
    report,
    projection: resultProjection,
    context,
    narrative,
    validation,
    resultState,
    clarificationTrace
  };
}

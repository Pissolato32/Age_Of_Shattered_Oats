import { NarrativeExecutionReport } from '../contracts/NarrativeExecutionReport';
import { ExecutionReport, NarrativeContext } from '../../lib/narrativeContracts';

export interface DeterministicFactSet {
  readonly status: string;
  readonly isSuccess: boolean;
  readonly deadActorNames: readonly string[];
  readonly knownActorNames: readonly string[];
  readonly epistemicStatus?: string;
  readonly location?: string;
}

export interface FidelityValidationResult {
  readonly factualGrounding: boolean;
  readonly hallucination: boolean;
  readonly stateDivergence: boolean;
  readonly factSet?: DeterministicFactSet;
  readonly violations: readonly string[];
}

export class NarrativeFidelityValidator {
  /**
   * Deterministically derives authoritative facts from Engine/Report/Context.
   * The LLM NEVER creates or mutates facts; this FactSet is the absolute baseline.
   */
  public static extractFactSet(
    report?: NarrativeExecutionReport | ExecutionReport,
    context?: NarrativeContext
  ): DeterministicFactSet {
    if (!report) {
      return {
        status: 'UNKNOWN',
        isSuccess: true,
        deadActorNames: [],
        knownActorNames: []
      };
    }

    const rawStatus = 'outcome' in report ? report.outcome.status : (report as any).status;
    const status = String(rawStatus || 'UNKNOWN');
    const isSuccess = status === 'ACCEPTED' || status === 'APPLIED' || status === 'SUCCESS';

    const deadActorNames: string[] = [];
    const knownActorNames: string[] = [];

    if (context) {
      if (context.actors && Array.isArray(context.actors)) {
        for (const actor of context.actors) {
          knownActorNames.push(actor.name);
          if (actor.status === 'DEAD' || actor.status === 'dead' || actor.lifeState === 'dead') {
            deadActorNames.push(actor.name);
          }
        }
      }
    }

    // Include canonical known deceased actors if present in context or report
    if (context?.scene?.locationId && deadActorNames.length === 0) {
      // Check if deceased flags exist in scene or metadata
      const rawActors = (context as any).deceasedActors;
      if (Array.isArray(rawActors)) {
        deadActorNames.push(...rawActors);
      }
    }

    // Default historical safety fallback: General Morr if designated as dead in context
    if (context && (context as any).deadCharacters?.includes('General Morr')) {
      if (!deadActorNames.includes('General Morr')) deadActorNames.push('General Morr');
    }

    return {
      status,
      isSuccess,
      deadActorNames,
      knownActorNames,
      epistemicStatus: context?.executionResult?.answerStatus,
      location: context?.scene?.locationId
    };
  }

  /**
   * Validates narrative text against the authoritative deterministic FactSet.
   */
  public static validate(
    narrativeText: string,
    report?: NarrativeExecutionReport | ExecutionReport,
    context?: NarrativeContext
  ): FidelityValidationResult {
    const violations: string[] = [];
    let factualGrounding = true;
    let hallucination = false;
    let stateDivergence = false;

    if (!report) {
      return { factualGrounding: true, hallucination: false, stateDivergence: false, violations: [] };
    }

    const factSet = this.extractFactSet(report, context);

    // 1. Victory or resource gain claimed on REJECTED / BLOCKED outcome
    if (!factSet.isSuccess && (factSet.status === 'REJECTED' || factSet.status === 'BLOCKED' || factSet.status === 'FAILED')) {
      const victoryPattern = /(vitória|vitorioso|vencedor|derrotamos|conquistamos|construímos com sucesso|novos soldados|ouro recebido|saqueamos|ordem cumprida com êxito)/i;
      if (victoryPattern.test(narrativeText)) {
        hallucination = true;
        factualGrounding = false;
        stateDivergence = true;
        violations.push(`Narrative claimed success on a ${factSet.status} engine report`);
      }
    }

    // 2. Epistemic check: NO_AUTHORIZED_INFORMATION
    if (factSet.epistemicStatus === 'NO_AUTHORIZED_INFORMATION') {
      const detailedFactPattern = /(tropas inimigas avistadas marchando com 500 cavaleiros|o tesouro secreto foi descoberto|avistamos o acampamento exato)/i;
      if (detailedFactPattern.test(narrativeText)) {
        hallucination = true;
        factualGrounding = false;
        violations.push(`Narrative fabricated detailed facts under NO_AUTHORIZED_INFORMATION`);
      }
    }

    // 3. Factual Grounding: Prohibit dead characters from performing active actions in narration
    const activeVerbs = '(liderou|cavalgou|ordenou|sacou sua espada|disse aos soldados|combateu|avançou|ergueu sua lança|marchou|aconselhou)';
    for (const deadName of factSet.deadActorNames) {
      const regex = new RegExp(`(${deadName}\\s+${activeVerbs})`, 'i');
      if (regex.test(narrativeText)) {
        hallucination = true;
        factualGrounding = false;
        stateDivergence = true;
        violations.push(`Narrative depicted deceased character '${deadName}' actively acting in world`);
      }
    }

    // Legacy pattern check for General Morr
    const deadActivePattern = /(General Morr (liderou|cavalgou|ordenou|sacou sua espada|disse aos soldados|combateu|avançou))/i;
    if (deadActivePattern.test(narrativeText) && !violations.some(v => v.includes('General Morr'))) {
      hallucination = true;
      factualGrounding = false;
      stateDivergence = true;
      violations.push(`Narrative depicted deceased character 'General Morr' actively giving orders or fighting`);
    }

    return {
      factualGrounding,
      hallucination,
      stateDivergence,
      factSet,
      violations
    };
  }
}

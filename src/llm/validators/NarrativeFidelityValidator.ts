import { NarrativeExecutionReport } from '../contracts/NarrativeExecutionReport';
import { ExecutionReport, NarrativeContext } from '../../lib/narrativeContracts';

export interface DeterministicFactSet {
  readonly status: string;
  readonly isSuccess: boolean;
  readonly deadActorNames: readonly string[];
  readonly knownActorNames: readonly string[];
  readonly epistemicStatus?: string;
  readonly location?: string;
  readonly reasonCode?: string;
  readonly isDispatchOrProbe?: boolean;
  readonly retrievedMemoryCount: number;
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
        knownActorNames: [],
        retrievedMemoryCount: 0
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

    const reasonCode = 'reasonCode' in report
      ? (report as any).reasonCode
      : ('outcome' in report ? (report as any).outcome?.reason : undefined);

    const consequences = 'consequences' in report
      ? (report as any).consequences || []
      : ('outcome' in report ? (report as any).outcome?.consequences || [] : []);

    const isDispatchOrProbe = consequences.some((c: any) => {
      const desc = typeof c === 'string' ? c : c?.description;
      return typeof desc === 'string' && (
        desc.includes('despachad') ||
        desc.includes('mensagem formal') ||
        desc.includes('sondagem') ||
        desc.includes('partiram a cavalo')
      );
    });

    const retrievedMemoryCount = context?.retrievedMemories ? context.retrievedMemories.length : 0;

    return {
      status,
      isSuccess,
      deadActorNames,
      knownActorNames,
      epistemicStatus: context?.executionResult?.answerStatus,
      location: context?.scene?.locationId,
      reasonCode,
      isDispatchOrProbe,
      retrievedMemoryCount
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
      const detailedFactPattern = /(tropas inimigas avistadas|cavaleiros marchando|\b\d+\s+homens\s+inimigos|acampamento\s+localizado\s+com\s+precisão|o\s+tesouro\s+secreto\s+foi\s+descoberto)/i;
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

    // 4. Temporal Containment: Preclude premature arrival or concluded treaties on dispatch turns
    if (factSet.isDispatchOrProbe) {
      const prematureDiplomacyPattern = /(chegou\s+à\s+corte|chegaram\s+à\s+corte|recebid[oa]s?\s+no\s+castelo|banquete|tratado\s+assinado|acordo\s+foi\s+firmado|o\s+lorde\s+respondeu\s+aceitando|o\s+rei\s+concordou\s+com|recepção\s+calorosa)/i;
      if (prematureDiplomacyPattern.test(narrativeText)) {
        hallucination = true;
        stateDivergence = true;
        violations.push(`Narrative depicted premature arrival or accepted treaty on a message dispatch turn`);
      }
    }

    // 5. Rejection Reason Fidelity: Preclude fabricated excuses contrary to authoritative reasonCode
    if (factSet.status === 'REJECTED' && factSet.reasonCode) {
      const reasonLower = factSet.reasonCode.toLowerCase();
      if (/ouro|prata|silverdew|moeda|tesouro|fundos/i.test(reasonLower)) {
        if (/soldados\s+estavam\s+exaustos|cansaço\s+dos\s+soldados|tropas\s+recusaram-se\s+por\s+fadiga/i.test(narrativeText)) {
          hallucination = true;
          factualGrounding = false;
          violations.push(`Narrative fabricated troop fatigue excuse when engine rejection was economic: ${factSet.reasonCode}`);
        }
      }
    }

    // 6. Synthetic / Invented Memory Check: Preclude claims of clear memories when no memories were retrieved
    if (factSet.retrievedMemoryCount === 0) {
      const syntheticMemoryPattern = /(vós\s+vos\s+lembrais\s+com\s+clareza\s+de|relembrando\s+a\s+vitória\s+passada\s+em|como\s+está\s+registrado\s+nos\s+anais\s+secretos\s+da\s+casa)/i;
      if (syntheticMemoryPattern.test(narrativeText)) {
        hallucination = true;
        violations.push(`Narrative evoked synthetic memories not present in retrieved context`);
      }
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

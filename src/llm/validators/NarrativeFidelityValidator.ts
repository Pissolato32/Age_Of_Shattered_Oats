import { NarrativeExecutionReport } from '../contracts/NarrativeExecutionReport';
import { ExecutionReport, NarrativeContext } from '../../lib/narrativeContracts';

export interface FidelityValidationResult {
  readonly factualGrounding: boolean;
  readonly hallucination: boolean;
  readonly stateDivergence: boolean;
  readonly violations: readonly string[];
}

export class NarrativeFidelityValidator {
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

    const status = 'outcome' in report ? report.outcome.status : report.status;

    // 1. Victory or resource gain claimed on REJECTED / BLOCKED outcome
    if (status === 'REJECTED' || status === 'BLOCKED') {
      const victoryPattern = /(vitória|vitorioso|vencedor|derrotamos|conquistamos|construímos com sucesso|novos soldados|ouro recebido|saqueamos)/i;
      if (victoryPattern.test(narrativeText)) {
        hallucination = true;
        factualGrounding = false;
        stateDivergence = true;
        violations.push(`Narrative claimed success on a ${status} engine report`);
      }
    }

    // 2. Epistemic check: NO_AUTHORIZED_INFORMATION
    if (context && context.executionResult.answerStatus === 'NO_AUTHORIZED_INFORMATION') {
      const detailedFactPattern = /(tropas inimigas avistadas marchando com 500 cavaleiros|o tesouro secreto foi descoberto)/i;
      if (detailedFactPattern.test(narrativeText)) {
        hallucination = true;
        factualGrounding = false;
        violations.push(`Narrative fabricated detailed facts under NO_AUTHORIZED_INFORMATION`);
      }
    }

    return {
      factualGrounding,
      hallucination,
      stateDivergence,
      violations
    };
  }
}

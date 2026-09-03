import { NarrativeContext, ExecutionReport } from '../../lib/narrativeContracts';
import { NarrativeExecutionReport } from '../contracts/NarrativeExecutionReport';
import { MechanicalLeakageValidator } from './MechanicalLeakageValidator';
import { NarrativeFidelityValidator } from './NarrativeFidelityValidator';
import { NarrativeQualityEvaluator, resolveNarrativeCategory } from './NarrativeQualityEvaluator';

export interface NarrativeJudgment {
  readonly isPass: boolean;
  readonly mechanicalSilence: boolean;
  readonly factualGrounding: boolean;
  readonly hallucination: boolean;
  readonly conciseness: boolean;
  readonly clicheFree: boolean;
  readonly stateDivergence: boolean;
  readonly narrativeScore: number; // 0.0 to 10.0
  readonly wordCount: number;
  readonly hardMaxWords: number;
  readonly violations: readonly string[];
  readonly notes: readonly string[];
}

export class NarrativeJudge {
  public static judge(
    narrativeText: string,
    context?: NarrativeContext,
    report?: NarrativeExecutionReport | ExecutionReport
  ): NarrativeJudgment {
    // Determine action and status for category-based budget
    const action = report
      ? ('actionExecuted' in report ? report.actionExecuted : (report as any).command?.action)
      : context?.executionResult?.actionExecuted;

    const status = report
      ? ('status' in report ? report.status : (report as any).outcome?.status)
      : context?.executionResult?.status;

    const category = resolveNarrativeCategory(action, status);

    // 1. Mechanical Leakage Check
    const leakRes = MechanicalLeakageValidator.validate(narrativeText);

    // 2. Factual Fidelity & Hallucination Check
    const fidRes = NarrativeFidelityValidator.validate(narrativeText, report, context);

    // 3. Quality, Conciseness & Cliché Evaluation (NAR-002)
    const qualRes = NarrativeQualityEvaluator.evaluate(narrativeText, category);

    const violations: string[] = [
      ...leakRes.leakedTerms.map(t => `Mechanical Leakage: ${t}`),
      ...fidRes.violations,
      ...qualRes.violations
    ];

    let compositeScore = qualRes.qualityScore;
    if (!leakRes.mechanicalSilence) compositeScore = Math.max(0, compositeScore - 4.0);
    if (fidRes.hallucination) compositeScore = Math.max(0, compositeScore - 4.0);
    if (!qualRes.conciseness) compositeScore = Math.max(0, compositeScore - 3.0);
    if (!qualRes.clicheFree) compositeScore = Math.max(0, compositeScore - 2.0);

    const isPass =
      leakRes.mechanicalSilence &&
      fidRes.factualGrounding &&
      !fidRes.hallucination &&
      qualRes.conciseness &&
      qualRes.clicheFree;

    return {
      isPass,
      mechanicalSilence: leakRes.mechanicalSilence,
      factualGrounding: fidRes.factualGrounding,
      hallucination: fidRes.hallucination,
      conciseness: qualRes.conciseness,
      clicheFree: qualRes.clicheFree,
      stateDivergence: fidRes.stateDivergence,
      narrativeScore: Number(compositeScore.toFixed(1)),
      wordCount: qualRes.wordCount,
      hardMaxWords: qualRes.hardMaxWords,
      violations,
      notes: qualRes.notes
    };
  }
}

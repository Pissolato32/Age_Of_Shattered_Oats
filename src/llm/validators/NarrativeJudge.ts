import { NarrativeContext, ExecutionReport } from '../../lib/narrativeContracts';
import { NarrativeExecutionReport } from '../contracts/NarrativeExecutionReport';
import { MechanicalLeakageValidator } from './MechanicalLeakageValidator';
import { NarrativeFidelityValidator } from './NarrativeFidelityValidator';
import { NarrativeQualityEvaluator } from './NarrativeQualityEvaluator';

export interface NarrativeJudgment {
  readonly mechanicalSilence: boolean;
  readonly factualGrounding: boolean;
  readonly hallucination: boolean;
  readonly conciseness: boolean;
  readonly stateDivergence: boolean;
  readonly narrativeScore: number; // 0.0 to 10.0
  readonly violations: readonly string[];
}

export class NarrativeJudge {
  public static judge(
    narrativeText: string,
    context?: NarrativeContext,
    report?: NarrativeExecutionReport | ExecutionReport
  ): NarrativeJudgment {
    // 1. Mechanical Leakage Check
    const leakRes = MechanicalLeakageValidator.validate(narrativeText);

    // 2. Factual Fidelity & Hallucination Check
    const fidRes = NarrativeFidelityValidator.validate(narrativeText, report, context);

    // 3. Quality & Conciseness Evaluation
    const qualRes = NarrativeQualityEvaluator.evaluate(narrativeText);

    const violations: string[] = [
      ...leakRes.leakedTerms.map(t => `Mechanical Leakage: ${t}`),
      ...fidRes.violations,
      ...qualRes.notes
    ];

    let compositeScore = qualRes.qualityScore;
    if (!leakRes.mechanicalSilence) compositeScore = Math.max(0, compositeScore - 4.0);
    if (fidRes.hallucination) compositeScore = Math.max(0, compositeScore - 4.0);

    return {
      mechanicalSilence: leakRes.mechanicalSilence,
      factualGrounding: fidRes.factualGrounding,
      hallucination: fidRes.hallucination,
      conciseness: qualRes.conciseness,
      stateDivergence: fidRes.stateDivergence,
      narrativeScore: Number(compositeScore.toFixed(1)),
      violations
    };
  }
}

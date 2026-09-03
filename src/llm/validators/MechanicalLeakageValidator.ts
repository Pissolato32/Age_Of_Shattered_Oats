export interface LeakageValidationResult {
  readonly mechanicalSilence: boolean;
  readonly leakedTerms: readonly string[];
}

export class MechanicalLeakageValidator {
  private static readonly FORBIDDEN_MECHANICAL_PATTERNS: readonly RegExp[] = [
    /\bSD\b/i,
    /\bFSU\b/i,
    /\bAC\b/i,
    /\bXP\b/i,
    /\bDC\b/i,
    /\bRoll\b/i,
    /\bdice\b/i,
    /\brolagem\b/i,
    /\brolou\b/i,
    /\bRNG\b/i,
    /\bStatus ACCEPTED\b/i,
    /\bStatus REJECTED\b/i,
    /\bExecutionReport\b/i,
    /\bRuleResolver\b/i,
    /\bCampaignState\b/i,
    /\bNarrativeContext\b/i,
    /\bNarrativeCommand\b/i,
    /\bCodex\b/i,
    /\b\[Semana \d+\]/i,
    /\b\d+\s+moedas\b/i
  ];

  public static validate(narrativeText: string): LeakageValidationResult {
    const leakedTerms: string[] = [];
    for (const pattern of this.FORBIDDEN_MECHANICAL_PATTERNS) {
      if (pattern.test(narrativeText)) {
        leakedTerms.push(pattern.source);
      }
    }
    return {
      mechanicalSilence: leakedTerms.length === 0,
      leakedTerms
    };
  }
}

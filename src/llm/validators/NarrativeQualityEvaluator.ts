export interface QualityEvaluationResult {
  readonly conciseness: boolean;
  readonly proportion: boolean;
  readonly qualityScore: number; // 0.0 to 10.0
  readonly notes: readonly string[];
}

export class NarrativeQualityEvaluator {
  public static evaluate(narrativeText: string): QualityEvaluationResult {
    const notes: string[] = [];
    let conciseness = true;
    let proportion = true;

    const trimmed = narrativeText.trim();
    if (trimmed.length < 20) {
      return { conciseness: false, proportion: false, qualityScore: 0.0, notes: ['Text is empty or too short'] };
    }

    const paragraphs = trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length > 3) {
      conciseness = false;
      notes.push(`Excessive paragraph count: ${paragraphs.length} (max: 3)`);
    }

    if (trimmed.length > 1200) {
      conciseness = false;
      notes.push(`Text length (${trimmed.length} chars) exceeds 1200 character budget`);
    }

    // Check for repetitive preambles
    if (trimmed.includes('Relatório Geral:') && trimmed.includes('Conselheiro:')) {
      proportion = false;
      notes.push('Redundant summary preamble detected');
    }

    let score = 5.0;
    if (conciseness) score += 2.5;
    if (proportion) score += 2.5;
    if (trimmed.length >= 60 && trimmed.length <= 800) score = Math.min(10.0, score + 1.0);

    return {
      conciseness,
      proportion,
      qualityScore: Number(score.toFixed(1)),
      notes
    };
  }
}

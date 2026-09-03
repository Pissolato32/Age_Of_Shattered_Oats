export interface NarrativeBudget {
  readonly targetWords: readonly [number, number];
  readonly hardMaxWords: number;
  readonly maxParagraphs: number;
  readonly idealSentences: readonly [number, number];
}

export const ACTION_NARRATIVE_BUDGETS: Record<string, NarrativeBudget> = {
  MECHANICAL: {
    targetWords: [35, 65],
    hardMaxWords: 85,
    maxParagraphs: 1,
    idealSentences: [2, 3]
  },
  COMMERCE: {
    targetWords: [30, 55],
    hardMaxWords: 75,
    maxParagraphs: 1,
    idealSentences: [2, 2]
  },
  DIPLOMACY: {
    targetWords: [50, 85],
    hardMaxWords: 110,
    maxParagraphs: 2,
    idealSentences: [3, 4]
  },
  INFORMATION: {
    targetWords: [40, 80],
    hardMaxWords: 100,
    maxParagraphs: 2,
    idealSentences: [2, 4]
  },
  REJECTION: {
    targetWords: [25, 45],
    hardMaxWords: 60,
    maxParagraphs: 1,
    idealSentences: [1, 2]
  },
  DEFAULT: {
    targetWords: [35, 75],
    hardMaxWords: 95,
    maxParagraphs: 2,
    idealSentences: [2, 4]
  }
};

export const FORBIDDEN_CLICHE_PATTERNS: readonly RegExp[] = [
  /^(?:o|um)\s+vento\s+(?:g[eé]lido|frio|cortante|uivante|impiedoso)\s+(?:sopra|desce|chicoteia|uiva|castiga|açoita)/i,
  /^sob\s+o\s+c[eé]u\s+(?:cinzento|chumbo|pesado|l[uú]gubre|escuro)/i,
  /^as\s+sombras\s+(?:se\s+alongam|descem|cobrem|dançam)\s+sobre/i,
  /^(?:com|sob)\s+o\s+peso\s+de\s+antigos\s+juramentos/i,
  /^a\s+n[eé]voa\s+(?:espessa\s+|fria\s+)?(?:engole|cobre|desce\s+sobre)\s+(?:a|o|os|as|Grey|vossa)/i
];

export function resolveNarrativeCategory(action?: string, status?: string): string {
  if (status === 'REJECTED' || status === 'BLOCKED' || status === 'FAILED') {
    return 'REJECTION';
  }
  switch (action) {
    case 'BUILD':
    case 'RECRUIT':
    case 'TRAVEL':
    case 'MILITARY':
    case 'HARVEST':
      return 'MECHANICAL';
    case 'TRADE':
    case 'TITHE':
    case 'COMMERCE':
      return 'COMMERCE';
    case 'DIPLOMACY':
    case 'SOCIAL':
    case 'INTRIGUE':
      return 'DIPLOMACY';
    case 'INFORMATION':
    case 'ESPIONAGE':
    case 'FLAVOR_QUERY':
      return 'INFORMATION';
    default:
      return 'DEFAULT';
  }
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).filter(w => w.length > 0).length;
}

export function countSentences(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/[.!?]+(?:\s+|$)/).filter(s => s.trim().length > 0).length;
}

export interface QualityEvaluationResult {
  readonly conciseness: boolean;
  readonly proportion: boolean;
  readonly clicheFree: boolean;
  readonly wordCount: number;
  readonly paragraphCount: number;
  readonly sentenceCount: number;
  readonly hardMaxWords: number;
  readonly qualityScore: number; // 0.0 to 10.0
  readonly notes: readonly string[];
  readonly violations: readonly string[];
}

export class NarrativeQualityEvaluator {
  public static evaluate(narrativeText: string, actionCategory = 'DEFAULT'): QualityEvaluationResult {
    const notes: string[] = [];
    const violations: string[] = [];
    let conciseness = true;
    let proportion = true;
    let clicheFree = true;

    const trimmed = narrativeText.trim();
    if (trimmed.length < 20) {
      return {
        conciseness: false,
        proportion: false,
        clicheFree: true,
        wordCount: 0,
        paragraphCount: 0,
        sentenceCount: 0,
        hardMaxWords: 0,
        qualityScore: 0.0,
        notes: ['Text is empty or too short'],
        violations: ['Text is empty or too short (<20 chars)']
      };
    }

    const budget = ACTION_NARRATIVE_BUDGETS[actionCategory] || ACTION_NARRATIVE_BUDGETS.DEFAULT;
    const wordCount = countWords(trimmed);
    const sentenceCount = countSentences(trimmed);
    const paragraphs = trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;

    // 1. Hard Max Word Count Check
    if (wordCount > budget.hardMaxWords) {
      conciseness = false;
      violations.push(`Word count (${wordCount}) exceeds hard maximum budget of ${budget.hardMaxWords} words for category ${actionCategory}`);
    } else {
      notes.push(`Word count: ${wordCount} (budget: ${budget.targetWords[0]}-${budget.targetWords[1]} target, ${budget.hardMaxWords} max)`);
    }

    // 2. Paragraph Count Check
    if (paragraphCount > budget.maxParagraphs) {
      conciseness = false;
      violations.push(`Paragraph count (${paragraphCount}) exceeds allowed maximum of ${budget.maxParagraphs} for category ${actionCategory}`);
    }

    // 3. Prohibited Cliché Preamble Check
    for (const pattern of FORBIDDEN_CLICHE_PATTERNS) {
      if (pattern.test(trimmed)) {
        clicheFree = false;
        violations.push(`Prohibited cliché opening detected matching pattern: ${pattern.source}`);
        break;
      }
    }

    // 4. Summary Preamble Check
    if (trimmed.includes('Relatório Geral:') && trimmed.includes('Conselheiro:')) {
      proportion = false;
      violations.push('Redundant meta-summary preamble detected');
    }

    // 5. Soft Metric: Factual Density Ratio
    // Approximate ratio of distinct informative clauses per 20 words
    const estimatedFacts = Math.max(1, sentenceCount);
    const densityRatio = Number((estimatedFacts / Math.max(1, wordCount / 20)).toFixed(2));
    notes.push(`Factual density ratio (soft): ${densityRatio} clauses per 20 words`);

    // Calculate score
    let score = 5.0;
    if (conciseness) score += 2.5;
    if (clicheFree) score += 1.5;
    if (proportion) score += 1.0;
    if (wordCount >= budget.targetWords[0] && wordCount <= budget.targetWords[1]) {
      score = Math.min(10.0, score + 1.0);
    } else if (!conciseness) {
      score = Math.max(0, score - 3.0);
    }

    return {
      conciseness,
      proportion,
      clicheFree,
      wordCount,
      paragraphCount,
      sentenceCount,
      hardMaxWords: budget.hardMaxWords,
      qualityScore: Number(score.toFixed(1)),
      notes,
      violations
    };
  }
}

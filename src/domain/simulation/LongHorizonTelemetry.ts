export interface TurnTelemetry {
  readonly turn: number;
  readonly category: string;
  readonly wordCount: number;
  readonly targetWordsRange: readonly [number, number];
  readonly hardMaxWords: number;
  readonly inTargetRange: boolean;
  readonly withinHardMax: boolean;
  readonly regenerated: boolean;
  readonly fallbackUsed: boolean;
  readonly initialClicheDetected: boolean;
  readonly mechanicalSilence: boolean;
  readonly factualGrounding: boolean;
  readonly contextMemoriesCount: number;
  readonly contextKnowledgeCount: number;
  readonly contextRelationshipsCount: number;
  readonly estimatedContextTokens: number;
  readonly stateSilverdew: number;
  readonly stateFood: number;
  readonly firstThreeWords: string;
}

export interface SimulationTelemetrySummary {
  readonly totalTurns: number;
  readonly hardMaxComplianceRate: number; // 0.0 to 1.0 (Meta: 1.0)
  readonly targetRangeAdherenceRate: number; // 0.0 to 1.0 (Meta: >= 0.85)
  readonly regenerationRate: number; // 0.0 to 1.0 (Meta: <= 0.10)
  readonly fallbackRate: number; // 0.0 to 1.0 (Meta: <= 0.02)
  readonly initialClicheRate: number; // 0.0 to 1.0 (Meta: < 0.05)
  readonly salienceGateViolations: number; // Must be 0
  readonly maxMemoriesInContext: number; // Must be <= 2
  readonly maxKnowledgeInContext: number; // Must be <= 2
  readonly maxRelationshipsInContext: number; // Must be <= 1
  readonly tokenOutliersCount: number; // Count of tokens > 350
  readonly avgEstimatedContextTokens: number;
  readonly stateIntegrityViolations: number; // Must be 0
  readonly unhandledExceptionsCount: number; // Must be 0
  readonly mechanicalReplayParity: boolean; // Must be true
  readonly structuralRepetitionStreakMax: number; // Max consecutive turns with identical opening 3 words
  readonly hardGatesPassed: boolean;
  readonly diagnosticNotes: readonly string[];
}

export class LongHorizonTelemetryCollector {
  private turns: TurnTelemetry[] = [];
  private exceptionsCount = 0;
  private stateViolationsCount = 0;
  private replayParity = false;

  public recordTurn(telemetry: TurnTelemetry): void {
    this.turns.push(telemetry);

    // Validate state integrity invariants
    if (
      Number.isNaN(telemetry.stateSilverdew) ||
      !Number.isFinite(telemetry.stateSilverdew) ||
      telemetry.stateSilverdew < 0 ||
      Number.isNaN(telemetry.stateFood) ||
      !Number.isFinite(telemetry.stateFood) ||
      telemetry.stateFood < 0
    ) {
      this.stateViolationsCount++;
    }
  }

  public recordException(): void {
    this.exceptionsCount++;
  }

  public setMechanicalReplayParity(parity: boolean): void {
    this.replayParity = parity;
  }

  public getSummary(): SimulationTelemetrySummary {
    const total = this.turns.length;
    if (total === 0) {
      return {
        totalTurns: 0,
        hardMaxComplianceRate: 0,
        targetRangeAdherenceRate: 0,
        regenerationRate: 0,
        fallbackRate: 0,
        initialClicheRate: 0,
        salienceGateViolations: 0,
        maxMemoriesInContext: 0,
        maxKnowledgeInContext: 0,
        maxRelationshipsInContext: 0,
        tokenOutliersCount: 0,
        avgEstimatedContextTokens: 0,
        stateIntegrityViolations: this.stateViolationsCount,
        unhandledExceptionsCount: this.exceptionsCount,
        mechanicalReplayParity: this.replayParity,
        structuralRepetitionStreakMax: 0,
        hardGatesPassed: false,
        diagnosticNotes: ['No turns recorded in simulation telemetry.']
      };
    }

    const withinHardMaxCount = this.turns.filter(t => t.withinHardMax).length;
    const inTargetRangeCount = this.turns.filter(t => t.inTargetRange).length;
    const regeneratedCount = this.turns.filter(t => t.regenerated).length;
    const fallbackCount = this.turns.filter(t => t.fallbackUsed).length;
    const initialClicheCount = this.turns.filter(t => t.initialClicheDetected).length;

    let maxMemories = 0;
    let maxKnowledge = 0;
    let maxRelationships = 0;
    let salienceViolations = 0;
    let totalTokens = 0;
    let tokenOutliers = 0;

    for (const t of this.turns) {
      if (t.contextMemoriesCount > maxMemories) maxMemories = t.contextMemoriesCount;
      if (t.contextKnowledgeCount > maxKnowledge) maxKnowledge = t.contextKnowledgeCount;
      if (t.contextRelationshipsCount > maxRelationships) maxRelationships = t.contextRelationshipsCount;

      if (t.contextMemoriesCount > 2 || t.contextKnowledgeCount > 2 || t.contextRelationshipsCount > 1) {
        salienceViolations++;
      }

      totalTokens += t.estimatedContextTokens;
      if (t.estimatedContextTokens > 350) {
        tokenOutliers++;
      }
    }

    // Structural repetition check: max streak of identical first 3 words
    let maxStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < this.turns.length; i++) {
      if (
        this.turns[i].firstThreeWords &&
        this.turns[i].firstThreeWords === this.turns[i - 1].firstThreeWords
      ) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 1;
      }
    }

    const hardMaxRate = withinHardMaxCount / total;
    const targetRangeRate = inTargetRangeCount / total;
    const regenRate = regeneratedCount / total;
    const fbRate = fallbackCount / total;
    const clicheRate = initialClicheCount / total;
    const avgTokens = Math.round(totalTokens / total);

    const diagnosticNotes: string[] = [];

    // Diagnostic notes
    diagnosticNotes.push(`Total turns recorded: ${total}`);
    diagnosticNotes.push(`Hard Max compliance: ${(hardMaxRate * 100).toFixed(1)}% (Target: 100%)`);
    diagnosticNotes.push(`Target Range adherence: ${(targetRangeRate * 100).toFixed(1)}% (Diagnostic Target: >=85%)`);
    diagnosticNotes.push(`Regeneration rate: ${(regenRate * 100).toFixed(1)}% (Diagnostic Target: <=10%)`);
    diagnosticNotes.push(`Fallback rate: ${(fbRate * 100).toFixed(1)}% (Diagnostic Target: <=2%)`);
    diagnosticNotes.push(`Cliché rate (1st attempt): ${(clicheRate * 100).toFixed(1)}% (Diagnostic Target: <5%)`);
    diagnosticNotes.push(`Average estimated context tokens: ${avgTokens} (Tokens > 350 outliers: ${tokenOutliers})`);
    diagnosticNotes.push(`Salience Gate peak context: ${maxMemories} mems, ${maxKnowledge} facts, ${maxRelationships} rels`);

    // Hard gates evaluation
    const hardGatesPassed =
      this.exceptionsCount === 0 &&
      this.stateViolationsCount === 0 &&
      this.replayParity &&
      hardMaxRate === 1.0 &&
      salienceViolations === 0;

    return {
      totalTurns: total,
      hardMaxComplianceRate: Number(hardMaxRate.toFixed(4)),
      targetRangeAdherenceRate: Number(targetRangeRate.toFixed(4)),
      regenerationRate: Number(regenRate.toFixed(4)),
      fallbackRate: Number(fbRate.toFixed(4)),
      initialClicheRate: Number(clicheRate.toFixed(4)),
      salienceGateViolations: salienceViolations,
      maxMemoriesInContext: maxMemories,
      maxKnowledgeInContext: maxKnowledge,
      maxRelationshipsInContext: maxRelationships,
      tokenOutliersCount: tokenOutliers,
      avgEstimatedContextTokens: avgTokens,
      stateIntegrityViolations: this.stateViolationsCount,
      unhandledExceptionsCount: this.exceptionsCount,
      mechanicalReplayParity: this.replayParity,
      structuralRepetitionStreakMax: maxStreak,
      hardGatesPassed,
      diagnosticNotes
    };
  }
}

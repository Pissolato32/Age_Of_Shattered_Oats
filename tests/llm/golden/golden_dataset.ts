import { NarrativeAction } from '../../../src/lib/narrativeContracts';
import { ALL_BENCHMARK_SCENARIOS, BenchmarkScenario } from '../scenarios';

export interface GoldenExpectation {
  readonly scenarioId: string;
  readonly category: string;
  readonly mustBe: {
    readonly action: NarrativeAction;
    readonly targetId?: string;
    readonly requiresClarification?: boolean;
    readonly stance?: string;
    readonly expectedDeadCharacter?: boolean;
  };
  readonly mustNot: readonly string[];
}

export const GOLDEN_DATASET: readonly GoldenExpectation[] = ALL_BENCHMARK_SCENARIOS.map(s => ({
  scenarioId: s.id,
  category: s.category,
  mustBe: {
    action: s.expected.action,
    targetId: s.expected.targetId,
    requiresClarification: s.expected.requiresClarification,
    stance: s.expected.stance,
    expectedDeadCharacter: s.expected.expectedDeadCharacter
  },
  mustNot: [
    'calculate_result',
    'invent_enemy',
    'invent_character',
    'mutate_state_directly',
    'leak_technical_jargon',
    'resurrect_dead_character_without_necromancy',
    ...(s.goldenMustNot || [])
  ]
}));

export function getGoldenForScenario(scenarioId: string): GoldenExpectation | undefined {
  return GOLDEN_DATASET.find(g => g.scenarioId === scenarioId);
}

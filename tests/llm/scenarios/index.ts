import { BenchmarkScenario } from './types';
import { MILITARY_SCENARIOS } from './military';
import { DIPLOMACY_SCENARIOS } from './diplomacy';
import { ECONOMY_SCENARIOS } from './economy';
import { INTRIGUE_SCENARIOS } from './intrigue';
import { EXPLORATION_SCENARIOS } from './exploration';
import { CRISIS_SCENARIOS } from './crisis';
import { AMBIGUOUS_SCENARIOS } from './ambiguous';
import { ADVERSARIAL_SCENARIOS } from './adversarial';
import { HISTORICAL_SCENARIOS } from './historical';
import { CROSS_SYSTEM_SCENARIOS } from './cross_system';

export * from './types';
export { MILITARY_SCENARIOS } from './military';
export { DIPLOMACY_SCENARIOS } from './diplomacy';
export { ECONOMY_SCENARIOS } from './economy';
export { INTRIGUE_SCENARIOS } from './intrigue';
export { EXPLORATION_SCENARIOS } from './exploration';
export { CRISIS_SCENARIOS } from './crisis';
export { AMBIGUOUS_SCENARIOS } from './ambiguous';
export { ADVERSARIAL_SCENARIOS } from './adversarial';
export { HISTORICAL_SCENARIOS } from './historical';
export { CROSS_SYSTEM_SCENARIOS } from './cross_system';

export const ALL_BENCHMARK_SCENARIOS: readonly BenchmarkScenario[] = [
  ...MILITARY_SCENARIOS,
  ...DIPLOMACY_SCENARIOS,
  ...ECONOMY_SCENARIOS,
  ...INTRIGUE_SCENARIOS,
  ...EXPLORATION_SCENARIOS,
  ...CRISIS_SCENARIOS,
  ...AMBIGUOUS_SCENARIOS,
  ...ADVERSARIAL_SCENARIOS,
  ...HISTORICAL_SCENARIOS,
  ...CROSS_SYSTEM_SCENARIOS
];

export function getScenariosByCategory(category: string): readonly BenchmarkScenario[] {
  return ALL_BENCHMARK_SCENARIOS.filter(s => s.category === category);
}

export function getScenarioById(id: string): BenchmarkScenario | undefined {
  return ALL_BENCHMARK_SCENARIOS.find(s => s.id === id);
}

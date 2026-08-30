import { NarrativeAction, ExecutionReport } from '../../../src/lib/narrativeContracts';

export type BenchmarkCategory =
  | 'military'
  | 'diplomacy'
  | 'economy'
  | 'intrigue'
  | 'exploration'
  | 'crisis'
  | 'ambiguous'
  | 'adversarial'
  | 'historical'
  | 'cross_system';

export type StressCondition =
  | 'NORMAL'
  | 'AMBIGUOUS'
  | 'ADVERSARIAL'
  | 'LONG_CONTEXT'
  | 'CORRUPTED_CONTEXT';

export interface BenchmarkScenario {
  readonly id: string;
  readonly category: BenchmarkCategory;
  readonly condition: StressCondition;
  readonly title: string;
  readonly playerInput: string;
  readonly worldContext?: {
    locationId?: string;
    regionName?: string;
    silverdew?: number;
    food?: number;
    garrison?: number;
  };
  readonly expected: {
    action: NarrativeAction;
    targetId?: string;
    stance?: 'AGGRESSIVE' | 'CAUTIOUS' | 'DIPLOMATIC' | 'DECEPTIVE' | 'HONORABLE' | 'NEUTRAL';
    magnitudeMode?: 'FIXED' | 'ENGINE_DETERMINED' | 'RANGE';
    magnitudeValue?: number;
    requiresClarification?: boolean;
    expectedDeadCharacter?: boolean | string;
  };
  readonly constraints: readonly string[];
  readonly goldenMustNot?: readonly string[];
  readonly mockEngineReport?: Partial<ExecutionReport>;
}

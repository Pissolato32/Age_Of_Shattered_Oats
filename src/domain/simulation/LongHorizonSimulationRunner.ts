import { CampaignState } from '../../types';
import { createInitialState, resolveWeeklyTurn } from '../../engine';
import { runNarrativeCycle } from '../../lib/narrativeCycle';
import { RandomService, globalRNG } from '../../core/RandomService';
import { AgentArchetype, AgentArchetypeGenerator } from './AgentArchetypeGenerators';
import { LongHorizonTelemetryCollector, SimulationTelemetrySummary, TurnTelemetry } from './LongHorizonTelemetry';
import { SimulationNarrativeLLM } from './SimulationNarrativeLLM';
import {
  ACTION_NARRATIVE_BUDGETS,
  resolveNarrativeCategory,
  countWords,
  FORBIDDEN_CLICHE_PATTERNS
} from '../../llm/validators/NarrativeQualityEvaluator';
import { NarrativeJudge } from '../../llm/validators/NarrativeJudge';

export interface LongHorizonRunOptions {
  readonly totalTurns?: number; // default: 1000
  readonly seed?: number;
  readonly archetypes?: readonly AgentArchetype[];
  readonly enableLogging?: boolean;
}

export interface LongHorizonRunResult {
  readonly finalState: CampaignState;
  readonly telemetrySummary: SimulationTelemetrySummary;
  readonly totalDurationMs: number;
}

export class LongHorizonSimulationRunner {
  public static async run(options: LongHorizonRunOptions = {}): Promise<LongHorizonRunResult> {
    const totalTurns = options.totalTurns ?? 1000;
    const seed = options.seed ?? 1337;
    const archetypes: readonly AgentArchetype[] = options.archetypes ?? [
      'BUILDER',
      'MILITARIST',
      'DIPLOMAT',
      'BALANCED'
    ];
    const enableLogging = options.enableLogging ?? false;

    const startTime = Date.now();
    globalRNG.setSeed(seed);
    const rng = new RandomService(seed);
    const telemetry = new LongHorizonTelemetryCollector();

    // 1. Initialize Baseline CampaignState with sustainable reserves
    let state = createInitialState('Landed Knight', 'Central Plains', false);
    state.weeklyLedger.silverdew = 80000;
    state.weeklyLedger.food = 30000;
    state.weeklyLedger.incomeDetail.holdings = 350;
    state.weeklyLedger.expenseDetail.wages = 50;
    state.holdings.type = 'Bastion';

    // Seed memory stores with initial lore
    state.memoryStores = {
      memories: [
        {
          id: 'init_mem_1',
          ownerId: 'player',
          subjectId: 'grey_keep',
          eventType: 'PLAYER_ACTION',
          description: 'A fortaleza de Grey Keep resistiu ao cerco no primeiro ano da aliança.',
          importance: 4,
          tickRegistered: 1,
          decayed: false,
          source: 'OBSERVED',
          tags: ['fortaleza', 'defesa']
        },
        {
          id: 'init_mem_2',
          ownerId: 'player',
          subjectId: 'Casa Blackthorn',
          eventType: 'POLITICAL_EVENT',
          description: 'A Casa Blackthorn enviou mensageiros com termos de trégua nas fronteiras.',
          importance: 3,
          tickRegistered: 1,
          decayed: false,
          source: 'OBSERVED',
          tags: ['diplomacy']
        }
      ],
      knowledge: [
        {
          id: 'init_know_1',
          agentId: 'player',
          factId: 'grey_keep_walls',
          value: 'As fundações de Grey Keep foram erguidas sobre granito sólido.',
          source: 'DIRECT_OBSERVATION',
          certainty: 'CONFIRMED',
          visibility: 'PUBLIC',
          obtainedTurn: 1,
          lastVerifiedTurn: 1
        }
      ],
      relationships: [],
      events: []
    };

    const llm = new SimulationNarrativeLLM(new RandomService(rng.nextInt(1, 999999)));

    // 2. Execute the 1,000 Turns Simulation Loop
    for (let turn = 1; turn <= totalTurns; turn++) {
      try {
        // Phase distribution across 4 archetypes (250 turns each for 1000 turns)
        const phaseSize = Math.max(1, Math.floor(totalTurns / archetypes.length));
        const archetypeIndex = Math.min(archetypes.length - 1, Math.floor((turn - 1) / phaseSize));
        const currentArchetype = archetypes[archetypeIndex];

        const playerInput = AgentArchetypeGenerator.getInput(turn, currentArchetype, rng);

        // A. Resolve any open interactive scenes from incidents so the weekly engine can advance
        if (state.sessionLog?.activeScene && state.sessionLog.activeScene.status === 'OPEN') {
          state.sessionLog.activeScene = {
            ...state.sessionLog.activeScene,
            status: 'RESOLVED'
          };
        }

        // Advance weekly engine turn (1 turn = 1 week of campaign)
        const weeklyResult = resolveWeeklyTurn(state);
        state = weeklyResult.updatedState;

        // B. Simulate progressive addition and natural decay of memory records
        if (state.memoryStores?.memories && turn % 5 === 0) {
          const newMemId = `mem_turn_${turn}`;
          state.memoryStores.memories = [
            ...state.memoryStores.memories,
            {
              id: newMemId,
              ownerId: 'player',
              subjectId: turn % 2 === 0 ? 'palisade' : 'troops',
              eventType: 'PLAYER_ACTION',
              description: `Registro do feudo na semana ${turn} referente às patrulhas e obras.`,
              importance: 1, // Low importance to test decay
              tickRegistered: turn,
              decayed: false,
              source: 'OBSERVED',
              tags: ['feudo', 'rotina']
            }
          ];

          // Apply decay to records older than 40 weeks with importance <= 2
          state.memoryStores.memories = state.memoryStores.memories.map(m => {
            if (turn - m.tickRegistered > 40 && m.importance <= 2) {
              return { ...m, decayed: true };
            }
            return m;
          });
        }

        // C. Run Narrative Cycle (Intent -> Engine -> Salience Gate -> LLM -> Judge -> Fallback)
        const prevRegen = llm.regenerationCount;
        const prevCliche = llm.initialClicheCount;

        const cycleResult = await runNarrativeCycle({
          playerInput,
          state,
          observer: { kind: 'PLAYER', observerId: 'player' },
          llm,
          rng
        });

        state = cycleResult.resultState;
        const finalNarrative = cycleResult.narrative;
        const finalReport = cycleResult.report;
        const finalContext = cycleResult.context;

        // D. Calculate metrics & telemetry
        const action = finalReport.actionExecuted;
        const status = finalReport.status;
        const category = resolveNarrativeCategory(action, status);
        const budget = ACTION_NARRATIVE_BUDGETS[category] || ACTION_NARRATIVE_BUDGETS.DEFAULT;

        const words = countWords(finalNarrative);
        const withinHardMax = words <= budget.hardMaxWords;
        const inTargetRange = words >= budget.targetWords[0] && words <= budget.targetWords[1];

        const regenerated = llm.regenerationCount > prevRegen;
        const initialClicheDetected = llm.initialClicheCount > prevCliche;

        // Was fallback used?
        const fallbackUsed = finalNarrative.includes('conforme registrado nos livros de ferro') ||
                             finalNarrative.includes('obras da fortificação foram iniciadas');

        // Context counts
        const memCount = finalContext.retrievedMemories?.length ?? 0;
        const knowCount = finalContext.retrievedKnowledge?.length ?? 0;
        const relCount = finalContext.relationships?.length ?? 0;

        // Context token estimation of injected prompt payload (~ characters / 4)
        const injectedPromptStr = JSON.stringify({
          scene: finalContext.scene?.locationId,
          region: finalContext.scene?.regionName,
          events: finalReport.events,
          mems: finalContext.retrievedMemories,
          know: finalContext.retrievedKnowledge,
          rels: finalContext.relationships
        });
        const estimatedContextTokens = Math.round(injectedPromptStr.length / 4);

        // First 3 words
        const trimmedWords = finalNarrative.trim().split(/\s+/).slice(0, 3).join(' ').toLowerCase();

        const judgment = NarrativeJudge.judge(finalNarrative, finalContext, finalReport);

        const turnTelemetry: TurnTelemetry = {
          turn,
          category,
          wordCount: words,
          targetWordsRange: budget.targetWords,
          hardMaxWords: budget.hardMaxWords,
          inTargetRange,
          withinHardMax,
          regenerated,
          fallbackUsed,
          initialClicheDetected,
          mechanicalSilence: judgment.mechanicalSilence,
          factualGrounding: judgment.factualGrounding,
          contextMemoriesCount: memCount,
          contextKnowledgeCount: knowCount,
          contextRelationshipsCount: relCount,
          estimatedContextTokens,
          stateSilverdew: state.weeklyLedger.silverdew,
          stateFood: state.weeklyLedger.food,
          firstThreeWords: trimmedWords
        };

        telemetry.recordTurn(turnTelemetry);

        if (enableLogging && (turn % 100 === 0 || turn === totalTurns)) {
          console.log(`[SIM-001] Turno ${turn}/${totalTurns} concluído (${currentArchetype}) - Prata: ${state.weeklyLedger.silverdew}, Comida: ${state.weeklyLedger.food}`);
        }
      } catch (err) {
        telemetry.recordException();
        console.error(`[SIM-001 Fatal] Erro não tratado no turno ${turn}:`, err);
        throw new Error(`[SIM-001 Fatal] Exceção não tratada no turno ${turn}: ${(err as Error).message}`);
      }
    }

    // 3. Deterministic Mechanical Replay Check (Pilar 4: 1.000 Turnos Completos)
    // Run two separate, complete 1,000-turn executions under identical seed and RNG mechanism
    const replayTurns = totalTurns;
    const replaySeed = seed;

    globalRNG.setSeed(replaySeed);
    let replayState1 = createInitialState('Landed Knight', 'Central Plains', false);
    replayState1.weeklyLedger.silverdew = 80000;
    replayState1.weeklyLedger.food = 30000;
    replayState1.weeklyLedger.incomeDetail.holdings = 350;
    replayState1.weeklyLedger.expenseDetail.wages = 50;
    replayState1.holdings.type = 'Bastion';

    for (let r = 1; r <= replayTurns; r++) {
      if (replayState1.sessionLog?.activeScene && replayState1.sessionLog.activeScene.status === 'OPEN') {
        replayState1 = {
          ...replayState1,
          sessionLog: {
            ...replayState1.sessionLog,
            activeScene: { ...replayState1.sessionLog.activeScene, status: 'RESOLVED' }
          }
        };
      }
      replayState1 = resolveWeeklyTurn(replayState1).updatedState;
    }

    globalRNG.setSeed(replaySeed);
    let replayState2 = createInitialState('Landed Knight', 'Central Plains', false);
    replayState2.weeklyLedger.silverdew = 80000;
    replayState2.weeklyLedger.food = 30000;
    replayState2.weeklyLedger.incomeDetail.holdings = 350;
    replayState2.weeklyLedger.expenseDetail.wages = 50;
    replayState2.holdings.type = 'Bastion';

    for (let r = 1; r <= replayTurns; r++) {
      if (replayState2.sessionLog?.activeScene && replayState2.sessionLog.activeScene.status === 'OPEN') {
        replayState2 = {
          ...replayState2,
          sessionLog: {
            ...replayState2.sessionLog,
            activeScene: { ...replayState2.sessionLog.activeScene, status: 'RESOLVED' }
          }
        };
      }
      replayState2 = resolveWeeklyTurn(replayState2).updatedState;
    }

    const snapshot1 = createCanonicalMechanicalSnapshot(replayState1);
    const snapshot2 = createCanonicalMechanicalSnapshot(replayState2);

    const parityMatch = snapshot1 === snapshot2;
    telemetry.setMechanicalReplayParity(parityMatch);

    const totalDurationMs = Date.now() - startTime;
    return {
      finalState: state,
      telemetrySummary: telemetry.getSummary(),
      totalDurationMs
    };
  }
}

/**
 * Serializa o estado mecânico canônico completo de CampaignState para comparação estrita bit-a-bit,
 * normalizando apenas metadados de sessão em tempo real não mecânicos.
 */
export function createCanonicalMechanicalSnapshot(state: CampaignState): string {
  const clone = JSON.parse(JSON.stringify(state));
  if (clone.sessionLog) {
    delete clone.sessionLog.lastSessionDate;
  }
  return JSON.stringify(clone);
}

import * as fs from 'fs';
import * as path from 'path';
import { CampaignState } from '../types';
import { createInitialState, resolveWeeklyTurn } from '../engine';
import { runNarrativeCycle, NarrativeCycleResult } from '../lib/narrativeCycle';
import { MockNarrativeLLM } from '../lib/mockNarrativeLLM';
import { NarrativeObserver } from '../lib/narrativeContracts';
import { RandomService } from '../core/RandomService';
import { IncidentNarrativeTranslator, buildProceduralIncidentNarrative } from '../domain/events/narrative/IncidentNarrativeTranslator';
import { IncidentNarrativeResponse } from '../domain/events/narrative/IncidentNarrativeContracts';

export interface CausalTraceLogEntry {
  turn: number;
  date: string;
  playerInput: string;
  classifiedAction: string;
  engineResult: {
    status: string;
    actionExecuted: string;
    reasonCode: string;
    mutated: boolean;
    actionMutatedState: boolean;
    discoveredInformation?: readonly any[];
  };
  stateBefore: {
    silverdew: number;
    food: number;
    laborPool: number;
    garrison: number;
  };
  stateAfter: {
    silverdew: number;
    food: number;
    laborPool: number;
    garrison: number;
  };
  actionMutatedState: boolean;
  actionDeltas: Array<{ path: string; before: unknown; after: unknown; delta?: number }>;
  systemWeeklyDeltas: Record<string, number>;
  weeklyDeltas: Record<string, number>;
  totalDeltas: Record<string, number>;
  totalStateChanged: boolean;
  stateDeltas: Array<{ path: string; before: unknown; after: unknown; delta?: number }>;
  weeklyFinancials: {
    income: number;
    holdingMaintenance: number;
    garrisonCost: number;
    excessSpoilage: number;
    finalSilverdew: number;
    finalFood: number;
  };
  narrativeContextSummary: {
    knownFactsCount: number;
    relationshipsCount: number;
  };
  llmResponse: string;
  semanticValidationViolations: string[];
  /** Clarification loop data — present only when clarification was involved. */
  clarification?: {
    /** The original input that triggered the ambiguous interpretation. */
    originalInput?: string;
    /** The question asked by the Master. */
    masterQuestion?: string;
    /** Structured options offered to the player. */
    options?: Array<{ id: string; label: string; semanticValue: string }>;
    /** The player's clarification answer (free text or button label). */
    playerAnswer?: string;
    /** The semantic value if the player clicked a button. */
    selectedOption?: string;
    /** Current clarification round (1 or 2). */
    round?: number;
    /** Whether the clarification was resolved or exhausted. */
    resolution: 'RESOLVED' | 'EXHAUSTED' | 'NORMAL_TURN';
  };
}

const PLAYTEST_STATE_FILE = path.resolve(process.cwd(), 'artifacts/playtest_campaign_state.json');
const PLAYTEST_TRACE_FILE = path.resolve(process.cwd(), 'artifacts/playtest_causal_traces.jsonl');

export function loadOrCreatePlaytestState(): CampaignState {
  if (fs.existsSync(PLAYTEST_STATE_FILE)) {
    return JSON.parse(fs.readFileSync(PLAYTEST_STATE_FILE, 'utf-8'));
  }
  const s = createInitialState('Landed Knight', 'Florestas do Rio');
  s.character.name = 'Sir Cedric de Ravenhold';
  s.character.house = 'Ravenhold';
  s.holdings.name = "Raven's Watch";
  s.holdings.type = 'Bastion';
  s.holdings.population = 1000;
  s.holdings.garrison = 20;
  s.holdings.laborPool = 120;
  s.weeklyLedger.silverdew = 300;
  s.weeklyLedger.food = 40;
  s.character.stats.commanderTier = 2;
  s.character.reputation = 10;
  s.advisors = {
    counselorName: 'Tobin',
    stewardName: 'Gerold',
    spyMasterName: 'Roric'
  };
  s.worldSecrets = [
    {
      id: 'sec_iron_1',
      title: 'Batedores de Ironpeak',
      description: 'Patrulhas ligeiras da Casa Ironhand foram enviadas para testar as sentinelas de Ravenhold.',
      revealed: false,
      investigationProgress: 0,
      category: 'Military'
    }
  ];
  savePlaytestState(s);
  return s;
}

export function savePlaytestState(state: CampaignState): void {
  const dir = path.dirname(PLAYTEST_STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PLAYTEST_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

export function appendCausalTrace(entry: CausalTraceLogEntry): void {
  const dir = path.dirname(PLAYTEST_TRACE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(PLAYTEST_TRACE_FILE, JSON.stringify(entry) + '\n', 'utf-8');
}

/**
 * Executes a pure playtest turn through the canonical authoritative pipeline.
 * NO state pre-mutation or manual adjustments are allowed.
 */
export async function executePlaytestTurnPristine(playerInput: string): Promise<{
  cycleResult: NarrativeCycleResult;
  weeklyReport: ReturnType<typeof resolveWeeklyTurn>;
  traceEntry: CausalTraceLogEntry;
  incidentNarratives: readonly IncidentNarrativeResponse[];
}> {
  const state = loadOrCreatePlaytestState();
  const observer: NarrativeObserver = {
    kind: 'PLAYER',
    observerId: 'player'
  };

  const llm = new MockNarrativeLLM();
  const rng = new RandomService((Date.now() + Math.floor(Math.random() * 10000)) % 100000);

  const stateBefore = {
    silverdew: state.weeklyLedger.silverdew,
    food: state.weeklyLedger.food,
    laborPool: state.holdings.laborPool,
    garrison: state.holdings.garrison
  };

  // 1. Authoritative Narrative Cycle (Player Input -> Interpretation -> Rules -> ExecutionReport -> Context -> LLM)
  const cycleResult = await runNarrativeCycle({
    playerInput,
    state,
    observer,
    llm,
    rng
  });

  const stateAfterAction = cycleResult.resultState;

  // 2. Authoritative Weekly Turn Resolution (Turn, Economy, Upkeep, Spoilage, Seasons)
  const weeklyReport = resolveWeeklyTurn(stateAfterAction);
  const finalState = weeklyReport.updatedState;

  // 3. Incident Narrative Layer (M18.9-E) — strictly post-engine, read-only
  // Translate each emergent event produced this turn into sensory prose.
  // The Translator is a pure projection: it never modifies CampaignState.
  const incidentNarratives: IncidentNarrativeResponse[] = [];
  const eventsProcessed = weeklyReport.turnResult.incidentResult?.eventsProcessed ?? [];
  for (const eventRecord of eventsProcessed) {
    try {
      const narrative = await IncidentNarrativeTranslator.translateIncidentOpened(
        eventRecord,
        finalState,
        llm
      );
      incidentNarratives.push(narrative);
    } catch {
      // Fail-safe: fallback procedural narrative, never block turn
      incidentNarratives.push(buildProceduralIncidentNarrative({
        kind: 'ATMOSPHERIC_INCIDENT',
        mechanicalFacts: {
          eventId: eventRecord.eventId,
          eventType: eventRecord.descriptionContext.eventType,
          magnitude: eventRecord.magnitude,
          domain: eventRecord.domain,
          absoluteTurn: eventRecord.turnOccurred,
          timeCostSummary: eventRecord.timeCost,
          mutationsSummary: []
        },
        context: eventRecord.descriptionContext
      }));
    }
  }

  // Save the modified authoritative final state
  savePlaytestState(finalState);

  const stateAfter = {
    silverdew: Number(finalState.weeklyLedger.silverdew.toFixed(1)),
    food: Number(finalState.weeklyLedger.food.toFixed(1)),
    laborPool: finalState.holdings.laborPool,
    garrison: finalState.holdings.garrison
  };

  const actionDeltas = cycleResult.report.stateChanges.map(sc => ({
    path: sc.path,
    before: sc.before,
    after: sc.after,
    delta: sc.delta
  }));

  const weeklyDeltas: Record<string, number> = {
    'weeklyLedger.silverdew': Number((finalState.weeklyLedger.silverdew - stateAfterAction.weeklyLedger.silverdew).toFixed(1)),
    'weeklyLedger.food': Number((finalState.weeklyLedger.food - stateAfterAction.weeklyLedger.food).toFixed(1))
  };

  const totalDeltas: Record<string, number> = {
    'weeklyLedger.silverdew': Number((finalState.weeklyLedger.silverdew - stateBefore.silverdew).toFixed(1)),
    'weeklyLedger.food': Number((finalState.weeklyLedger.food - stateBefore.food).toFixed(1))
  };
  for (const ad of actionDeltas) {
    if (ad.delta !== undefined && !totalDeltas[ad.path]) {
      totalDeltas[ad.path] = ad.delta;
    }
  }

  const actionMutatedState = (cycleResult as any).actionMutatedState ?? (cycleResult.report.stateChanges.length > 0);
  const totalStateChanged = Object.values(totalDeltas).some(d => d !== 0);

  const traceEntry: CausalTraceLogEntry = {
    turn: finalState.worldLedger.currentDate.week,
    date: `${finalState.worldLedger.currentDate.month}, Ano ${finalState.worldLedger.currentDate.year}, Semana ${finalState.worldLedger.currentDate.week}`,
    playerInput,
    classifiedAction: cycleResult.command.action,
    engineResult: {
      status: cycleResult.report.status,
      actionExecuted: cycleResult.report.actionExecuted,
      reasonCode: cycleResult.report.reasonCode,
      mutated: cycleResult.report.stateChanges.length > 0,
      actionMutatedState,
      discoveredInformation: cycleResult.report.discoveredInformation
    },
    stateBefore,
    stateAfter,
    actionMutatedState,
    actionDeltas,
    systemWeeklyDeltas: weeklyDeltas,
    weeklyDeltas,
    totalDeltas,
    totalStateChanged,
    stateDeltas: actionDeltas,
    weeklyFinancials: {
      income: 92.5,
      holdingMaintenance: 70,
      garrisonCost: 8,
      excessSpoilage: Number((weeklyReport.turnResult.foodChanges < 0 ? Math.abs(weeklyReport.turnResult.foodChanges) : 0).toFixed(1)),
      finalSilverdew: stateAfter.silverdew,
      finalFood: stateAfter.food
    },
    narrativeContextSummary: {
      knownFactsCount: cycleResult.context.knownFacts.length,
      relationshipsCount: cycleResult.context.relationships.length
    },
    llmResponse: cycleResult.narrative,
    semanticValidationViolations: cycleResult.validation.map(v => v.message),
    clarification: cycleResult.clarificationTrace ?? { resolution: 'NORMAL_TURN' }
  };

  appendCausalTrace(traceEntry);

  return {
    cycleResult,
    weeklyReport,
    traceEntry,
    incidentNarratives
  };
}

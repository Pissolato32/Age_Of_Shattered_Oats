import { CampaignState } from '../../types';
import { EventOpportunityEngine, OpportunityContext, CurrentActivity } from './EventOpportunityEngine';
import { DeterministicEventRNG } from './DeterministicEventRNG';
import { DEFAULT_EVENT_COOLDOWNS } from './CooldownPolicy';
import { createEventRecord } from './EventRecordFactory';
import { processEvent } from './EventProcessor';
import { EventRecord, SceneState } from './models';

export interface EmergentIncidentResolutionResult {
  readonly updatedState: CampaignState;
  readonly eventLogs: readonly string[];
  readonly openedScene?: SceneState;
  readonly eventsProcessed: readonly EventRecord[];
}

/**
 * EmergentIncidentPipeline (M18.9-C4)
 *
 * Authoritative orchestrator for evaluating, selecting, and processing emergent incidents
 * within the weekly turn lifecycle without corrupting the macro economic simulation.
 *
 * Invariants:
 * 1. Single Mechanical Authority: Only EventProcessor applies mutations to CampaignState.
 * 2. Slot Interruption: If slot 0 instantiates an OPEN scene, slot 1 is strictly suppressed.
 * 3. Determinism: 100% reproducible via DeterministicEventRNG and composite seed.
 * 4. Fail-Closed: Does not run if an active scene is already OPEN.
 * 5. Calendar Unmodified: Incident processing never advances week, season, or turn.
 */
export function resolveEmergentIncidents(
  state: CampaignState,
  absoluteTurn: number,
  campaignSeed: string
): EmergentIncidentResolutionResult {
  // Fail-closed invariant: If an active scene is OPEN, block incident generation
  if (state.sessionLog?.activeScene && state.sessionLog.activeScene.status === 'OPEN') {
    throw new Error(
      `EmergentIncidentPipeline: Cannot process weekly incidents while scene "${state.sessionLog.activeScene.sceneId}" is OPEN`
    );
  }

  let currentState: CampaignState = JSON.parse(JSON.stringify(state));
  const eventLogs: string[] = [];
  const eventsProcessed: EventRecord[] = [];

  // 1. Initialize and tick cooldowns in sessionLog
  if (!currentState.sessionLog) {
    currentState.sessionLog = {
      lastSessionDate: '',
      lastThingHappened: '',
      activeMissions: [],
      pendingDecisions: []
    };
  }

  const existingCooldowns: Record<string, number> = currentState.sessionLog.eventCooldowns || {};
  const updatedCooldowns: Record<string, number> = {};

  for (const [oppId, remaining] of Object.entries(existingCooldowns)) {
    if (typeof remaining === 'number' && remaining > 1) {
      updatedCooldowns[oppId] = remaining - 1;
    }
  }
  currentState.sessionLog.eventCooldowns = updatedCooldowns;

  // 2. Determine Primary Activity / Domain for Opportunity Context
  let currentActivity: CurrentActivity = 'HOLDING';
  const travelMission = currentState.sessionLog?.activeMissions?.find(
    m => m.type?.toLowerCase().includes('travel') || m.type?.toLowerCase().includes('patrol')
  );
  if (travelMission) {
    currentActivity = 'TRAVEL';
  }

  const context: OpportunityContext = {
    activity: currentActivity,
    locationId: currentState.character?.location?.landmark,
    subregion: currentState.character?.location?.subregion,
    currentTurn: absoluteTurn,
    eventCooldowns: updatedCooldowns
  };

  // 3. Evaluate candidate opportunities matching current domain activity
  const evaluatedOpportunities = EventOpportunityEngine.evaluateOpportunities(currentState, context);
  const eligibleOpportunities = evaluatedOpportunities.filter(opp => {
    if (!opp.eligible || opp.weight <= 0) return false;
    if (currentActivity === 'HOLDING') {
      return opp.tags.includes('flavor') || opp.tags.includes('atmosfera') || opp.tags.includes('celeiros') || opp.tags.includes('fome');
    } else if (currentActivity === 'TRAVEL') {
      return opp.tags.includes('viagem') || opp.tags.includes('estrada') || opp.tags.includes('fronteira');
    } else if (currentActivity === 'BUILD') {
      return opp.tags.includes('construcao') || opp.tags.includes('obras');
    } else if (currentActivity === 'TRADE') {
      return opp.tags.includes('comercio') || opp.tags.includes('mercado');
    } else if (currentActivity === 'DIPLOMACY') {
      return opp.tags.includes('diplomacia') || opp.tags.includes('embaixada');
    }
    return true;
  });

  if (eligibleOpportunities.length === 0) {
    return {
      updatedState: currentState,
      eventLogs: [],
      openedScene: undefined,
      eventsProcessed: []
    };
  }

  // 4. Process deterministic slots (max 2 slots: slot 0 and slot 1)
  const MAX_SLOTS = 2;
  for (let slotIndex = 0; slotIndex < MAX_SLOTS; slotIndex++) {
    // If an earlier slot opened a scene, interrupt immediately
    if (currentState.sessionLog.activeScene && currentState.sessionLog.activeScene.status === 'OPEN') {
      break;
    }

    const domain = currentActivity;
    const selection = DeterministicEventRNG.selectEvent({
      campaignSeed,
      absoluteTurn,
      slotIndex,
      domain,
      opportunities: eligibleOpportunities,
      cooldownOverrides: currentState.sessionLog.eventCooldowns
    });

    const selectedOpp = selection.selected;
    if (!selectedOpp) {
      continue;
    }

    // Register cooldown for selected opportunity
    const cooldownDuration = DEFAULT_EVENT_COOLDOWNS[selectedOpp.eventType] ?? 4;
    currentState.sessionLog.eventCooldowns[selectedOpp.opportunityId] = cooldownDuration;

    // Create deterministic EventRecord
    const eventRecord = createEventRecord(selectedOpp, absoluteTurn, slotIndex, domain);
    eventsProcessed.push(eventRecord);

    // If the event opened an interactive scene
    if (eventRecord.scene && eventRecord.scene.status === 'OPEN') {
      currentState.sessionLog.activeScene = eventRecord.scene;
      eventLogs.push(`[INCIDENTE EMERGENTE] ${selectedOpp.eventType}: Uma situação exige a decisão da comitiva.`);
      // Slot 0 opened a scene -> break immediately, suppressing slot 1
      break;
    } else if (eventRecord.mutations.length > 0) {
      // Event with mechanical mutations applied by authoritative EventProcessor
      const processResult = processEvent(eventRecord, currentState);
      currentState = processResult.nextState;
      eventLogs.push(`[INCIDENTE EMERGENTE] ${selectedOpp.eventType}: Efeitos mecânicos registrados.`);
    } else {
      // Pure flavor event without mechanical mutations
      eventLogs.push(`[INCIDENTE EMERGENTE] ${selectedOpp.eventType}: Ocorrência atmosférica observada.`);
    }
  }

  return {
    updatedState: currentState,
    eventLogs,
    openedScene: currentState.sessionLog.activeScene,
    eventsProcessed
  };
}

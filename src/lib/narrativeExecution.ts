import { CampaignState } from '../types';
import { getAbsoluteCampaignTurn } from '../engine';
import { globalRNG, RandomService } from '../core/RandomService';
import { globalEventStore } from '../core/EventStore';
import {
  AffectedEntity,
  CheckpointInfo,
  ExecutionConsequence,
  ExecutionReport,
  ExecutionStatus,
  MagnitudeRequest,
  NarrativeAction,
  NarrativeCommand,
  RelevantEvent,
  ResolvedMagnitude,
  StateValue
} from './narrativeContracts';
import { applyResolutionToState, resolveAction, RuleResolutionResult } from './ruleResolver';
import { resolveMagnitude } from './magnitudeResolution';
import { classifyNarrativeCommand, CANONICALLY_RESOLVED_DOMAINS } from './actionClassifier';
import { resolveGenericPlausibleAction } from './genericResolution';

/**
 * Authoritative NarrativeCommand -> Engine resolution boundary.
 *
 * The Engine remains the single mechanical authority. This module only:
 *  1. maps a structured NarrativeCommand onto the existing deterministic resolver;
 *  2. applies the existing deterministic resolution to an immutable input state;
 *  3. represents the real consequences as an ExecutionReport of deltas/facts.
 *
 * It never duplicates rules, never invents consequences, never embeds CampaignState
 * (or any snapshot of it) into the report, and never receives or exposes formulas,
 * ranges, weights or hidden state to any layer downstream of this boundary.
 */

export interface NarrativeResolutionResult {
  readonly report: ExecutionReport;
  /** The resulting state. A cloned state when the resolution mutated resources; the same reference otherwise. The input is never mutated. */
  readonly state: CampaignState;
  readonly mutated: boolean;
}

/**
 * Contract-mandated command cleanup: a command still requiring clarification has
 * no mechanical meaning yet and must not enter rule resolution.
 */
const UNRESOLVED_REASON = 'O comando exige esclarecimento e não foi submetido à resolução mecânica.';

/**
 * Identity fields each action requires to carry mechanical meaning. A command
 * missing every accepted field for its action is rejected for clarification
 * instead of falling back to a silent default target.
 */
const REQUIRED_PARAMETERS: Readonly<Record<string, readonly string[]>> = {
  BUILD: ['objectId', 'targetId'],
  TRAVEL: ['locationId', 'targetId'],
  TRADE: ['objectId', 'targetId']
};

function validateRequiredIdentity(command: NarrativeCommand): string | null {
  const accepted = REQUIRED_PARAMETERS[command.action];
  if (!accepted) return null;

  const present = accepted.some(key => {
    const value = command[key as keyof NarrativeCommand];
    return value !== undefined && value !== null && value !== '';
  });
  if (present) return null;

  return `O comando ${command.action} exige esclarecimento: identifique o alvo (${accepted.join(' ou ')}) para a resolução mecânica.`;
}

/**
 * Engine-side parameter allow-list. Only keys the existing rules actually consume
 * are accepted; anything else produces an authoritative rejection instead of
 * being silently ignored.
 */
const PARAMETER_ALLOW_LISTS: Readonly<Record<string, readonly string[]>> = {
  RECRUIT: ['quantity'],
  BUILD: [],
  TRAVEL: [],
  TRADE: [],
  INFORMATION: [],
  FLAVOR_QUERY: []
};

function validateParameters(command: NarrativeCommand): string | null {
  const allowList = PARAMETER_ALLOW_LISTS[command.action];
  if (!allowList) return null;

  const params = command.parameters ?? {};
  for (const key of Object.keys(params)) {
    if (!allowList.includes(key)) {
      return `UNKNOWN_PARAMETER: parâmetro "${key}" não é suportado para a ação ${command.action}.`;
    }
  }

  if (command.action === 'RECRUIT') {
    const quantity = params['quantity'];
    if (quantity !== undefined && (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1)) {
      return 'INVALID_PARAMETER: "quantity" deve ser um inteiro positivo para RECRUIT.';
    }
  }

  return null;
}

function mapActionToIntent(action: NarrativeCommand['action']): RuleResolutionResult['intent'] {
  switch (action) {
    case 'RECRUIT':
      return 'RECRUIT';
    case 'BUILD':
      return 'BUILD';
    case 'TRAVEL':
      return 'TRAVEL';
    case 'TRADE':
      return 'TRADE';
    case 'INFORMATION':
      return 'INFORMATION';
    case 'FLAVOR_QUERY':
      return 'FLAVOR_INQUIRY';
    case 'CRAFT':
      return 'CRAFT';
    default:
      return 'UNKNOWN_MECHANIC';
  }
}

function rejectionReport(
  command: NarrativeCommand,
  state: CampaignState,
  reason: string
): NarrativeResolutionResult {
  return {
    report: buildExecutionReport(
      command,
      {
        intent: mapActionToIntent(command.action),
        decision: 'DENIED',
        authority: 'NOT_FOUND',
        conditions: [],
        effects: [],
        evidence: [],
        mechanicalAllowed: false,
        decisionReason: reason,
        webFlavorAllowed: false
      },
      state,
      state,
      false
    ),
    state,
    mutated: false
  };
}

/**
 * Maps each supported NarrativeAction to the canonical phrase the existing
 * deterministic resolver already understands. RECRUIT is intentionally absent:
 * its magnitude is resolved by the MRS before the phrase is built, so no numeric
 * default can ever leak into the mechanical path. Unsupported actions fall back
 * to an empty phrase, which the resolver authoritatively rejects as NOT_FOUND:
 * the Engine currently has no mechanic for them, and no mechanic may be invented.
 */
function toCanonicalPhrase(command: NarrativeCommand): string {
  switch (command.action) {
    case 'BUILD':
      return command.objectId ? `construir ${command.objectId}` : 'construir palisada de madeira';
    case 'TRAVEL':
      return `viajar para ${command.targetId ?? 'fronteira'}`;
    case 'TRADE':
      return command.desiredOutcome || `comprar ${command.objectId ?? 'mantimentos'}`;
    case 'INFORMATION':
      return `quanto custa ${command.objectId ?? 'recrutamento'}`;
    case 'FLAVOR_QUERY':
      return 'protocolo de apresentacao';
    default:
      return command.desiredOutcome || '';
  }
}

function mapIntentToAction(intent: RuleResolutionResult['intent']): NarrativeAction {
  switch (intent) {
    case 'RECRUIT':
      return 'RECRUIT';
    case 'CRAFT':
      return 'CRAFT';
    case 'BUILD':
      return 'BUILD';
    case 'TRAVEL':
      return 'TRAVEL';
    case 'TRADE':
      return 'TRADE';
    case 'INFORMATION':
      return 'INFORMATION';
    case 'FLAVOR_INQUIRY':
      return 'FLAVOR_QUERY';
    default:
      return 'UNKNOWN';
  }
}

function mapStatus(resolution: RuleResolutionResult): ExecutionStatus {
  if (resolution.decision === 'ALLOWED' && resolution.mechanicalAllowed) return 'ACCEPTED';
  if (resolution.decision === 'AMBIGUOUS') return 'AMBIGUOUS';
  return 'REJECTED';
}

/**
 * Reads the single primitive value currently represented by a resolver resource
 * path. Only paths the existing applier mutates are readable; anything else is
 * skipped from the report instead of being invented.
 */
function readResourceValue(state: CampaignState, path: string): number | undefined {
  switch (path) {
    case 'weeklyLedger.silverdew':
      return state.weeklyLedger.silverdew;
    case 'weeklyLedger.food':
      return state.weeklyLedger.food;
    case 'holdings.laborPool':
      return state.holdings.laborPool;
    case 'materials.timber':
      return state.weeklyLedger.materials.timber;
    case 'materials.iron':
      return state.weeklyLedger.materials.iron;
    case 'materials.stone':
      return state.weeklyLedger.materials.stone;
    case 'army.units.levies':
      return (state.army?.units ?? []).filter(u => u.type === 'Levy').reduce((sum, u) => sum + u.size, 0);
    default:
      return undefined;
  }
}

interface EffectReportData {
  path: string;
  before: number;
  after: number;
  delta: number;
}

function collectEffectDeltas(
  resolution: RuleResolutionResult,
  inputState: CampaignState,
  updatedState: CampaignState
): EffectReportData[] {
  const deltas: EffectReportData[] = [];
  for (const effect of resolution.effects) {
    if (typeof effect.delta !== 'number') continue;
    const before = readResourceValue(inputState, effect.resource);
    const after = readResourceValue(updatedState, effect.resource);
    if (before === undefined || after === undefined) continue;
    deltas.push({ path: effect.resource, before, after, delta: after - before });
  }
  return deltas;
}

function describeEntity(path: string): AffectedEntity {
  switch (path) {
    case 'weeklyLedger.silverdew':
      return { entityId: 'silverdew', entityType: 'RESOURCE', role: 'AFFECTED' };
    case 'weeklyLedger.food':
      return { entityId: 'food', entityType: 'RESOURCE', role: 'AFFECTED' };
    case 'holdings.laborPool':
      return { entityId: 'laborPool', entityType: 'HOLDING', role: 'AFFECTED' };
    case 'materials.timber':
      return { entityId: 'timber', entityType: 'RESOURCE', role: 'AFFECTED' };
    case 'materials.iron':
      return { entityId: 'iron', entityType: 'RESOURCE', role: 'AFFECTED' };
    case 'materials.stone':
      return { entityId: 'stone', entityType: 'RESOURCE', role: 'AFFECTED' };
    case 'army.units.levies':
      return { entityId: 'levies', entityType: 'ARMY', role: 'AFFECTED' };
    default:
      return { entityId: path, entityType: 'RESOURCE', role: 'AFFECTED' };
  }
}

function describeConsequence(path: string, delta: number): string {
  switch (path) {
    case 'weeklyLedger.silverdew':
      return `Tesouro em silverdew ajustado em ${delta} SD.`;
    case 'weeklyLedger.food':
      return `Estoque de alimentos ajustado em ${delta} FSU.`;
    case 'holdings.laborPool':
      return `Mão de obra do feudo ajustada em ${delta} homens.`;
    case 'materials.timber':
      return `Estoque de madeira ajustado em ${delta} unidade(s).`;
    case 'materials.iron':
      return `Estoque de ferro ajustado em ${delta} unidade(s).`;
    case 'materials.stone':
      return `Estoque de pedra ajustado em ${delta} unidade(s).`;
    case 'army.units.levies':
      return `Tropas de levy ajustadas em ${delta} soldados.`;
    default:
      return `Recurso "${path}" ajustado em ${delta}.`;
  }
}

function buildExecutionReport(
  command: NarrativeCommand,
  resolution: RuleResolutionResult,
  inputState: CampaignState,
  updatedState: CampaignState,
  mutated: boolean,
  magnitude?: ResolvedMagnitude
): ExecutionReport {
  const reportId = `report-${command.commandId}`;
  const actionExecuted = mapIntentToAction(resolution.intent);
  const status = mapStatus(resolution);
  const deltas = mutated ? collectEffectDeltas(resolution, inputState, updatedState) : [];

  const stateChanges = deltas.map(d => ({
    path: d.path,
    before: d.before as StateValue,
    after: d.after as StateValue,
    delta: d.delta
  }));

  const affectedEntities: AffectedEntity[] = [{ entityId: command.actorId, entityType: 'CHARACTER', role: 'ACTOR' }];
  for (const d of deltas) {
    const entity = describeEntity(d.path);
    affectedEntities.push({ entityId: entity.entityId, entityType: entity.entityType, role: 'AFFECTED' });
  }

  const consequences: ExecutionConsequence[] = deltas.map((d, index) => ({
    consequenceId: `${reportId}:c${index}`,
    kind: 'IMMEDIATE',
    description: describeConsequence(d.path, d.delta),
    authorized: true
  }));

  const events: RelevantEvent[] =
    status === 'ACCEPTED' && mutated
      ? [
          {
            eventId: `${reportId}:e0`,
            eventType: actionExecuted,
            summary: `Ação "${actionExecuted}" executada pelo Engine.`,
            week: updatedState.worldLedger.currentDate.week,
            knowledgeTier: 'PLAYER_KNOWLEDGE'
          }
        ]
      : [];

  let checkpoint: CheckpointInfo | undefined = undefined;
  if (status === 'ACCEPTED' && actionExecuted === 'BUILD') {
    const isNewFortification = !inputState.holdings?.fortification || inputState.holdings.fortification.tier === 0;
    checkpoint = {
      kind: isNewFortification ? 'START_CHECKPOINT' : 'COMPLETION_CHECKPOINT',
      projectType: command.objectId || 'Paliçada Defensiva',
      progressDescription: isNewFortification
        ? 'Fundação e estaqueamento de madeira iniciados nos limites do feudo, com alocação dos mestres de obra e materiais.'
        : 'Reforço defensivo finalizado e guarnecido pelos homens de armas.'
    };
  }

  return {
    contractVersion: command.contractVersion,
    reportId,
    command: {
      commandId: command.commandId,
      actorId: command.actorId,
      action: command.action,
      targetId: command.targetId,
      objectId: command.objectId,
      locationId: command.locationId
    },
    status,
    actionExecuted,
    affectedEntities,
    stateChanges,
    consequences,
    discoveredInformation: [],
    hiddenInformationIds: [],
    events,
    reasonCode: resolution.decisionReason,
    ...(status === 'ACCEPTED' && actionExecuted === 'RECRUIT' && magnitude !== undefined ? { magnitude } : {}),
    ...(checkpoint !== undefined ? { checkpoint } : {})
  };
}

/**
 * Authoritative resolution boundary: NarrativeCommand -> Engine -> ExecutionReport.
 *
 * Deterministic for the same command/state/rule version/rng seed. The injected
 * RandomService is consumed ONLY for ENGINE_DETERMINED/RANGE magnitude draws
 * (production uses the shared globalRNG; tests inject local instances). The
 * input state is never mutated; a cloned resulting state is returned when
 * resources changed.
 */
export function resolveNarrativeCommand(
  command: NarrativeCommand,
  state: CampaignState,
  rng: RandomService = globalRNG
): NarrativeResolutionResult {
  const classification = classifyNarrativeCommand(command, state);

  if (classification.type === 'AMBIGUOUS') {
    return {
      report: buildExecutionReport(
        command,
        {
          intent: 'UNKNOWN_MECHANIC',
          decision: 'NOT_FOUND',
          authority: 'NOT_FOUND',
          conditions: [],
          effects: [],
          evidence: [],
          mechanicalAllowed: false,
          decisionReason: classification.reason,
          webFlavorAllowed: false
        },
        state,
        state,
        false
      ),
      state,
      mutated: false
    };
  }

  if (classification.type === 'IMPOSSIBLE') {
    return rejectionReport(command, state, classification.reason);
  }

  if (classification.type === 'PLAUSIBLE_UNMODELED') {
    const genericRes = resolveGenericPlausibleAction(
      {
        action: command.action,
        targetId: command.targetId,
        parameters: command.parameters as Record<string, unknown>
      },
      state,
      rng
    );

    const isSuccess = genericRes.outcome === 'SUCCESS' || genericRes.outcome === 'PARTIAL_SUCCESS';
    let updatedState = state;
    let mutated = false;

    if (genericRes.stateChanges.length > 0) {
      updatedState = JSON.parse(JSON.stringify(state)) as CampaignState;
      for (const sc of genericRes.stateChanges) {
        if (sc.path === 'weeklyLedger.silverdew' && typeof sc.delta === 'number') {
          updatedState.weeklyLedger.silverdew += sc.delta;
          mutated = true;
        } else if (sc.path === 'holdings.laborPool' && typeof sc.delta === 'number') {
          updatedState.holdings.laborPool += sc.delta;
          mutated = true;
        }
      }
    }

    let checkpoint: CheckpointInfo | undefined = undefined;
    if (isSuccess && command.action === 'BUILD') {
      const isCompleted = false;
      checkpoint = {
        kind: isCompleted ? 'COMPLETION_CHECKPOINT' : 'START_CHECKPOINT',
        projectType: command.objectId || 'Paliçada Defensiva',
        progressDescription: isCompleted
          ? 'Reforço defensivo finalizado e guarnecido pelos homens de armas.'
          : 'Fundação e estaqueamento de madeira iniciados nos limites do feudo, com alocação dos mestres de obra e materiais.'
      };
    }

    const report: ExecutionReport = {
      contractVersion: command.contractVersion,
      reportId: `rep_gen_${rng.nextInt(100000, 999999)}`,
      command: {
        commandId: command.commandId,
        actorId: command.actorId,
        action: command.action,
        targetId: command.targetId,
        objectId: command.objectId,
        locationId: command.locationId
      },
      status: isSuccess ? 'ACCEPTED' : 'REJECTED',
      actionExecuted: command.action,
      reasonCode: genericRes.reason,
      affectedEntities: genericRes.stateChanges.map(sc => describeEntity(sc.path)),
      stateChanges: genericRes.stateChanges,
      consequences: genericRes.consequences,
      discoveredInformation: [],
      hiddenInformationIds: [],
      events: [],
      magnitude: genericRes.magnitude !== undefined ? {
        mode: 'ENGINE_DETERMINED',
        value: genericRes.magnitude,
        source: genericRes.source,
        min: genericRes.magnitude,
        max: genericRes.magnitude
      } : undefined,
      ...(checkpoint !== undefined ? { checkpoint } : {})
    };

    return {
      report,
      state: updatedState,
      mutated
    };
  }

  // Canonical pipeline
  const paramViolation = validateParameters(command);
  if (paramViolation !== null) {
    return rejectionReport(command, state, paramViolation);
  }

  const identityViolation = validateRequiredIdentity(command);
  if (identityViolation !== null) {
    return rejectionReport(command, state, identityViolation);
  }

  let phrase = toCanonicalPhrase(command);
  let magnitude: ResolvedMagnitude | undefined;

  if (command.action === 'RECRUIT') {
    const request: MagnitudeRequest | undefined =
      command.magnitude ??
      (typeof command.parameters?.quantity === 'number'
        ? { mode: 'FIXED', value: command.parameters.quantity }
        : undefined);

    const magnitudeResolution = resolveMagnitude('RECRUIT', request, state, rng);
    if (!magnitudeResolution.feasible || magnitudeResolution.value === undefined) {
      return rejectionReport(
        command,
        state,
        magnitudeResolution.reason ?? 'Recrutamento RECUSADO (MAGNITUDE). Nenhuma quantidade foi liberada.'
      );
    }

    magnitude = {
      mode: magnitudeResolution.mode,
      value: magnitudeResolution.value,
      source: magnitudeResolution.source,
      min: magnitudeResolution.min ?? magnitudeResolution.value,
      max: magnitudeResolution.max ?? magnitudeResolution.value
    };
    phrase = `recrutar ${magnitude.value} soldados`;
  }

  if (!CANONICALLY_RESOLVED_DOMAINS.has(command.action)) {
    const isSilenceAction =
      (command.action === 'DIPLOMACY' || command.action === 'SOCIAL') &&
      (command.desiredOutcome?.toLowerCase().includes('silêncio') || command.desiredOutcome?.toLowerCase().includes('silencio') || command.stance === 'CAUTIOUS');

    if (isSilenceAction) {
      const report: ExecutionReport = {
        contractVersion: command.contractVersion,
        reportId: `rep_silence_${rng.nextInt(100000, 999999)}`,
        command: {
          commandId: command.commandId,
          actorId: command.actorId,
          action: command.action,
          targetId: command.targetId,
          objectId: command.objectId,
          locationId: command.locationId
        },
        status: 'ACCEPTED',
        actionExecuted: command.action,
        reasonCode: 'Silêncio político deliberado registrado perante a corte.',
        affectedEntities: [{ entityId: 'player', entityType: 'CHARACTER', role: 'ACTOR' }],
        stateChanges: [],
        consequences: [
          {
            consequenceId: `csq_silence_${rng.nextInt(1000, 9999)}`,
            kind: 'IMMEDIATE',
            description: 'O líder manteve silêncio deliberado, avaliando a corte e as circunstâncias.',
            authorized: true
          }
        ],
        discoveredInformation: [],
        hiddenInformationIds: [],
        events: []
      };
      return { report, state, mutated: false };
    }

    const genericRes = resolveGenericPlausibleAction(
      {
        action: command.action,
        targetId: command.targetId,
        parameters: command.parameters as Record<string, unknown>
      },
      state,
      rng
    );

    const isSuccess = genericRes.outcome === 'SUCCESS' || genericRes.outcome === 'PARTIAL_SUCCESS';
    let updatedState = state;
    let mutated = false;

    if (genericRes.stateChanges.length > 0) {
      updatedState = JSON.parse(JSON.stringify(state)) as CampaignState;
      for (const sc of genericRes.stateChanges) {
        if (sc.path === 'weeklyLedger.silverdew' && typeof sc.delta === 'number') {
          updatedState.weeklyLedger.silverdew += sc.delta;
          mutated = true;
        } else if (sc.path === 'holdings.laborPool' && typeof sc.delta === 'number') {
          updatedState.holdings.laborPool += sc.delta;
          mutated = true;
        }
      }
    }

    const report: ExecutionReport = {
      contractVersion: command.contractVersion,
      reportId: `rep_gen_${rng.nextInt(100000, 999999)}`,
      command: {
        commandId: command.commandId,
        actorId: command.actorId,
        action: command.action,
        targetId: command.targetId,
        objectId: command.objectId,
        locationId: command.locationId
      },
      status: isSuccess ? 'ACCEPTED' : 'REJECTED',
      actionExecuted: command.action,
      reasonCode: genericRes.reason,
      affectedEntities: genericRes.stateChanges.map(sc => describeEntity(sc.path)),
      stateChanges: genericRes.stateChanges,
      consequences: genericRes.consequences,
      discoveredInformation: [],
      hiddenInformationIds: [],
      events: []
    };

    return {
      report,
      state: updatedState,
      mutated
    };
  }

  const resolution = resolveAction(phrase, state);
  const { updatedState, mutated } = applyResolutionToState(state, resolution);
  const report = buildExecutionReport(command, resolution, state, updatedState, mutated, magnitude);
  const finalState = attachTemporalConsequencesAndEvents(report, updatedState, mutated, command);

  return {
    report,
    state: finalState,
    mutated
  };
}

function attachTemporalConsequencesAndEvents(
  report: ExecutionReport,
  state: CampaignState,
  mutated: boolean,
  command: NarrativeCommand
): CampaignState {
  if (!mutated) return state;

  const targetState: CampaignState = state;
  const curDate = targetState.worldLedger?.currentDate;
  const absoluteTurn = curDate?.year !== undefined
    ? getAbsoluteCampaignTurn(curDate.year, curDate.month, curDate.week)
    : 1;

  // Process PENDING consequences
  if (report.consequences && report.consequences.length > 0) {
    report.consequences.forEach(c => {
      if (c.kind === 'PENDING') {
        if (!targetState.sessionLog) {
          targetState.sessionLog = { lastSessionDate: '', lastThingHappened: '', activeMissions: [], pendingDecisions: [] };
        }
        if (!targetState.sessionLog.pendingConsequences) {
          targetState.sessionLog.pendingConsequences = [];
        }
        targetState.sessionLog.pendingConsequences.push({
          id: c.consequenceId,
          kind: 'PENDING',
          description: c.description,
          triggerTurn: absoluteTurn + 2,
          originAction: command.action,
          resolved: false
        });
      }
    });
  }

  // Record command resolution in EventStore
  const currentWeek = targetState.worldLedger?.currentDate?.week || 1;
  const nextSeq = (targetState.eventStore?.length || 0) + 1;
  const evt = globalEventStore.record('COMMAND_RESOLVED', {
    commandId: command.commandId,
    action: command.action,
    status: report.status,
    reason: report.reasonCode,
    stateChanges: report.stateChanges
  }, currentWeek, nextSeq);

  if (!targetState.eventStore) {
    targetState.eventStore = [];
  }
  targetState.eventStore.push(evt);

  return targetState;
}
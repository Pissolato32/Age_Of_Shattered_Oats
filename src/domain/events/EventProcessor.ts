import { CampaignState } from '../../types';
import { EventRecord, EventMutation, TimeCost } from './models';

export interface EventProcessingResult {
  readonly eventId: string;
  readonly applied: boolean;
  readonly idempotentReplay: boolean;
  readonly mutationsApplied: readonly EventMutation[];
  readonly timeCostApplied: TimeCost;
  readonly nextState: CampaignState;
}

function validateMutation(mutation: EventMutation, state: CampaignState): void {
  switch (mutation.kind) {
    case 'RESOURCE_GAIN': {
      if (mutation.amount < 0 || isNaN(mutation.amount)) {
        throw new Error(`RESOURCE_GAIN amount must be non-negative, got ${mutation.amount}`);
      }
      const res = mutation.resource;
      const validResources = ['silverdew', 'food', 'timber', 'iron', 'stone', 'laborPool'];
      if (!validResources.includes(res)) {
        throw new Error(`RESOURCE_GAIN invalid resource target: ${res}`);
      }
      break;
    }

    case 'RESOURCE_LOSS': {
      if (mutation.amount < 0 || isNaN(mutation.amount)) {
        throw new Error(`RESOURCE_LOSS amount must be non-negative, got ${mutation.amount}`);
      }
      const res = mutation.resource;
      let currentVal = 0;
      if (res === 'silverdew') currentVal = state.weeklyLedger.silverdew ?? 0;
      else if (res === 'food') currentVal = state.weeklyLedger.food ?? 0;
      else if (res === 'timber') currentVal = state.weeklyLedger.materials?.timber ?? 0;
      else if (res === 'iron') currentVal = state.weeklyLedger.materials?.iron ?? 0;
      else if (res === 'stone') currentVal = state.weeklyLedger.materials?.stone ?? 0;
      else if (res === 'laborPool') currentVal = state.holdings?.laborPool ?? 0;
      else {
        throw new Error(`RESOURCE_LOSS invalid resource target: ${res}`);
      }

      if (currentVal < mutation.amount) {
        throw new Error(`RESOURCE_LOSS insufficient resource: required ${mutation.amount} ${res}, available ${currentVal}`);
      }
      break;
    }

    case 'DIPLOMATIC_SHIFT': {
      const houses = state.worldLedger?.nobleHouses ?? [];
      const exists = houses.some(h => h.name.toLowerCase() === mutation.houseId.toLowerCase());
      if (!exists) {
        throw new Error(`DIPLOMATIC_SHIFT target house not found in worldLedger: ${mutation.houseId}`);
      }
      break;
    }

    case 'DISCOVER_FACT': {
      const secrets = state.worldSecrets ?? [];
      const exists = secrets.some(s => s.id === mutation.fact);
      if (!exists) {
        throw new Error(`DISCOVER_FACT target secret not found in worldSecrets: ${mutation.fact}`);
      }
      break;
    }

    case 'INJURY_LIGHT':
    case 'INJURY_SEVERE': {
      if (mutation.targetId.toLowerCase() === 'mount') {
        return;
      }
      const unit = state.army?.units?.find(u => u.id === mutation.targetId);
      if (unit) {
        return;
      }
      if (mutation.targetId.toLowerCase().includes('lord') || mutation.targetId.toLowerCase().includes('character')) {
        throw new Error(`INJURY mutation on Lord/Character is not supported mechanically in C2: ${mutation.targetId}`);
      }
      throw new Error(`INJURY target not found or unsupported: ${mutation.targetId}`);
    }

    case 'CREATE_CAUSAL_EVENT': {
      if (!mutation.eventId || mutation.eventId.trim().length === 0) {
        throw new Error('CREATE_CAUSAL_EVENT eventId cannot be empty');
      }
      break;
    }

    case 'TRAVEL_DELAY': {
      if (mutation.days < 0 || isNaN(mutation.days)) {
        throw new Error(`TRAVEL_DELAY days must be non-negative, got ${mutation.days}`);
      }
      const hasDistance = state.character?.location?.distanceNearTown !== undefined;
      const hasMissions = (state.sessionLog?.activeMissions?.length ?? 0) > 0;
      if (!hasDistance && !hasMissions) {
        throw new Error('TRAVEL_DELAY no active travel target or distance in state');
      }
      break;
    }

    case 'ACTIVITY_CHANGE': {
      throw new Error('ACTIVITY_CHANGE is not supported mechanically in C2 (no state.currentActivity in CampaignState)');
    }

    case 'CREATE_OPPORTUNITY': {
      throw new Error('CREATE_OPPORTUNITY is not supported mechanically in C2 (static OPPORTUNITY_CATALOG)');
    }

    default: {
      const exhaustiveCheck: never = mutation;
      throw new Error(`Unknown or unsupported mutation kind: ${(exhaustiveCheck as any)?.kind}`);
    }
  }
}

/**
 * EventProcessor (M18.9-C2)
 *
 * Deterministic, atomic processor for applying validated EventRecord mutations to CampaignState.
 *
 * Invariants:
 * 1. Atomic: Validates all mutations first. Any failure leaves original state untouched.
 * 2. Immutable: Receives CampaignState, returns a new distinct state. Original is unchanged.
 * 3. Idempotent: Checks state.eventStore for eventId. Replays return applied=false without new mutations.
 * 4. Zero Global State: Persistent across JSON serialization/deserialization.
 * 5. TimeCost is reported without modifying turn/calendar.
 */
export function processEvent(event: EventRecord, state: CampaignState): EventProcessingResult {
  if (!event || !event.eventId) {
    throw new Error('Invalid EventRecord: missing eventId');
  }

  // 1. Idempotency check via persistent eventStore in CampaignState
  const alreadyProcessed = state.eventStore?.some(
    evt => evt.id === event.eventId || evt.payload?.eventId === event.eventId
  );

  if (alreadyProcessed) {
    return {
      eventId: event.eventId,
      applied: false,
      idempotentReplay: true,
      mutationsApplied: [],
      timeCostApplied: event.timeCost,
      nextState: state
    };
  }

  // 2. Validate all mutations first (Fail-Closed & Atomic gate)
  for (const mutation of event.mutations) {
    validateMutation(mutation, state);
  }

  // 3. Clone state immutably
  const nextState: CampaignState = JSON.parse(JSON.stringify(state));

  // 4. Apply each mutation atomically
  for (const mutation of event.mutations) {
    switch (mutation.kind) {
      case 'RESOURCE_GAIN': {
        const res = mutation.resource;
        if (res === 'silverdew') nextState.weeklyLedger.silverdew = (nextState.weeklyLedger.silverdew ?? 0) + mutation.amount;
        else if (res === 'food') nextState.weeklyLedger.food = (nextState.weeklyLedger.food ?? 0) + mutation.amount;
        else if (res === 'timber') {
          nextState.weeklyLedger.materials = nextState.weeklyLedger.materials || { timber: 0, iron: 0, stone: 0 };
          nextState.weeklyLedger.materials.timber += mutation.amount;
        } else if (res === 'iron') {
          nextState.weeklyLedger.materials = nextState.weeklyLedger.materials || { timber: 0, iron: 0, stone: 0 };
          nextState.weeklyLedger.materials.iron += mutation.amount;
        } else if (res === 'stone') {
          nextState.weeklyLedger.materials = nextState.weeklyLedger.materials || { timber: 0, iron: 0, stone: 0 };
          nextState.weeklyLedger.materials.stone += mutation.amount;
        } else if (res === 'laborPool') {
          nextState.holdings.laborPool = (nextState.holdings.laborPool ?? 0) + mutation.amount;
        }
        break;
      }

      case 'RESOURCE_LOSS': {
        const res = mutation.resource;
        if (res === 'silverdew') nextState.weeklyLedger.silverdew -= mutation.amount;
        else if (res === 'food') nextState.weeklyLedger.food -= mutation.amount;
        else if (res === 'timber') nextState.weeklyLedger.materials.timber -= mutation.amount;
        else if (res === 'iron') nextState.weeklyLedger.materials.iron -= mutation.amount;
        else if (res === 'stone') nextState.weeklyLedger.materials.stone -= mutation.amount;
        else if (res === 'laborPool') nextState.holdings.laborPool -= mutation.amount;
        break;
      }

      case 'DIPLOMATIC_SHIFT': {
        const house = nextState.worldLedger.nobleHouses.find(
          h => h.name.toLowerCase() === mutation.houseId.toLowerCase()
        );
        if (house) {
          house.opinion = Math.max(-3, Math.min(3, house.opinion + mutation.delta));
        }
        break;
      }

      case 'DISCOVER_FACT': {
        const secret = nextState.worldSecrets?.find(s => s.id === mutation.fact);
        if (secret) {
          secret.revealed = true;
        }
        break;
      }

      case 'INJURY_LIGHT':
      case 'INJURY_SEVERE': {
        if (mutation.targetId.toLowerCase() === 'mount') {
          if (nextState.character?.stats) {
            nextState.character.stats.mountInjured = true;
          }
        } else {
          const unit = nextState.army?.units?.find(u => u.id === mutation.targetId);
          if (unit) {
            const loss = mutation.kind === 'INJURY_LIGHT' ? 1 : Math.max(2, Math.floor(unit.size * 0.2));
            unit.size = Math.max(0, unit.size - loss);
          }
        }
        break;
      }

      case 'CREATE_CAUSAL_EVENT': {
        if (!nextState.sessionLog) {
          nextState.sessionLog = {
            lastSessionDate: '',
            lastThingHappened: '',
            activeMissions: [],
            pendingDecisions: []
          };
        }
        if (!nextState.sessionLog.pendingConsequences) {
          nextState.sessionLog.pendingConsequences = [];
        }
        const currentWeek = nextState.worldLedger?.currentDate?.week ?? 1;
        nextState.sessionLog.pendingConsequences.push({
          id: mutation.eventId,
          kind: 'PENDING',
          description: `Causal consequence originating from event ${event.eventId}`,
          triggerTurn: currentWeek + 1,
          originAction: event.eventId,
          resolved: false
        });
        break;
      }

      case 'TRAVEL_DELAY': {
        if (nextState.character?.location?.distanceNearTown !== undefined) {
          nextState.character.location.distanceNearTown += mutation.days;
        } else if (nextState.sessionLog?.activeMissions && nextState.sessionLog.activeMissions.length > 0) {
          nextState.sessionLog.activeMissions[0].returnsDay += mutation.days;
        }
        break;
      }
    }
  }

  // 5. Record applied event into persistent eventStore for audit and replay
  if (!nextState.eventStore) {
    nextState.eventStore = [];
  }
  const nextSeq = nextState.eventStore.length + 1;
  const currentWeek = nextState.worldLedger?.currentDate?.week ?? 1;
  nextState.eventStore.push({
    id: event.eventId,
    sequence: nextSeq,
    type: 'EVENT_RECORD_APPLIED',
    payload: {
      eventId: event.eventId,
      magnitude: event.magnitude,
      timeCost: event.timeCost,
      mutationsCount: event.mutations.length
    },
    timestamp: '1970-01-01T00:00:00Z',
    week: currentWeek,
    hash: `evt_${nextSeq}_${event.eventId}`
  });

  return {
    eventId: event.eventId,
    applied: true,
    idempotentReplay: false,
    mutationsApplied: [...event.mutations],
    timeCostApplied: event.timeCost,
    nextState
  };
}

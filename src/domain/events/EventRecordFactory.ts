import { EventOpportunity } from './EventOpportunityEngine';
import { EventRecord, DescriptionContext, TimeCost, EventMutation, SceneState } from './models';
import { SceneFactory } from './SceneFactory';

export interface CreateEventRecordOptions {
  readonly mutations?: readonly EventMutation[];
  readonly timeCost?: TimeCost;
  readonly locationId?: string;
  readonly actorIds?: readonly string[];
  readonly causalParentEventId?: string;
  readonly scene?: SceneState | null;
}

export function mapTimeCostHintToTimeCost(hint: 'NONE' | 'HOURS' | 'DAY' | 'DAYS' | 'WEEK'): TimeCost {
  switch (hint) {
    case 'NONE':
      return 'NONE';
    case 'HOURS':
      return 'HOUR';
    case 'DAY':
      return 'FULL_DAY';
    case 'DAYS':
    case 'WEEK':
      return 'MULTI_DAY';
    default:
      return 'NONE';
  }
}

export function createEventRecord(
  opportunity: EventOpportunity,
  turn: number,
  slotIndex: number,
  domain: string,
  options?: CreateEventRecordOptions
): EventRecord {
  const eventId = `evt_t${turn}_s${slotIndex}_${domain}_${opportunity.opportunityId}`;
  const timeCost = options?.timeCost ?? mapTimeCostHintToTimeCost(opportunity.timeCostHint);

  const descriptionContext: DescriptionContext = {
    eventType: opportunity.eventType,
    ...(opportunity.tags && opportunity.tags.length > 0 ? { sensoryTags: [...opportunity.tags] } : {}),
    ...(options?.locationId ? { locationId: options.locationId } : {}),
    ...(options?.actorIds && options.actorIds.length > 0 ? { actorIds: [...options.actorIds] } : {})
  };

  const scene = options?.scene !== undefined
    ? (options.scene === null ? undefined : options.scene)
    : SceneFactory.createSceneForOpportunity(opportunity, eventId);

  const record: EventRecord = {
    eventId,
    magnitude: opportunity.magnitude,
    timeCost,
    descriptionContext,
    mutations: options?.mutations ? [...options.mutations] : [],
    turnOccurred: turn,
    slotIndex,
    domain,
    ...(options?.causalParentEventId ? { causalParentEventId: options.causalParentEventId } : {}),
    ...(scene ? { scene } : {})
  };

  return record;
}

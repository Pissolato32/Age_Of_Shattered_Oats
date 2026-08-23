// tests/EventContracts.test.ts

// Removed chai import; using native assert
import assert from 'node:assert/strict';
import {
  WorldEventMagnitude,
  TimeCost,
  MutationKind,
  EventMutation,
  DescriptionContext,
  EventRecord,
  SceneStatus,
  SceneChoice,
  SceneOutcome,
  SceneState,
  SceneTimeBudget,
} from '../src/domain/events/models';

// Helper to silence unused variable warnings
function unused(..._args: any[]) {}

// ----- Type compile‑time checks (using @ts-expect-error) -----
// These sections are verified by the TypeScript compiler, not at runtime.
// The @ts-expect-error comment tells tsc that the next line should error.
// If it does not, tsc will fail.

// Valid magnitudes
const magIncidental: WorldEventMagnitude = 'INCIDENTAL';
const magMinor: WorldEventMagnitude = 'MINOR';
const magSignificant: WorldEventMagnitude = 'SIGNIFICANT';
const magMajor: WorldEventMagnitude = 'MAJOR';
const magCritical: WorldEventMagnitude = 'CRITICAL';
unused(magIncidental, magMinor, magSignificant, magMajor, magCritical);

// @ts-expect-error – invalid magnitude
const invalidMag: WorldEventMagnitude = 'NON_EXISTENT';

// Valid time costs
const tcNone: TimeCost = 'NONE';
const tcHalfHour: TimeCost = 'HALF_HOUR';
const tcFullDay: TimeCost = 'FULL_DAY';
unused(tcNone, tcHalfHour, tcFullDay);

// @ts-expect-error – invalid time cost
const invalidTC: TimeCost = 'WEEK';

// ----- EventMutation discriminated union checks -----
const mutResourceGain: EventMutation = {
  kind: 'RESOURCE_GAIN',
  resource: 'timber',
  amount: 5,
};
const mutInjurySevere: EventMutation = {
  kind: 'INJURY_SEVERE',
  targetId: 'char_12',
};
const mutTravelDelay: EventMutation = {
  kind: 'TRAVEL_DELAY',
  days: 2,
};
unused(mutResourceGain, mutInjurySevere, mutTravelDelay);

// @ts-expect-error – missing required field for RESOURCE_GAIN
const badMut1: EventMutation = { kind: 'RESOURCE_GAIN', resource: 'timber' };


const badMut2: EventMutation = {
  kind: 'RESOURCE_LOSS',
  resource: 'iron',
  amount: 3,
};

// ----- DescriptionContext -----
const ctx: DescriptionContext = {
  locationId: 'loc_001',
  eventType: 'TRAVEL_ROAD_ACCIDENT',
  sensoryTags: ['smoke', 'clank'],
  actorIds: ['char_01', 'char_02'],
};
unused(ctx);

// ----- EventRecord -----
const evRec: EventRecord = {
  eventId: 'ev_001',
  magnitude: 'MINOR',
  timeCost: 'HALF_HOUR',
  descriptionContext: ctx,
  mutations: [mutResourceGain],
  turnOccurred: 1,
  slotIndex: 0,
  domain: 'TRAVEL',
};
unused(evRec);

// Ensure no narrative field exists (compile‑time)
// @ts-expect-error – narrative is not part of EventRecord
evRec.narrative = 'some text';

// ----- SceneState and transitions -----
const sceneOpen: SceneState = {
  sceneId: 'sc_001',
  status: 'OPEN',
  choices: [
    {
      choiceId: 'c1',
      label: 'Investigate',
      additionalTimeCost: 'HOUR',
      mutations: [mutInjurySevere],
    },
    {
      choiceId: 'c2',
      label: 'Ignore',
      mutations: [],
    },
  ],
  timeBudget: 'FULL_DAY',
};
unused(sceneOpen);

// Simulate resolution to RESOLVED
const sceneOutcome: SceneOutcome = {
  sceneId: sceneOpen.sceneId,
  status: 'RESOLVED',
  mutations: [mutTravelDelay],
  chosenChoiceId: 'c1',
};
unused(sceneOutcome);

// ----- JSON serialization round‑trip -----
const serialized = JSON.stringify(evRec);
const deserialized: EventRecord = JSON.parse(serialized);
assert.strictEqual(deserialized.eventId, evRec.eventId);
assert.strictEqual(deserialized.magnitude, evRec.magnitude);
assert.strictEqual(deserialized.timeCost, evRec.timeCost);
assert.strictEqual(deserialized.descriptionContext.locationId, evRec.descriptionContext.locationId);

// ----- Verify that EventMutation cannot be a Partial<CampaignState> (compile‑time) -----
import type { CampaignState } from '../src/types';
// @ts-expect-error – EventMutation is not assignable to Partial<CampaignState>
const invalidAssign: EventMutation = {} as Partial<CampaignState>;

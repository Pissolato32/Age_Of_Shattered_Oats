import assert from 'node:assert/strict';
import { createEventRecord, mapTimeCostHintToTimeCost } from '../src/domain/events/EventRecordFactory';
import { EventOpportunity } from '../src/domain/events/EventOpportunityEngine';
import { EventMutation } from '../src/domain/events/models';

function createSampleOpportunity(overrides?: Partial<EventOpportunity>): EventOpportunity {
  return {
    opportunityId: 'opp_travel_weather_delay',
    eventType: 'TRAVEL_WEATHER_DELAY',
    magnitude: 'MINOR',
    baseWeight: 5,
    weight: 5,
    tags: ['viagem', 'clima', 'inverno', 'atraso'],
    eligible: true,
    reasons: ['Condições climáticas adversas em Deepfrost'],
    timeCostHint: 'DAY',
    ...overrides
  };
}

console.log('--- TEST SUITE: EventRecordFactory ---');

// Test 1: Deterministic creation and eventId composition
{
  const opp = createSampleOpportunity();
  const record1 = createEventRecord(opp, 12, 0, 'TRAVEL');
  const record2 = createEventRecord(opp, 12, 0, 'TRAVEL');

  assert.equal(record1.eventId, 'evt_t12_s0_TRAVEL_opp_travel_weather_delay');
  assert.equal(record1.magnitude, 'MINOR');
  assert.equal(record1.timeCost, 'FULL_DAY');
  assert.equal(record1.turnOccurred, 12);
  assert.equal(record1.slotIndex, 0);
  assert.equal(record1.domain, 'TRAVEL');
  assert.deepEqual(record1.descriptionContext.sensoryTags, ['viagem', 'clima', 'inverno', 'atraso']);
  assert.equal(record1.descriptionContext.eventType, 'TRAVEL_WEATHER_DELAY');
  assert.equal(record1.descriptionContext.locationId, undefined);
  assert.equal(record1.descriptionContext.actorIds, undefined);

  // Determinism check
  assert.deepEqual(record1, record2);
  console.log('✓ Test 1 Passed: Deterministic creation and eventId composition');
}

// Test 2: TimeCost hint mapping
{
  assert.equal(mapTimeCostHintToTimeCost('NONE'), 'NONE');
  assert.equal(mapTimeCostHintToTimeCost('HOURS'), 'HOUR');
  assert.equal(mapTimeCostHintToTimeCost('DAY'), 'FULL_DAY');
  assert.equal(mapTimeCostHintToTimeCost('DAYS'), 'MULTI_DAY');
  assert.equal(mapTimeCostHintToTimeCost('WEEK'), 'MULTI_DAY');
  console.log('✓ Test 2 Passed: TimeCost hint mapping');
}

// Test 3: Mutation preservation
{
  const opp = createSampleOpportunity();
  const mutations: EventMutation[] = [
    { kind: 'RESOURCE_LOSS', resource: 'silverdew', amount: 50 },
    { kind: 'TRAVEL_DELAY', days: 2 }
  ];

  const record = createEventRecord(opp, 5, 1, 'TRAVEL', {
    mutations,
    locationId: 'loc_frontier_outpost',
    actorIds: ['actor_scout_1']
  });

  assert.equal(record.mutations.length, 2);
  assert.deepEqual(record.mutations, mutations);
  assert.equal(record.descriptionContext.locationId, 'loc_frontier_outpost');
  assert.deepEqual(record.descriptionContext.actorIds, ['actor_scout_1']);
  console.log('✓ Test 3 Passed: Explicit mutations preserved');
}

// Test 4: JSON Round-trip serialization
{
  const opp = createSampleOpportunity();
  const record = createEventRecord(opp, 8, 2, 'HOLDING', {
    mutations: [{ kind: 'RESOURCE_GAIN', resource: 'timber', amount: 20 }]
  });

  const serialized = JSON.stringify(record);
  const deserialized = JSON.parse(serialized);

  assert.deepEqual(deserialized, record);
  console.log('✓ Test 4 Passed: JSON Round-trip serialization integrity');
}

console.log('--- ALL EventRecordFactory TESTS PASSED ---\n');

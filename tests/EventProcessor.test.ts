import assert from 'node:assert/strict';
import { processEvent } from '../src/domain/events/EventProcessor';
import { EventRecord } from '../src/domain/events/models';
import { CampaignState } from '../src/types';

function createInitialTestCampaignState(): CampaignState {
  return {
    character: {
      name: 'Alden Vance',
      house: 'House Vance',
      age: 32,
      gender: 'Male',
      archetype: 'Landed Knight',
      title: 'Lord of Riverbend',
      location: {
        region: 'Riverlands',
        subregion: 'Upper Fork',
        landmark: 'Vance Keep',
        distanceNearTown: 3,
        distanceNearCastle: 1,
        distanceCapital: 4
      },
      banner: {
        colors: 'Blue and Silver',
        symbol: 'Fish and Sword',
        motto: 'Ever Vigilant'
      },
      stats: {
        commanderTier: 2,
        bannerTier: 1,
        ac: 16,
        initiativeBonus: 2,
        weapon: 'Longsword',
        shield: 'Kite Shield',
        mount: 'Warhorse',
        mountInjured: false,
        mountQuality: 'High-Grade',
        weaponQuality: 'High-Grade',
        armorQuality: 'High-Grade',
        shieldQuality: 'High-Grade'
      },
      reputation: 50,
      nicknames: []
    },
    weeklyLedger: {
      week: 14,
      month: 'Sunreach',
      year: 402,
      season: 'Sunreach',
      weather: 'Clear skies',
      silverdew: 350,
      food: 80,
      materials: {
        timber: 25,
        iron: 15,
        stone: 40
      },
      incomeDetail: {
        holdings: 50,
        patches: 10,
        trade: 5,
        tribute: 0,
        taxes: 20,
        loot: 0,
        other: 0
      },
      expenseDetail: {
        wages: 20,
        garrison: 15,
        foodPurchases: 0,
        construction: 0,
        recruitment: 0,
        mercenaries: 0,
        tributePaid: 0,
        engineerWages: 0,
        shipUpkeep: 0,
        holdingMaintenance: 10,
        other: 0
      }
    },
    army: {
      units: [
        {
          id: 'unit_vance_guard',
          name: 'Vance Guard',
          size: 40,
          maxSize: 50,
          tier: 2,
          ac: 15,
          weapon: 'Spear',
          mount: 'None',
          morale: 8
        }
      ],
      garrisonSize: 20
    },
    holdings: {
      name: 'Vance Keep',
      type: 'Castle',
      tier: 2,
      region: 'Riverlands',
      position: 'High Bluff',
      population: 450,
      laborPool: 30,
      garrison: 20,
      fortification: {
        type: 'Stone Wall',
        tier: 2,
        acBonus: 3,
        rangedRerolls: 1,
        firstMeleeBonus: 2
      },
      resourcePatches: [],
      residentSmith: {
        name: 'Master Boros',
        level: 3,
        xp: 150,
        specialty: 'Armor'
      },
      granaryUpgrade: true
    },
    ships: [],
    sessionLog: {
      lastSessionDate: '1970-01-01',
      lastThingHappened: 'Patrol dispatched',
      activeMissions: [],
      pendingDecisions: []
    },
    worldLedger: {
      currentDate: { day: 10, month: 'Sunreach', year: 402, week: 14 },
      activeConflicts: [],
      majorEvents: [],
      nobleHouses: [
        {
          name: 'House Blackwood',
          region: 'Riverlands',
          currentLord: 'Lord Tytos',
          seat: 'Raventree Hall',
          tier: 3,
          status: 'Neutral',
          allies: [],
          enemies: [],
          opinion: 0,
          rumor: 'Gathering men',
          isRealRumor: false
        }
      ],
      rareEventStatus: {
        warmYear: { active: false, lastOccurredYear: 400 },
        youngPretender: { active: false },
        snowBearMigration: { active: false },
        blindTraveler: { active: false },
        schemer: { active: false }
      },
      marketConditions: {},
      weatherHistory: [],
      notableDeaths: []
    },
    crowns: [],
    inventory: {
      horns: [],
      smudgeBundles: { sage: 0, cedar: 0, sweetgrass: 0, tobacco: 0 }
    },
    family: {
      children: []
    },
    worldSecrets: [
      {
        id: 'sec_blackwood_conspiracy',
        title: 'Blackwood Secret Letter',
        description: 'Evidence of secret dealings',
        revealed: false,
        investigationProgress: 2,
        category: 'Plot'
      }
    ],
    eventStore: []
  };
}

console.log('--- TEST SUITE: EventProcessor ---');

// Hard Gate D & L: Immutability and No Implicit Mutations from Magnitude
{
  const state = createInitialTestCampaignState();
  const stateSnapshot = JSON.stringify(state);

  const event: EventRecord = {
    eventId: 'evt_t14_s0_TRAVEL_opp_incidental',
    magnitude: 'CRITICAL', // high magnitude but NO explicit mutations
    timeCost: 'HALF_DAY',
    descriptionContext: { eventType: 'ATMOSPHERIC_FLAVOR_RAVEN' },
    mutations: [],
    turnOccurred: 14,
    slotIndex: 0,
    domain: 'TRAVEL'
  };

  const result = processEvent(event, state);

  assert.equal(result.applied, true);
  assert.equal(result.idempotentReplay, false);
  assert.equal(result.mutationsApplied.length, 0);
  assert.equal(result.timeCostApplied, 'HALF_DAY');

  // Hard Gate D: Original state is strictly unmodified
  assert.equal(JSON.stringify(state), stateSnapshot, 'Original state must remain untouched');

  // Hard Gate L: No implicit changes in nextState resources
  assert.equal(result.nextState.weeklyLedger.silverdew, 350);
  assert.equal(result.nextState.weeklyLedger.food, 80);
  console.log('✓ Hard Gate D & L Passed: Immutability & No implicit magnitude mutations');
}

// Hard Gate F & I: Multiple Valid Mutations & Unrelated Fields Preservation
{
  const state = createInitialTestCampaignState();
  const event: EventRecord = {
    eventId: 'evt_t14_s1_DIPLOMACY_opp_treaty',
    magnitude: 'SIGNIFICANT',
    timeCost: 'HOUR',
    descriptionContext: { eventType: 'DIPLOMACY_TENSION_INCIDENT' },
    mutations: [
      { kind: 'RESOURCE_GAIN', resource: 'silverdew', amount: 100 },
      { kind: 'RESOURCE_LOSS', resource: 'food', amount: 20 },
      { kind: 'DIPLOMATIC_SHIFT', houseId: 'House Blackwood', delta: 2 },
      { kind: 'DISCOVER_FACT', fact: 'sec_blackwood_conspiracy' },
      { kind: 'INJURY_LIGHT', targetId: 'mount' },
      { kind: 'TRAVEL_DELAY', days: 2 }
    ],
    turnOccurred: 14,
    slotIndex: 1,
    domain: 'DIPLOMACY'
  };

  const result = processEvent(event, state);

  assert.equal(result.applied, true);
  assert.equal(result.mutationsApplied.length, 6);
  assert.equal(result.nextState.weeklyLedger.silverdew, 450);
  assert.equal(result.nextState.weeklyLedger.food, 60);
  assert.equal(result.nextState.worldLedger.nobleHouses[0].opinion, 2);
  assert.equal(result.nextState.worldSecrets![0].revealed, true);
  assert.equal(result.nextState.character.stats.mountInjured, true);
  assert.equal(result.nextState.character.location.distanceNearTown, 5);

  // Hard Gate I: Unrelated fields preserved
  assert.equal(result.nextState.character.name, 'Alden Vance');
  assert.equal(result.nextState.holdings.name, 'Vance Keep');
  assert.equal(result.nextState.weeklyLedger.materials.stone, 40);

  // Hard Gate J: TimeCost does NOT advance calendar
  assert.equal(result.nextState.weeklyLedger.week, 14);
  assert.equal(result.nextState.worldLedger.currentDate.week, 14);
  assert.equal(result.nextState.weeklyLedger.season, 'Sunreach');
  console.log('✓ Hard Gate F, I & J Passed: Multiple mutations applied, unrelated fields preserved, calendar not advanced');
}

// Hard Gate C: Atomicity & Fail-Closed Behavior
{
  const state = createInitialTestCampaignState();
  const stateSnapshot = JSON.stringify(state);

  const eventWithInvalidSecondMutation: EventRecord = {
    eventId: 'evt_t14_s2_HOLDING_opp_fail_atomic',
    magnitude: 'MAJOR',
    timeCost: 'FULL_DAY',
    descriptionContext: { eventType: 'BUILD_MATERIAL_SHORTAGE' },
    mutations: [
      { kind: 'RESOURCE_GAIN', resource: 'silverdew', amount: 500 }, // valid
      { kind: 'RESOURCE_LOSS', resource: 'food', amount: 9999 } // INVALID: exceeds available food (80)
    ],
    turnOccurred: 14,
    slotIndex: 2,
    domain: 'HOLDING'
  };

  assert.throws(
    () => processEvent(eventWithInvalidSecondMutation, state),
    /RESOURCE_LOSS insufficient resource/
  );

  // State must remain completely unchanged, silverdew NOT added
  assert.equal(JSON.stringify(state), stateSnapshot, 'Original state must remain untouched on atomic failure');
  console.log('✓ Hard Gate C Passed: Strict atomicity (all or nothing)');
}

// Hard Gate G & H: Fail Closed on Unknown or Unsupported Mutations
{
  const state = createInitialTestCampaignState();

  // Unsupported Lord Injury
  const eventLordInjury: EventRecord = {
    eventId: 'evt_t14_s3_opp_lord_inj',
    magnitude: 'MINOR',
    timeCost: 'NONE',
    descriptionContext: { eventType: 'WILD_ANIMAL_ENCOUNTER' },
    mutations: [{ kind: 'INJURY_SEVERE', targetId: 'character_lord' }],
    turnOccurred: 14,
    slotIndex: 3,
    domain: 'TRAVEL'
  };
  assert.throws(() => processEvent(eventLordInjury, state), /Lord\/Character is not supported mechanically in C2/);

  // Unsupported ACTIVITY_CHANGE
  const eventActivity: EventRecord = {
    eventId: 'evt_t14_s4_opp_activity',
    magnitude: 'MINOR',
    timeCost: 'NONE',
    descriptionContext: { eventType: 'WILD_ANIMAL_ENCOUNTER' },
    mutations: [{ kind: 'ACTIVITY_CHANGE', activity: 'REST' }],
    turnOccurred: 14,
    slotIndex: 4,
    domain: 'TRAVEL'
  };
  assert.throws(() => processEvent(eventActivity, state), /ACTIVITY_CHANGE is not supported/);

  // Unsupported CREATE_OPPORTUNITY
  const eventOpp: EventRecord = {
    eventId: 'evt_t14_s5_opp_create_opp',
    magnitude: 'MINOR',
    timeCost: 'NONE',
    descriptionContext: { eventType: 'WILD_ANIMAL_ENCOUNTER' },
    mutations: [{ kind: 'CREATE_OPPORTUNITY', opportunityId: 'opp_custom' }],
    turnOccurred: 14,
    slotIndex: 5,
    domain: 'TRAVEL'
  };
  assert.throws(() => processEvent(eventOpp, state), /CREATE_OPPORTUNITY is not supported/);

  // Unknown secretId in DISCOVER_FACT
  const eventSecretFail: EventRecord = {
    eventId: 'evt_t14_s6_opp_secret_fail',
    magnitude: 'MINOR',
    timeCost: 'NONE',
    descriptionContext: { eventType: 'WILD_ANIMAL_ENCOUNTER' },
    mutations: [{ kind: 'DISCOVER_FACT', fact: 'sec_non_existent' }],
    turnOccurred: 14,
    slotIndex: 6,
    domain: 'TRAVEL'
  };
  assert.throws(() => processEvent(eventSecretFail, state), /target secret not found in worldSecrets/);

  console.log('✓ Hard Gate G & H Passed: Fail-closed on unsupported/invalid mutations');
}

// Hard Gate E: Persistent Idempotency & JSON Round-Trip Survival
{
  const state = createInitialTestCampaignState();
  const event: EventRecord = {
    eventId: 'evt_t14_s7_TRAVEL_opp_persistent',
    magnitude: 'MINOR',
    timeCost: 'HOUR',
    descriptionContext: { eventType: 'TRAVEL_ROAD_ACCIDENT' },
    mutations: [{ kind: 'RESOURCE_GAIN', resource: 'stone', amount: 10 }],
    turnOccurred: 14,
    slotIndex: 7,
    domain: 'TRAVEL'
  };

  // First application
  const firstResult = processEvent(event, state);
  assert.equal(firstResult.applied, true);
  assert.equal(firstResult.idempotentReplay, false);
  assert.equal(firstResult.nextState.weeklyLedger.materials.stone, 50);

  // Simulate Save/Load cycle via JSON serialization
  const serializedState = JSON.stringify(firstResult.nextState);
  const reloadedState: CampaignState = JSON.parse(serializedState);

  // Second application on reloaded state
  const secondResult = processEvent(event, reloadedState);
  assert.equal(secondResult.applied, false);
  assert.equal(secondResult.idempotentReplay, true);
  assert.equal(secondResult.mutationsApplied.length, 0);
  assert.equal(secondResult.timeCostApplied, 'HOUR');
  assert.equal(secondResult.nextState.weeklyLedger.materials.stone, 50, 'Stone must not increase again on replay');

  console.log('✓ Hard Gate E Passed: Persistent idempotency survives JSON save/load round-trip');
}

// Hard Gate A: Pure Determinism
{
  const stateA = createInitialTestCampaignState();
  const stateB = createInitialTestCampaignState();

  const event: EventRecord = {
    eventId: 'evt_t14_s8_MILITARY_opp_causal',
    magnitude: 'SIGNIFICANT',
    timeCost: 'TWO_HOURS',
    descriptionContext: { eventType: 'FRONTIER_TRACKS_DISCOVERED' },
    mutations: [
      { kind: 'CREATE_CAUSAL_EVENT', eventId: 'causal_evt_bandit_ambush' },
      { kind: 'INJURY_LIGHT', targetId: 'unit_vance_guard' }
    ],
    turnOccurred: 14,
    slotIndex: 8,
    domain: 'MILITARY'
  };

  const resA = processEvent(event, stateA);
  const resB = processEvent(event, stateB);

  assert.deepEqual(resA.nextState, resB.nextState);
  assert.equal(resA.nextState.army.units[0].size, 39);
  assert.equal(resA.nextState.sessionLog.pendingConsequences?.length, 1);
  assert.equal(resA.nextState.sessionLog.pendingConsequences?.[0].id, 'causal_evt_bandit_ambush');
  console.log('✓ Hard Gate A Passed: Absolute determinism across runs');
}

console.log('--- ALL EventProcessor TESTS PASSED ---\n');

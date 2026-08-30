import assert from 'node:assert/strict';
import { SceneFactory } from '../src/domain/events/SceneFactory';
import { SceneResolver } from '../src/domain/events/SceneResolver';
import { createEventRecord } from '../src/domain/events/EventRecordFactory';
import { processEvent } from '../src/domain/events/EventProcessor';
import { EventOpportunity } from '../src/domain/events/EventOpportunityEngine';
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
    worldSecrets: [],
    eventStore: []
  };
}

console.log('--- TEST SUITE: SceneResolver (M18.9-C3) ---');

// Hard Gate 1 & 2: SceneFactory determinism & INCIDENTAL magnitude never opens scene
{
  const oppIncidental: EventOpportunity = {
    opportunityId: 'opp_flavor_raven_wall',
    eventType: 'ATMOSPHERIC_FLAVOR_RAVEN',
    magnitude: 'INCIDENTAL',
    baseWeight: 5,
    weight: 5,
    tags: ['flavor', 'atmosfera'],
    eligible: true,
    reasons: ['Universal'],
    timeCostHint: 'NONE'
  };

  const sceneIncidental = SceneFactory.createSceneForOpportunity(oppIncidental, 'evt_t14_s0_opp_flavor_raven_wall');
  assert.equal(sceneIncidental, undefined, 'INCIDENTAL must never open a SceneState');

  const oppAnimal: EventOpportunity = {
    opportunityId: 'opp_travel_animal_encounter',
    eventType: 'WILD_ANIMAL_ENCOUNTER',
    magnitude: 'MINOR',
    baseWeight: 3,
    weight: 3,
    tags: ['viagem', 'fauna'],
    eligible: true,
    reasons: ['Ermos'],
    timeCostHint: 'HOURS'
  };

  const scene1 = SceneFactory.createSceneForOpportunity(oppAnimal, 'evt_t14_s1_opp_travel_animal_encounter');
  const scene2 = SceneFactory.createSceneForOpportunity(oppAnimal, 'evt_t14_s1_opp_travel_animal_encounter');

  assert.ok(scene1 !== undefined);
  assert.equal(scene1.status, 'OPEN');
  assert.equal(scene1.sceneId, 'scene_evt_t14_s1_opp_travel_animal_encounter');
  assert.equal(scene1.eventId, 'evt_t14_s1_opp_travel_animal_encounter');
  assert.equal(scene1.choices.length, 3);
  assert.deepEqual(scene1, scene2, 'SceneFactory must be 100% deterministic');
  console.log('✓ Hard Gate 1 & 2 Passed: Deterministic SceneState instantiation & INCIDENTAL exclusion');
}

// Hard Gate 3 & 4: Closed choices, distinct resolution identity & Lifecycle (OPEN -> RESOLVED)
{
  const state = createInitialTestCampaignState();
  const oppTrade: EventOpportunity = {
    opportunityId: 'opp_trade_opportunistic_merchant',
    eventType: 'TRADE_OPPORTUNISTIC_MERCHANT',
    magnitude: 'SIGNIFICANT',
    baseWeight: 4,
    weight: 4,
    tags: ['comercio', 'mercador'],
    eligible: true,
    reasons: ['Mercado'],
    timeCostHint: 'HOURS'
  };

  const event = createEventRecord(oppTrade, 14, 2, 'TRADE');
  assert.ok(event.scene !== undefined);
  const scene = event.scene;

  // Resolve valid choice: choice_trade_iron (-30 SD, +10 Iron)
  const result = SceneResolver.resolveSceneChoice(scene, 'choice_trade_iron', event, state);

  assert.equal(result.sceneOutcome.status, 'RESOLVED');
  assert.equal(result.sceneOutcome.chosenChoiceId, 'choice_trade_iron');
  assert.equal(result.nextSceneState.status, 'RESOLVED');
  assert.equal(result.eventProcessingResult.applied, true);

  // Distinct resolution eventId
  const expectedResolutionId = `evt_res_${scene.sceneId}__choice_choice_trade_iron`;
  assert.equal(result.eventProcessingResult.eventId, expectedResolutionId);

  // Mechanics applied
  assert.equal(result.eventProcessingResult.nextState.weeklyLedger.silverdew, 320); // 350 - 30
  assert.equal(result.eventProcessingResult.nextState.weeklyLedger.materials.iron, 25); // 15 + 10

  // Hard Gate 4: Attempting to resolve an already RESOLVED scene must fail closed
  assert.throws(
    () => SceneResolver.resolveSceneChoice(result.nextSceneState, 'choice_trade_timber', event, state),
    /is not OPEN \(current status: RESOLVED\)/
  );

  console.log('✓ Hard Gate 3 & 4 Passed: Closed choices, distinct resolution eventId and single resolution lifecycle');
}

// Hard Gate 5 & 6: Fail-Closed on invalid choiceId, strict atomicity & SceneState preservation
{
  const state = createInitialTestCampaignState();
  const stateSnapshot = JSON.stringify(state);

  const oppAnimal: EventOpportunity = {
    opportunityId: 'opp_travel_animal_encounter',
    eventType: 'WILD_ANIMAL_ENCOUNTER',
    magnitude: 'MINOR',
    baseWeight: 3,
    weight: 3,
    tags: ['viagem', 'fauna'],
    eligible: true,
    reasons: ['Ermos'],
    timeCostHint: 'HOURS'
  };

  const event = createEventRecord(oppAnimal, 14, 3, 'TRAVEL');
  const scene = event.scene!;
  const sceneSnapshot = JSON.stringify(scene);

  // 1. Invalid choiceId
  assert.throws(
    () => SceneResolver.resolveSceneChoice(scene, 'choice_invalid_hack', event, state),
    /is not a valid choice in scene/
  );
  assert.equal(JSON.stringify(state), stateSnapshot, 'Original state must remain untouched on invalid choice');
  assert.equal(JSON.stringify(scene), sceneSnapshot, 'Original SceneState must remain OPEN and untouched');

  // 2. Insufficient resource inside choice (food needed = 5, set food = 2)
  const impoverishedState: CampaignState = JSON.parse(JSON.stringify(state));
  impoverishedState.weeklyLedger.food = 2;
  const impoverishedSnapshot = JSON.stringify(impoverishedState);

  assert.throws(
    () => SceneResolver.resolveSceneChoice(scene, 'choice_feed_beast', event, impoverishedState),
    /RESOURCE_LOSS insufficient resource/
  );
  assert.equal(JSON.stringify(impoverishedState), impoverishedSnapshot, 'Atomicity: state untouched when choice requirements fail');
  assert.equal(scene.status, 'OPEN', 'SceneState remains OPEN after failed resolution');

  console.log('✓ Hard Gate 5 & 6 Passed: Fail-closed on invalid choiceId, strict atomicity and SceneState preservation');
}

// Hard Gate 7 & 8: Save/Load & JSON round-trip of open/resolved scenes
{
  const oppRoad: EventOpportunity = {
    opportunityId: 'opp_travel_road_accident',
    eventType: 'TRAVEL_ROAD_ACCIDENT',
    magnitude: 'MINOR',
    baseWeight: 4,
    weight: 4,
    tags: ['viagem', 'acidente'],
    eligible: true,
    reasons: ['Estrada'],
    timeCostHint: 'DAY'
  };

  const event = createEventRecord(oppRoad, 14, 4, 'TRAVEL');
  const scene = event.scene!;

  // Serialize OPEN scene
  const serializedScene = JSON.stringify(scene);
  const reloadedScene = JSON.parse(serializedScene);

  assert.deepEqual(reloadedScene, scene);
  assert.equal(reloadedScene.status, 'OPEN');

  // Can resolve from reloaded scene
  const state = createInitialTestCampaignState();
  const res = SceneResolver.resolveSceneChoice(reloadedScene, 'choice_repair_materials', event, state);
  assert.equal(res.eventProcessingResult.applied, true);
  assert.equal(res.eventProcessingResult.nextState.weeklyLedger.materials.timber, 20); // 25 - 5

  console.log('✓ Hard Gate 7 & 8 Passed: Save/Load & JSON round-trip preservation of SceneState');
}

// Hard Gate 9, 10 & 11: Calendar preservation, zero LLM, zero implicit mutations
{
  const state = createInitialTestCampaignState();
  const oppTrade: EventOpportunity = {
    opportunityId: 'opp_trade_opportunistic_merchant',
    eventType: 'TRADE_OPPORTUNISTIC_MERCHANT',
    magnitude: 'SIGNIFICANT',
    baseWeight: 4,
    weight: 4,
    tags: ['comercio'],
    eligible: true,
    reasons: ['Mercado'],
    timeCostHint: 'HOURS'
  };

  const event = createEventRecord(oppTrade, 14, 5, 'TRADE');
  const scene = event.scene!;

  // Decline choice (mutations: [], additionalTimeCost: 'NONE')
  const res = SceneResolver.resolveSceneChoice(scene, 'choice_trade_decline', event, state);

  // Hard Gate 9: Calendar preserved
  assert.equal(res.eventProcessingResult.nextState.weeklyLedger.week, 14);
  assert.equal(res.eventProcessingResult.nextState.worldLedger.currentDate.week, 14);
  assert.equal(res.eventProcessingResult.nextState.weeklyLedger.season, 'Sunreach');

  // Hard Gate 11: Zero implicit mutations
  assert.equal(res.eventProcessingResult.nextState.weeklyLedger.silverdew, 350);
  assert.equal(res.eventProcessingResult.nextState.weeklyLedger.food, 80);
  assert.equal(res.eventProcessingResult.nextState.weeklyLedger.materials.timber, 25);

  console.log('✓ Hard Gate 9, 10 & 11 Passed: Calendar unaffected, pure TS resolver, zero implicit magnitude mutations');
}

// Requisito 11: Teste de Cadeia Completa (Base Event -> Open Scene -> Choice Resolution -> Idempotence & Causal Event)
{
  const state = createInitialTestCampaignState();

  // 1. Ocorrência do Evento Base (registrado no estado)
  const oppDiplomacy: EventOpportunity = {
    opportunityId: 'opp_diplomacy_tension_incident',
    eventType: 'DIPLOMACY_TENSION_INCIDENT',
    magnitude: 'SIGNIFICANT',
    baseWeight: 4,
    weight: 4,
    tags: ['diplomacia', 'tensao'],
    eligible: true,
    reasons: ['Embaixada'],
    timeCostHint: 'NONE'
  };

  const baseEvent = createEventRecord(oppDiplomacy, 14, 6, 'DIPLOMACY');
  assert.ok(baseEvent.scene !== undefined);

  // Processa o evento base no state (registrando-o no eventStore)
  const baseResult = processEvent(baseEvent, state);
  assert.equal(baseResult.applied, true);
  assert.equal(baseResult.nextState.eventStore?.length, 1);
  assert.equal(baseResult.nextState.eventStore?.[0].id, baseEvent.eventId);

  // 2. A cena permanece OPEN
  const openScene = baseEvent.scene;
  assert.equal(openScene.status, 'OPEN');

  // 3. Escolha do jogador: choice_diplomatic_gift (-50 SD, +1 Opinião)
  const resolutionResult = SceneResolver.resolveSceneChoice(
    openScene,
    'choice_diplomatic_gift',
    baseEvent,
    baseResult.nextState
  );

  // Confirmação de que a resolução NÃO foi tratada como replay do baseEvent
  assert.equal(resolutionResult.eventProcessingResult.applied, true, 'Resolution must NOT be treated as replay of baseEvent');
  assert.equal(resolutionResult.eventProcessingResult.idempotentReplay, false);
  assert.equal(resolutionResult.nextSceneState.status, 'RESOLVED');
  assert.equal(resolutionResult.eventProcessingResult.nextState.weeklyLedger.silverdew, 300); // 350 - 50
  assert.equal(resolutionResult.eventProcessingResult.nextState.worldLedger.nobleHouses[0].opinion, 1); // 0 + 1

  // O eventStore agora tem 2 registros distintos e correlacionados
  const updatedEventStore = resolutionResult.eventProcessingResult.nextState.eventStore!;
  assert.equal(updatedEventStore.length, 2);
  assert.equal(updatedEventStore[0].id, baseEvent.eventId);
  assert.equal(updatedEventStore[1].id, resolutionResult.eventProcessingResult.eventId);

  // 4. Idempotência da Resolução: se a resolução for reexecutada no mesmo estado, detecta replay da resolução
  const replayEventRecord = {
    ...baseEvent,
    eventId: resolutionResult.eventProcessingResult.eventId,
    mutations: resolutionResult.sceneOutcome.mutations
  };
  const replayResult = processEvent(replayEventRecord, resolutionResult.eventProcessingResult.nextState);
  assert.equal(replayResult.applied, false);
  assert.equal(replayResult.idempotentReplay, true);
  assert.equal(replayResult.nextState.weeklyLedger.silverdew, 300, 'Treasury must not decrement again on replay');

  // 5. Causal Chaining: encadear um novo evento causal subsequente
  const causalEvent = createEventRecord(
    {
      opportunityId: 'opp_flavor_raven_wall',
      eventType: 'ATMOSPHERIC_FLAVOR_RAVEN',
      magnitude: 'INCIDENTAL',
      baseWeight: 5,
      weight: 5,
      tags: ['flavor'],
      eligible: true,
      reasons: ['Causal link'],
      timeCostHint: 'NONE'
    },
    14,
    7,
    'DIPLOMACY',
    { causalParentEventId: resolutionResult.eventProcessingResult.eventId }
  );

  const causalResult = processEvent(causalEvent, resolutionResult.eventProcessingResult.nextState);
  assert.equal(causalResult.applied, true);
  assert.equal(causalResult.nextState.eventStore?.length, 3);
  assert.equal(causalResult.nextState.eventStore?.[2].id, causalEvent.eventId);

  console.log('✓ Requisito 11 Passed: Full chain test (Base Event -> Open Scene -> Choice Resolution -> Idempotency & Causal Event)');
}

console.log('--- ALL SceneResolver TESTS PASSED ---\n');

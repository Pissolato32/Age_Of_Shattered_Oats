import { CampaignState } from '../types';
import {
  NARRATIVE_CONTRACT_VERSION,
  NarrativeObserver,
  ObserverProjection,
  NarrativeScene,
  NarrativeActor,
  NarrativeRelationship,
  AuthorizedKnowledgeFact,
  RelevantEvent,
  NarrativeConstraint
} from './narrativeContracts';

const DEFAULT_CONSTRAINTS: readonly NarrativeConstraint[] = [
  {
    code: 'NO_INVENTED_MECHANICS',
    instruction: 'Do not invent new mechanics, stat deductions, resources or deaths not in the report.'
  },
  {
    code: 'PRESERVE_OUTCOME',
    instruction: 'Adhere strictly to mechanical facts and outcome delivered by the Engine.'
  },
  {
    code: 'RESPECT_KNOWLEDGE_BOUNDARY',
    instruction: 'Do not reveal facts or secrets not explicitly provided in the authorized context.'
  },
  {
    code: 'PRESERVE_RUMOR_UNCERTAINTY',
    instruction: 'Treat rumors as unconfirmed and maintain uncertainty in narrative presentation.'
  }
];

export function createObserverProjection(
  state: CampaignState,
  observer: NarrativeObserver
): ObserverProjection {
  const isPlayerObserver =
    observer.kind === 'PLAYER' ||
    (observer.kind === 'CHARACTER' && state?.character?.name && observer.observerId.toLowerCase() === state.character.name.toLowerCase());

  if (!isPlayerObserver || !state || !state.character) {
    const unknownScene: NarrativeScene = {
      locationId: 'unknown',
      regionName: 'Unknown',
      environment: 'Unknown',
      weather: state?.weeklyLedger?.weather || 'Clear',
      season: state?.weeklyLedger?.season || 'Thawtide'
    };

    return {
      contractVersion: NARRATIVE_CONTRACT_VERSION,
      observer,
      scene: unknownScene,
      actors: [],
      relationships: [],
      knownFacts: [],
      recentEvents: [],
      narrativeConstraints: DEFAULT_CONSTRAINTS
    };
  }

  const loc = state.character.location;
  const scene: NarrativeScene = {
    locationId: loc.landmark || loc.subregion || loc.region || 'Valenfort Citadel',
    regionName: loc.region || 'Unknown Region',
    environment: loc.subregion || loc.region || 'Settlement',
    weather: state.weeklyLedger.weather || 'Clear',
    season: state.weeklyLedger.season || 'Thawtide',
    currentActivity: state.character.title
  };

  const actors: NarrativeActor[] = [
    {
      actorId: state.character.name,
      name: state.character.name,
      role: state.character.title,
      house: state.character.house
    }
  ];

  const relationships: NarrativeRelationship[] = [];
  const knownFacts: AuthorizedKnowledgeFact[] = [];

  if (state.nobleHouses && Array.isArray(state.nobleHouses)) {
    for (const house of state.nobleHouses) {
      relationships.push({
        relationshipId: `rel_${state.character.house}_${house.name}`,
        sourceActorId: state.character.house,
        targetActorId: house.name,
        knownOpinion: house.opinion
      });

      if (house.rumor) {
        knownFacts.push({
          factId: `rumor_${house.name.toLowerCase().replace(/\s+/g, '_')}`,
          statement: house.rumor,
          tier: 'RUMOR',
          certainty: 'UNCONFIRMED',
          source: 'RUMOR',
          subjectId: house.name
        });
      }
    }
  }

  if (state.worldSecrets && Array.isArray(state.worldSecrets)) {
    for (const sec of state.worldSecrets) {
      if (sec.revealed) {
        knownFacts.push({
          factId: sec.id,
          statement: sec.description,
          tier: 'SECRET',
          certainty: 'CONFIRMED',
          source: 'ENGINE',
          subjectId: sec.id
        });
      }
    }
  }

  const recentEvents: RelevantEvent[] = [];
  if (state.eventLog && Array.isArray(state.eventLog)) {
    for (let i = 0; i < state.eventLog.length; i++) {
      recentEvents.push({
        eventId: `evt_${i + 1}`,
        eventType: 'EVENT_LOG',
        summary: state.eventLog[i],
        week: state.weeklyLedger.week || 1,
        knowledgeTier: 'PLAYER_KNOWLEDGE'
      });
    }
  }

  return {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    observer,
    scene,
    actors,
    relationships,
    knownFacts,
    recentEvents,
    narrativeConstraints: DEFAULT_CONSTRAINTS
  };
}

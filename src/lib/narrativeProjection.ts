import { CampaignState } from '../types';
import {
  NARRATIVE_CONTRACT_VERSION,
  NarrativeObserver,
  ObserverProjection,
  NarrativeScene,
  SceneState,
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

/**
 * Deny-by-default, allow-listed boundary that converts the raw CampaignState
 * into an authoritative ObserverProjection strictly scoped to the observer's
 * perspective, preventing information leakage (secrets, raw numbers, fog-of-war).
 */
export function createObserverProjection(
  state: CampaignState,
  observer: NarrativeObserver
): ObserverProjection {
  const isPlayerObserver =
    observer.kind === 'PLAYER' ||
    (observer.kind === 'CHARACTER' &&
      state?.character?.name &&
      observer.observerId.toLowerCase() === state.character.name.toLowerCase());

  // Non-player observer or uninitialized state receives a minimal, scoped projection
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
      observer: { ...observer },
      scene: unknownScene,
      actors: [],
      relationships: [],
      knownFacts: [],
      recentEvents: [],
      narrativeConstraints: DEFAULT_CONSTRAINTS
    };
  }

  // 1. Scene Construction (scoped to current location)
  const loc = state.character.location;
  const immediateCircumstances: string[] = [];

  // Observable unresolved pending consequences (tension in motion, never exposing future trigger turn)
  if (state.sessionLog?.pendingConsequences && Array.isArray(state.sessionLog.pendingConsequences)) {
    for (const pc of state.sessionLog.pendingConsequences) {
      if (!pc.resolved) {
        immediateCircumstances.push(`Um assunto previamente iniciado segue em andamento: ${pc.description}`);
      }
    }
  }

  if (state.weeklyLedger?.famineTicks && state.weeklyLedger.famineTicks > 0) {
    immediateCircumstances.push('A escassez de mantimentos afeta o ânimo do assentamento.');
  }
  if (state.weeklyLedger?.unpaidWagesTicks && state.weeklyLedger.unpaidWagesTicks > 0) {
    immediateCircumstances.push('O pagamento dos soldados está atrasado, gerando inquietação.');
  }

  // 1.1 Scene State Classification (PART 122.2, 122.5, 122.7)
  let sceneState: SceneState = 'Resolved';
  const hasActiveThreat = Boolean(state.worldLedger?.activeConflicts && state.worldLedger.activeConflicts.length > 0);
  const isCaravanTraveling = Boolean(state.caravanLedger?.activeCaravans && state.caravanLedger.activeCaravans.length > 0);

  if (hasActiveThreat && ((state.weeklyLedger?.unpaidWagesTicks ?? 0) > 1 || (state.weeklyLedger?.famineTicks ?? 0) > 1)) {
    sceneState = 'Interrupted';
  } else if (isCaravanTraveling && immediateCircumstances.length === 0) {
    sceneState = 'Suspended';
  } else {
    sceneState = 'Resolved';
  }

  const scene: NarrativeScene = {
    locationId: loc.landmark || loc.subregion || loc.region || 'Valenfort Citadel',
    regionName: loc.region || 'Unknown Region',
    environment: loc.subregion || loc.region || 'Settlement',
    weather: state.weeklyLedger.weather || 'Clear',
    season: state.weeklyLedger.season || 'Thawtide',
    sceneState,
    currentActivity: state.character.title,
    immediateCircumstances: immediateCircumstances.length > 0 ? immediateCircumstances : undefined
  };

  // 2. Actors in Scope (Player character, inner circle advisors, and visible local figures)
  const actors: NarrativeActor[] = [
    {
      actorId: state.character.name,
      name: state.character.name,
      role: state.character.title,
      house: state.character.house
    }
  ];

  // Include Player's Inner Circle Advisors / Lieutenants
  if (state.advisors) {
    if (state.advisors.counselorName) {
      actors.push({
        actorId: 'advisor_counselor',
        name: state.advisors.counselorName,
        role: state.character.archetype === 'Landless' ? 'Sargento e Segundo em Comando' : 'Conselheira de Chancelaria e Diplomacia',
        goals: ['Aconselhar o líder e zelar pela honra da Casa']
      });
    }
    if (state.advisors.stewardName) {
      actors.push({
        actorId: 'advisor_steward',
        name: state.advisors.stewardName,
        role: state.character.archetype === 'Landless' ? 'Intendente e Pagador da Tropa' : 'Intendente de Fazenda e Provisões',
        goals: ['Controlar os mantimentos e o tesouro']
      });
    }
    if (state.advisors.spyMasterName) {
      actors.push({
        actorId: 'advisor_spymaster',
        name: state.advisors.spyMasterName,
        role: state.character.archetype === 'Landless' ? 'Batedor e Olhos da Companhia' : 'Mestre dos Sussurros e Informações',
        goals: ['Vigiar os movimentos dos rivais e reportar segredos']
      });
    }
  }

  if (state.holdings?.residentSmith?.name) {
    actors.push({
      actorId: 'resident_smith',
      name: state.holdings.residentSmith.name,
      role: 'Mestre Armeiro e Ferreiro',
      goals: ['Forjar e manter o equipamento de armas']
    });
  }

  if (state.worldLedger?.nobleHouses && Array.isArray(state.worldLedger.nobleHouses)) {
    for (const house of state.worldLedger.nobleHouses) {
      if (house.currentLord && (house.region === loc.region || !house.region || loc.region === 'Unknown Region')) {
        actors.push({
          actorId: `npc_${house.name.toLowerCase().replace(/\s+/g, '_')}`,
          name: house.currentLord,
          role: `Lord of House ${house.name}`,
          house: house.name,
          goals: [house.relationshipDetail || `Govern ${house.seat || house.name}`]
        });
      }
    }
  }

  // 3. Relationships, Active Memories & Public Rumors
  const relationships: NarrativeRelationship[] = [];
  const knownFacts: AuthorizedKnowledgeFact[] = [];

  // Active non-decayed character memories
  if (state.character.memories && Array.isArray(state.character.memories)) {
    for (const mem of state.character.memories) {
      if (!mem.decayed) {
        knownFacts.push({
          factId: mem.id,
          statement: `[Memória] ${mem.description}`,
          tier: 'CHARACTER_KNOWLEDGE',
          certainty: 'CONFIRMED',
          source: 'ENGINE',
          subjectId: mem.subjectId
        });
      }
    }
  }

  // Inner circle and trusted advisors fact
  if (state.advisors) {
    const list = [
      state.advisors.counselorName ? `${state.advisors.counselorName} (Chancelaria e Braço Direito)` : null,
      state.advisors.stewardName ? `${state.advisors.stewardName} (Intendente de Provisões e Finanças)` : null,
      state.advisors.spyMasterName ? `${state.advisors.spyMasterName} (Mestre dos Sussurros e Batedor)` : null
    ].filter(Boolean).join(', ');
    if (list) {
      knownFacts.push({
        factId: 'fact_inner_circle',
        statement: `Oficiais de confiança e conselheiros diretos do líder: ${list}`,
        tier: 'CHARACTER_KNOWLEDGE',
        certainty: 'CONFIRMED',
        source: 'ENGINE'
      });
    }
  }

  // Material standing facts (qualitative state of treasury and food without raw numbers)
  if (state.weeklyLedger) {
    const silverdew = state.weeklyLedger.silverdew ?? 0;
    const food = state.weeklyLedger.food ?? 0;
    
    let treasuryStanding = 'Os cofres da tesouraria guardam uma reserva moderada de moedas de prata para o custeio da companhia.';
    if (silverdew >= 400) {
      treasuryStanding = 'As arcas de ferro da tesouraria estão fartas e pesadas de moedas de prata, garantindo os soldos e contratações.';
    } else if (silverdew < 100) {
      treasuryStanding = 'As arcas da tesouraria encontram-se baixas e em nível crítico, exigindo cuidado estrito com cada moeda.';
    }

    let foodStanding = 'Os celeiros e fardos de provisões possuem rações regulares para a alimentação da tropa.';
    if (food >= 8) {
      foodStanding = 'Os celeiros e armazéns estão plenamente abastecidos de grãos e carne salgada para muitas semanas.';
    } else if (food < 2 || (state.weeklyLedger.famineTicks ?? 0) > 0) {
      foodStanding = 'Os estoques de comida estão perigosamente escassos, impondo racionamento rigoroso aos homens.';
    }

    knownFacts.push({
      factId: 'fact_treasury_standing',
      statement: `[Situação do Tesouro] ${treasuryStanding}`,
      tier: 'CHARACTER_KNOWLEDGE',
      certainty: 'CONFIRMED',
      source: 'ENGINE'
    });

    knownFacts.push({
      factId: 'fact_food_standing',
      statement: `[Situação dos Mantimentos] ${foodStanding}`,
      tier: 'CHARACTER_KNOWLEDGE',
      certainty: 'CONFIRMED',
      source: 'ENGINE'
    });
  }

  if (state.worldLedger?.nobleHouses && Array.isArray(state.worldLedger.nobleHouses)) {
    for (const house of state.worldLedger.nobleHouses) {
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

  // 4. Secrets Boundary: ONLY revealed secrets are projected
  if (state.worldSecrets && Array.isArray(state.worldSecrets)) {
    for (const sec of state.worldSecrets) {
      if (sec.revealed === true) {
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

  // 5. Recent Events in Scope
  const recentEvents: RelevantEvent[] = [];
  if (state.worldLedger?.majorEvents && Array.isArray(state.worldLedger.majorEvents)) {
    for (let i = 0; i < state.worldLedger.majorEvents.length; i++) {
      const evt = state.worldLedger.majorEvents[i];
      recentEvents.push({
        eventId: `evt_${i + 1}`,
        eventType: 'EVENT_LOG',
        summary: evt.event,
        week: state.weeklyLedger.week || 1,
        knowledgeTier: 'PLAYER_KNOWLEDGE'
      });
    }
  }

  return {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    observer: { ...observer },
    scene,
    actors,
    relationships,
    knownFacts,
    recentEvents,
    narrativeConstraints: DEFAULT_CONSTRAINTS
  };
}

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
  NarrativeConstraint,
  ResourceStandingTier,
  KnowledgeSnapshot,
  NarrativeQueryContext
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

export function classifyTreasuryStanding(silverdew: number): { tier: ResourceStandingTier; description: string } {
  if (silverdew >= 400) {
    return {
      tier: 'ABUNDANT',
      description: 'As arcas de ferro da tesouraria estão fartas e pesadas de moedas de prata, garantindo os soldos e contratações sem aperto.'
    };
  }
  if (silverdew >= 150) {
    return {
      tier: 'ADEQUATE',
      description: 'Os cofres da tesouraria guardam uma reserva moderada e equilibrada de moedas de prata para o custeio regular da companhia.'
    };
  }
  if (silverdew >= 50) {
    return {
      tier: 'TIGHT',
      description: 'Os cofres da tesouraria estão baixos e operam sob pressão, exigindo rigor no pagamento de soldos.'
    };
  }
  return {
    tier: 'CRITICAL',
    description: 'As arcas da tesouraria encontram-se em nível crítico e quase vazias, com risco imediato de insolvência se houver novos gastos.'
  };
}

export function classifyFoodStanding(food: number, famineTicks = 0): { tier: ResourceStandingTier; description: string } {
  if (food >= 8) {
    return {
      tier: 'ABUNDANT',
      description: 'Os celeiros e armazéns estão plenamente abastecidos de grãos e carne salgada, assegurando fartura para muitas semanas.'
    };
  }
  if (food >= 3) {
    return {
      tier: 'ADEQUATE',
      description: 'Os celeiros e fardos de provisões possuem rações regulares e suficientes para a alimentação da tropa.'
    };
  }
  if (food >= 1 && famineTicks === 0) {
    return {
      tier: 'TIGHT',
      description: 'As provisões nos celeiros estão justas e em declínio, exigindo atenção para evitar escassez.'
    };
  }
  return {
    tier: 'CRITICAL',
    description: 'Os estoques de comida estão perigosamente escassos ou esgotados, impondo racionamento severo e risco de fome.'
  };
}

/**
 * Deny-by-default, allow-listed boundary that converts the raw CampaignState
 * into an authoritative ObserverProjection strictly scoped to the observer's
 * perspective, preventing information leakage (secrets, raw numbers, fog-of-war).
 */
export function createObserverProjection(
  state: CampaignState,
  observer: NarrativeObserver,
  queryScope?: NarrativeQueryContext['temporalScope']
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
  const rawFacts: AuthorizedKnowledgeFact[] = [];

  // Active non-decayed character memories mapped into rawFacts
  if (state.character.memories && Array.isArray(state.character.memories)) {
    for (const mem of state.character.memories) {
      rawFacts.push({
        factId: mem.id,
        statement: `[Memória Turno ${mem.tickRegistered || 'N/A'}] ${mem.description}`,
        tier: 'CHARACTER_KNOWLEDGE',
        certainty: 'CONFIRMED',
        source: 'ENGINE',
        subjectId: mem.subjectId,
        createdTurn: mem.tickRegistered,
        supersedes: (mem as any).supersedes,
        tags: (mem as any).tags
      });
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
      rawFacts.push({
        factId: 'fact_inner_circle',
        statement: `Oficiais de confiança e conselheiros diretos do líder: ${list}`,
        tier: 'CHARACTER_KNOWLEDGE',
        certainty: 'CONFIRMED',
        source: 'ENGINE'
      });
    }
  }

  // Material standing facts derived via formal deterministic thresholds
  if (state.weeklyLedger) {
    const silverdew = state.weeklyLedger.silverdew ?? 0;
    const food = state.weeklyLedger.food ?? 0;
    const famineTicks = state.weeklyLedger.famineTicks ?? 0;

    const treasury = classifyTreasuryStanding(silverdew);
    const foodReport = classifyFoodStanding(food, famineTicks);

    rawFacts.push({
      factId: 'fact_treasury_standing',
      statement: `[Situação do Tesouro: ${treasury.tier}] ${treasury.description}`,
      tier: 'CHARACTER_KNOWLEDGE',
      certainty: 'CONFIRMED',
      source: 'ENGINE'
    });

    rawFacts.push({
      factId: 'fact_food_standing',
      statement: `[Situação dos Mantimentos: ${foodReport.tier}] ${foodReport.description}`,
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
        rawFacts.push({
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
        rawFacts.push({
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

  // Resolver snapshot epistêmico temporal usando o turno dinâmico do CampaignState
  const currentTurn = typeof state.weeklyLedger?.year === 'number'
    ? (state.weeklyLedger.year - 342) * 48 + ((state.weeklyLedger.week || 1) + 8)
    : 1;

  const targetTurn = queryScope?.targetTurn ?? currentTurn;
  const mode = queryScope?.mode ?? 'CURRENT_STATE';

  let snapshot: KnowledgeSnapshot;
  let knownFacts: AuthorizedKnowledgeFact[];

  if (mode === 'HISTORICAL_POINT') {
    // Filtro temporal rigoroso: fatos posteriores a targetTurn são estritamente excluídos
    const factsAtTurn = rawFacts.filter(f => (f.createdTurn ?? 0) <= targetTurn);
    snapshot = {
      asOfTurn: targetTurn,
      activeFacts: factsAtTurn,
      historicalFacts: []
    };
    knownFacts = factsAtTurn;
  } else if (mode === 'TEMPORAL_EVOLUTION') {
    snapshot = {
      asOfTurn: currentTurn,
      activeFacts: rawFacts,
      historicalFacts: rawFacts.filter(f => Boolean(f.supersedes))
    };
    knownFacts = rawFacts;
  } else {
    // CURRENT_STATE: fatos que foram superseded por outros fatos mais recentes são movidos para o histórico
    const supersededIds = new Set(rawFacts.map(f => f.supersedes).filter(Boolean));
    const active = rawFacts.filter(f => !supersededIds.has(f.factId));
    const historical = rawFacts.filter(f => supersededIds.has(f.factId));
    snapshot = {
      asOfTurn: currentTurn,
      activeFacts: active,
      historicalFacts: historical
    };
    knownFacts = active;
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
    narrativeConstraints: DEFAULT_CONSTRAINTS,
    snapshot
  };
}

export function resolveEpistemicSnapshot(
  state: CampaignState,
  queryScope?: NarrativeQueryContext['temporalScope']
): KnowledgeSnapshot {
  const proj = createObserverProjection(state, { kind: 'PLAYER', observerId: 'player' }, queryScope);
  return proj.snapshot || {
    asOfTurn: 1,
    activeFacts: proj.knownFacts,
    historicalFacts: []
  };
}

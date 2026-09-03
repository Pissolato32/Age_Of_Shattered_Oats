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
  NarrativeConstraint,
  KnowledgeSnapshot,
  NarrativeQueryContext,
  ExecutionReport
} from './narrativeContracts';
import type { RetrievalResult } from '../memory/retrieval/ContextRetrievalService';
export function classifyTreasuryStanding(silverdew: number): { tier: string; description: string } {
  if (silverdew >= 1000) return { tier: 'ABUNDANTE', description: 'Os cofres da fortaleza estão cheios.' };
  if (silverdew >= 300) return { tier: 'ESTÁVEL', description: 'O tesouro possui fundos suficientes para manutenção.' };
  if (silverdew >= 100) return { tier: 'APERTADO', description: 'As reservas de prata estão reduzidas.' };
  return { tier: 'CRÍTICO', description: 'O tesouro está quase esgotado.' };
}

export function classifyFoodStanding(food: number, famineTicks: number): { tier: string; description: string } {
  if (famineTicks > 0) return { tier: 'FOME', description: 'A escassez de alimentos aflige os silos.' };
  if (food >= 500) return { tier: 'ABUNDANTE', description: 'Os celeiros estão bem abastecidos.' };
  if (food >= 150) return { tier: 'ESTÁVEL', description: 'Os mantimentos garantem a subsistência da fortaleza.' };
  return { tier: 'CRÍTICO', description: 'As provisões de grãos estão no limite.' };
}

export interface NarrativeEvent {
  readonly eventId: string;
  readonly description: string;
  readonly actorName?: string;
  readonly locationName?: string;
}

export interface SensoryContext {
  readonly region?: string;
  readonly season?: string;
  readonly environment?: string;
}

export type NarrativeOutcome = 'success' | 'failure' | 'in_progress' | 'query_answered' | 'rejected';

/**
 * NarrativeProjection: An epistemological presentation contract between Engine and Narrator.
 * 
 * INVARIANTS:
 * 1. Contains strictly authoritative, observable facts derived from the ExecutionReport and World State.
 * 2. Never invents weather, moods, or facts not present in the authoritative state.
 * 3. Never contains internal numeric metrics (SD, FSU, XP, rolls, DCs, coins) or machine status strings (ACCEPTED, REJECTED).
 * 4. `allowedInferences` authorizes literary framing only—never contradictory or invented world facts.
 */
export interface NarrativeProjection {
  readonly contractVersion: typeof NARRATIVE_CONTRACT_VERSION;
  readonly outcome: NarrativeOutcome;
  readonly subject: string;
  readonly location?: string;
  readonly visibleEvents: readonly NarrativeEvent[];
  readonly authoritativeFacts: readonly string[];
  readonly sensoryContext?: SensoryContext;
  readonly allowedInferences: readonly string[];
}

export function toNarrativeProjection(
  report: ExecutionReport,
  scene?: NarrativeScene
): NarrativeProjection {
  let outcome: NarrativeOutcome = 'rejected';
  if (report.status === 'ACCEPTED') {
    const isProbeOrDispatch = report.consequences?.some(c => c.description.includes('despachad') || c.description.includes('sondagem'));
    outcome = report.actionExecuted === 'INFORMATION' || report.actionExecuted === 'FLAVOR_QUERY'
      ? 'query_answered'
      : (isProbeOrDispatch || report.checkpoint ? 'in_progress' : 'success');
  } else if (report.status === 'REJECTED') {
    outcome = 'rejected';
  } else {
    outcome = 'failure';
  }

  const subject = report.command?.actorId && report.command.actorId !== 'player'
    ? report.command.actorId
    : 'O Comandante';
  const location = report.command?.locationId || (scene ? scene.regionName : undefined);

  // 1. Visible Events (Clean diegetic summaries)
  const visibleEvents: NarrativeEvent[] = [];
  if (report.events && report.events.length > 0) {
    for (const ev of report.events) {
      visibleEvents.push({
        eventId: ev.eventId,
        description: ev.summary
      });
    }
  }

  if (visibleEvents.length === 0) {
    let actionDesc = '';
    if (report.status === 'REJECTED') {
      actionDesc = report.reasonCode || 'A ordem não pôde ser executada pelas forças locais.';
    } else {
      switch (report.actionExecuted) {
        case 'RECRUIT':
          actionDesc = 'Novos homens foram alistados sob o estandarte.';
          break;
        case 'BUILD':
          actionDesc = 'Obras defensivas e estruturas foram erguidas no local.';
          break;
        case 'TRAVEL':
          actionDesc = 'As tropas completaram o deslocamento para o destino ordenado.';
          break;
        case 'MILITARY':
          actionDesc = 'As manobras e patrulhas militares foram executadas nas posições designadas.';
          break;
        case 'INFORMATION':
        case 'FLAVOR_QUERY':
          actionDesc = 'A situação atual e os relatórios de campo foram avaliados pelo comando.';
          break;
        case 'DIPLOMACY':
          actionDesc = report.consequences && report.consequences.length > 0
            ? report.consequences[0].description
            : 'A mensagem diplomática foi despachada sob salvo-conduto.';
          break;
        case 'TRADE':
          actionDesc = 'As trocas de caravana e acordos de mercado foram firmados.';
          break;
        default:
          actionDesc = 'As ordens foram cumpridas pelos oficiais responsáveis.';
      }
    }

    visibleEvents.push({
      eventId: `EV-${report.reportId}`,
      description: actionDesc,
      actorName: subject,
      locationName: location
    });
  }

  // 2. Authoritative Facts
  const authoritativeFacts: string[] = [];
  if (report.status === 'REJECTED' && report.reasonCode) {
    authoritativeFacts.push(`Motivo da recusa mecânica: ${report.reasonCode}`);
  }

  if (report.discoveredInformation && report.discoveredInformation.length > 0) {
    for (const info of report.discoveredInformation) {
      authoritativeFacts.push(info.statement);
    }
  }

  if (report.consequences && report.consequences.length > 0) {
    for (const c of report.consequences) {
      authoritativeFacts.push(c.description);
    }
  }

  // 3. Factual Sensory Context
  let sensoryContext: SensoryContext | undefined = undefined;
  if (scene) {
    const hasRegion = Boolean(scene.regionName && scene.regionName.trim());
    const hasSeason = Boolean(scene.season && scene.season.trim());
    const hasEnv = Boolean(scene.environment && scene.environment.trim());

    if (hasRegion || hasSeason || hasEnv) {
      sensoryContext = {
        region: hasRegion ? scene.regionName : undefined,
        season: hasSeason ? scene.season : undefined,
        environment: hasEnv ? scene.environment : undefined
      };
    }
  }

  // 4. Allowed Inferences
  const allowedInferences: string[] = [
    'A narrativa deve ser escrita estritamente em Português do Brasil (pt-BR).',
    'A narrativa pode descrever a atmosfera física condizente com a estação e o terreno.',
    'A narrativa pode retratar a postura dos oficiais e o peso do comando sem alterar o resultado.',
    'A narrativa deve permanecer em tom de Crônica de Ferro (frio, diegético, fatalista).',
    'Fatos observados devem ser relatados como certezas físicas presentes na cena.',
    'Sob ausência de dados (névoa de guerra/desconhecimento), declare incerteza sóbria sem inventar fatos.',
    'Despachos diplomáticos narram apenas a partida e os preparativos imediatos, jamais a recepção antecipada.',
    'NAR-001 é puramente derivativa: não possui autoridade para mutar estado ou inventar mecânicas.'
  ];

  return {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    outcome,
    subject,
    location,
    visibleEvents,
    authoritativeFacts,
    sensoryContext,
    allowedInferences
  };
}

const DEFAULT_CONSTRAINTS: readonly NarrativeConstraint[] = [
  {
    code: 'NO_INVENTED_MECHANICS',
    instruction: 'Do not invent unrecorded mechanical statistics, rolls, or resources.'
  },
  {
    code: 'PRESERVE_OUTCOME',
    instruction: 'Preserve the exact outcome, consequence, and state determined by the Engine.'
  },
  {
    code: 'RESPECT_KNOWLEDGE_BOUNDARY',
    instruction: 'Do not narrate secrets or unrevealed knowledge that the observer cannot perceive.'
  },
  {
    code: 'PRESERVE_RUMOR_UNCERTAINTY',
    instruction: 'Treat rumors and unconfirmed facts with explicit diegetic uncertainty.'
  }
];

export function createObserverProjection(
  state: CampaignState,
  observer: NarrativeObserver,
  queryScope?: NarrativeQueryContext['temporalScope'],
  retrievalResult?: RetrievalResult,
): ObserverProjection {
  const isPlayer = observer.kind === 'PLAYER';

  const immediateCircumstances: string[] = [];
  const pendingList = (state as any).sessionLog?.pendingConsequences || (state as any).pendingConsequences;
  if (isPlayer && pendingList && Array.isArray(pendingList)) {
    for (const pc of pendingList) {
      if (pc.resolved === false && pc.description) {
        immediateCircumstances.push(pc.description);
      }
    }
  }

  // 1. Scene Construction
  let sceneState: 'Continuing' | 'Resolved' | 'Suspended' | 'Interrupted' | undefined = undefined;
  if (isPlayer) {
    const hasActiveConflicts = Boolean(state.worldLedger?.activeConflicts && state.worldLedger.activeConflicts.length > 0);
    const unpaidWages = (state.weeklyLedger as any)?.unpaidWagesTicks ?? 0;
    const activeCaravans = (state as any).caravanLedger?.activeCaravans;

    if (hasActiveConflicts && unpaidWages > 0) {
      sceneState = 'Interrupted';
    } else if (activeCaravans && Array.isArray(activeCaravans) && activeCaravans.length > 0) {
      sceneState = 'Suspended';
    } else {
      sceneState = 'Resolved';
    }
  }

  const isLandless = state.character?.archetype === 'Landless';
  const charRole = isLandless 
    ? 'Capitão do Bando Livre' 
    : (state.character?.title ? `${state.character.title} da Casa ${state.character.house || 'Soberana'}` : 'Senhor do Feudo');

  const scene: NarrativeScene = {
    locationId: isPlayer ? (state.character?.location?.landmark || (state as any).holdings?.primaryHolding || 'primary_seat') : 'unknown',
    regionName: isPlayer ? (state.character?.location?.region || (state as any).holdings?.region || 'Central Plains') : 'unknown',
    environment: isPlayer ? (isLandless ? 'Acampamento de marcha a céu aberto nos arredores' : 'Fortaleza de pedra e dependências') : '',
    weather: isPlayer ? (state.weeklyLedger?.weather || 'tempo firme e frio') : '',
    season: isPlayer ? (state.weeklyLedger?.season || 'Thawtide') : '',
    sceneState,
    immediateCircumstances: immediateCircumstances.length > 0 ? immediateCircumstances : undefined
  };

  // 2. Visible Actors
  const actors: NarrativeActor[] = isPlayer ? [
    {
      actorId: 'player',
      name: state.character.name,
      role: charRole,
      house: state.character.house
    }
  ] : [];

  if (isPlayer && state.advisors) {
    if (state.advisors.counselorName) {
      actors.push({
        actorId: 'advisor_counselor',
        name: state.advisors.counselorName,
        role: 'Chanceler e Conselheiro Político',
        house: state.character.house
      });
    }
    if (state.advisors.stewardName) {
      actors.push({
        actorId: 'advisor_steward',
        name: state.advisors.stewardName,
        role: 'Intendente de Provisões e Finanças',
        house: state.character.house
      });
    }
    if (state.advisors.spyMasterName) {
      actors.push({
        actorId: 'advisor_spymaster',
        name: state.advisors.spyMasterName,
        role: 'Mestre dos Sussurros e Informações',
        house: state.character.house
      });
    }
  }

  if (isPlayer && state.worldLedger?.nobleHouses && Array.isArray(state.worldLedger.nobleHouses)) {
    for (const house of state.worldLedger.nobleHouses) {
      if (house.currentLord) {
        actors.push({
          actorId: `lord_${house.name.toLowerCase()}`,
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

  if (isPlayer) {
    if (state.character) {
      const loc = state.character.location;
      const isLandlessChar = state.character.archetype === 'Landless';
      const landmark = loc?.landmark || 'Grey Keep';
      const reg = loc?.region || 'Central Plains';
      const campStatus = isLandlessChar
        ? `Situação de Campo: A companhia de armas de ${state.character.name} encontra-se acampada em tendas de marcha e fogueiras a céu aberto nos arredores de ${landmark} (${reg}).`
        : `Situação do Domínio: O assento de ${state.character.name} encontra-se estabelecido em ${landmark} (${reg}).`;

      rawFacts.push({
        factId: 'fact_camp_situation',
        statement: campStatus,
        tier: 'CHARACTER_KNOWLEDGE',
        certainty: 'CONFIRMED',
        source: 'ENGINE',
        subjectId: 'character.location'
      });
    }

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

  if (state.worldLedger?.majorEvents && Array.isArray(state.worldLedger.majorEvents)) {
    for (let i = 0; i < state.worldLedger.majorEvents.length; i++) {
      const evt = state.worldLedger.majorEvents[i];
      rawFacts.push({
        factId: `fact_major_event_${i + 1}`,
        statement: `[Registro Histórico / Batalha]: ${evt.event} (${evt.date || 'Data não registrada'}) em ${evt.region || 'Região central'}. Forças envolvidas: ${evt.involved || 'Forças locais'}. Desfecho: ${evt.resolved || 'Concluído'}.`,
        tier: 'CHARACTER_KNOWLEDGE',
        certainty: 'CONFIRMED',
        source: 'ENGINE',
        subjectId: evt.event
      });
    }
  }

  if (state.worldLedger?.activeConflicts && Array.isArray(state.worldLedger.activeConflicts)) {
    for (let i = 0; i < state.worldLedger.activeConflicts.length; i++) {
      const c = state.worldLedger.activeConflicts[i];
      rawFacts.push({
        factId: `fact_conflict_${i + 1}`,
        statement: `[Conflito Ativo / Ameaça]: ${c.conflict} (${c.sides}) com início em ${c.startDate || 'anos passados'}. Status: ${c.status}.`,
        tier: 'CHARACTER_KNOWLEDGE',
        certainty: 'CONFIRMED',
        source: 'ENGINE',
        subjectId: c.conflict
      });
    }
  }

  if (state.worldLedger?.nobleHouses && Array.isArray(state.worldLedger.nobleHouses)) {
    for (const house of state.worldLedger.nobleHouses) {
      relationships.push({
        relationshipId: `rel_${state.character.house}_${house.name}`,
        sourceActorId: state.character.house,
        targetActorId: house.name,
        knownOpinion: house.opinion
      });

      const relDesc = house.relationshipDetail ? ` Postura política: ${house.relationshipDetail}.` : '';
      const rumorDesc = house.rumor ? ` Rumor da corte: "${house.rumor}".` : '';
      rawFacts.push({
        factId: `fact_house_${house.name.toLowerCase().replace(/\s+/g, '_')}`,
        statement: `[Diplomacia / Casa Nobre]: Casa ${house.name} (${house.status || 'Casa Regional'}, Assento: ${house.seat || 'Forte'}). Lorde Governante: ${house.currentLord || 'Desconhecido'}. Opinião em relação a nós: ${house.opinion >= 0 ? '+' : ''}${house.opinion}.${relDesc}${rumorDesc}`,
        tier: 'CHARACTER_KNOWLEDGE',
        certainty: 'CONFIRMED',
        source: 'ENGINE',
        subjectId: house.name
      });
    }
  }

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
  }

  const currentTurn = typeof state.weeklyLedger?.year === 'number'
    ? (state.weeklyLedger.year - 342) * 48 + ((state.weeklyLedger.week || 1) + 8)
    : 1;

  const targetTurn = queryScope?.targetTurn ?? currentTurn;
  const mode = queryScope?.mode ?? 'CURRENT_STATE';

  let snapshot: KnowledgeSnapshot;
  let knownFacts: AuthorizedKnowledgeFact[];

  if (mode === 'HISTORICAL_POINT') {
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

  // MEM-004: Integrate retrieved memories into knownFacts
  if (retrievalResult && retrievalResult.memories.length > 0) {
    for (const memory of retrievalResult.memories) {
      const fact: AuthorizedKnowledgeFact = {
        factId: `memory_${memory.id}`,
        statement: memory.description,
        tier: 'CHARACTER_KNOWLEDGE',
        certainty: 'CONFIRMED',
        source: 'ENGINE',
        subjectId: memory.subjectId,
        createdTurn: memory.tickRegistered,
        tags: memory.tags,
      };
      knownFacts = [...knownFacts, fact];
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

export const buildObserverProjection = createObserverProjection;


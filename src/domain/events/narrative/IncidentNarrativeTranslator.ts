import { CampaignState } from '../../../types';
import { EventRecord, EventMutation } from '../models';
import { SceneResolutionResult } from '../SceneResolver';
import { NarrativeLLM } from '../../../lib/narrativeLLM';
import {
  MechanicalFacts,
  IncidentNarrativeRequest,
  IncidentNarrativeResponse,
  NarrativeChoicePrompt
} from './IncidentNarrativeContracts';

/**
 * Pure deterministic hash function for procedural flavor selection without Math.random().
 */
function deterministicHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Summarizes mutations into human-readable mechanical facts without leaking raw formulas.
 */
function summarizeMutations(mutations: readonly EventMutation[]): string[] {
  return mutations.map(m => {
    switch (m.kind) {
      case 'RESOURCE_GAIN':
        return `Ganho de recursos: +${m.amount} em ${m.resource}`;
      case 'RESOURCE_LOSS':
        return `Consumo/Dano material: -${m.amount} em ${m.resource}`;
      case 'INJURY_LIGHT':
        return `Baixa leve / ferimento em ${m.targetId}`;
      case 'INJURY_SEVERE':
        return `Baixa severa em ${m.targetId}`;
      case 'TRAVEL_DELAY':
        return `Atraso de marcha: +${m.days} dia(s)`;
      case 'DIPLOMATIC_SHIFT':
        return `Alteração diplomática com Casa ${m.houseId}: ${m.delta > 0 ? '+' : ''}${m.delta}`;
      case 'DISCOVER_FACT':
        return `Descoberta de informação factual: ${m.fact}`;
      case 'CREATE_OPPORTUNITY':
        return `Abertura de nova oportunidade: ${m.opportunityId}`;
      case 'CREATE_CAUSAL_EVENT':
        return `Desdobramento causal registrado: ${m.eventId}`;
      case 'ACTIVITY_CHANGE':
        return `Mudança de atividade ordenada: ${m.activity}`;
      default:
        return 'Efeito mecânico registrado nos anais.';
    }
  });
}

/**
 * Pure procedural fallback generator for offline and error resilience.
 * 100% deterministic based on event facts.
 */
export function buildProceduralIncidentNarrative(request: IncidentNarrativeRequest): IncidentNarrativeResponse {
  const { mechanicalFacts, context, environmentContext, availableChoices } = request;
  const loc = environmentContext?.regionName || context.locationId || 'a fronteira';
  const weather = environmentContext?.weatherDescription ? environmentContext.weatherDescription.toLowerCase() : 'gélido';
  const season = environmentContext?.seasonName || 'Inverno';

  const hash = deterministicHash(`${mechanicalFacts.eventId}_${request.kind}`);

  if (request.kind === 'ATMOSPHERIC_INCIDENT') {
    if (context.eventType.includes('RAVEN') || context.sensoryTags?.includes('corvo')) {
      return {
        narration: `Sob o céu ${weather} de ${season}, um corvo solitário de asas negras pousa sobre as ameias de ${loc}. As sentinelas observam a ave bicando a pedra fria antes de alçar voo rumo aos ermos. O silêncio da vigília permanece inalterado.`,
        source: 'PROCEDURAL_FALLBACK'
      };
    }
    return {
      narration: `O vento cortante sopra pelas escarpas de ${loc} durante a estação de ${season}. As tochas crepitam nas muralhas e a comitiva mantém os mantos cerrados contra a intempérie, preservando a vigilância nos postos avançados.`,
      source: 'PROCEDURAL_FALLBACK'
    };
  }

  if (request.kind === 'INCIDENT_OPENED') {
    const choicesFormatted = availableChoices?.map((c, idx) => ({
      choiceId: c.choiceId,
      formattedText: `${idx + 1}. ${c.label} (${c.descriptiveHint})`
    }));

    if (context.eventType.includes('TRACKS') || context.sensoryTags?.includes('rastros')) {
      return {
        narration: `Batedores retornam apressados através da névoa de ${loc}. Pegadas profundas de botas de ferro e rastros de montarias foram descobertos contornando os desfiladeiros da fronteira. A guarda aguarda ordens imediatas sobre como proceder.`,
        promptChoicesFormatted: choicesFormatted,
        source: 'PROCEDURAL_FALLBACK'
      };
    }

    if (context.eventType.includes('ANIMAL') || context.sensoryTags?.includes('lobo') || context.sensoryTags?.includes('urso')) {
      return {
        narration: `Um rugido grave ecoa na vegetação rasteira de ${loc}. Feras famintas bloqueiam a trilha adiante, farejando os animais de carga da comitiva. Os lanceiros fecham fileiras enquanto os capitães exigem uma diretriz.`,
        promptChoicesFormatted: choicesFormatted,
        source: 'PROCEDURAL_FALLBACK'
      };
    }

    if (context.eventType.includes('ACCIDENT') || context.sensoryTags?.includes('carreta')) {
      return {
        narration: `Um estalo de madeira parte o silêncio da marcha em ${loc}. O eixo de uma das carretas de mantimentos racha ao passar por um lamaçal profundo, ameaçando a carga e retardando a comitiva.`,
        promptChoicesFormatted: choicesFormatted,
        source: 'PROCEDURAL_FALLBACK'
      };
    }

    if (context.eventType.includes('MERCHANT') || context.sensoryTags?.includes('mercador')) {
      return {
        narration: `Uma comitiva de mercadores ambulantes aborda a guarda nas estradas de ${loc}. Sob olhares desconfiados dos vigias, o líder da caravana oferece barganhas e suprimentos raros antes de seguir viagem.`,
        promptChoicesFormatted: choicesFormatted,
        source: 'PROCEDURAL_FALLBACK'
      };
    }

    return {
      narration: `Um incidente inesperado mobiliza os oficiais em ${loc}. A situação exige uma deliberação imediata do comando antes de prosseguir com os trabalhos regulares da campanha.`,
      promptChoicesFormatted: choicesFormatted,
      source: 'PROCEDURAL_FALLBACK'
    };
  }

  // INCIDENT_RESOLVED
  const choiceLabel = mechanicalFacts.choiceMade?.label || 'A decisão tomada';
  const mutationsList = mechanicalFacts.mutationsSummary.join(', ');

  const resolutions = [
    `A diretriz soberana foi cumprida com disciplina em ${loc}. ${choiceLabel}: as medidas foram executadas pelos homens de armas e as ordens assentadas nos anais de ferro.`,
    `Sob o olhar severo dos veteranos em ${loc}, a resolução foi selada. ${choiceLabel}: a comitiva absorveu o impacto prático da escolha e reorganizou as patrulhas.`,
    `Os capitães executaram a ordem com precisão militar em ${loc}. A deliberação encerra o impasse e a campanha retoma seu curso regular.`
  ];

  const selectedResolution = resolutions[hash % resolutions.length];

  return {
    narration: selectedResolution,
    source: 'PROCEDURAL_FALLBACK'
  };
}

/**
 * Authoritative sensory translation adapter.
 * Encapsulates communication with NarrativeLLM while strictly isolating CampaignState.
 */
export class IncidentNarrativeTranslator {
  /**
   * Translates an opened interactive scene or atmospheric incident into sensory prose.
   */
  public static async translateIncidentOpened(
    eventRecord: EventRecord,
    state: CampaignState,
    llm?: NarrativeLLM
  ): Promise<IncidentNarrativeResponse> {
    const mechanicalFacts: MechanicalFacts = {
      eventId: eventRecord.eventId,
      eventType: eventRecord.descriptionContext.eventType,
      magnitude: eventRecord.magnitude,
      domain: eventRecord.domain,
      absoluteTurn: eventRecord.turnOccurred,
      timeCostSummary: eventRecord.timeCost,
      mutationsSummary: summarizeMutations(eventRecord.mutations)
    };

    const advisors = state.advisors
      ? Object.entries(state.advisors).map(([role, name]) => ({ name: String(name), role }))
      : [];

    const environmentContext = {
      regionName: state.character?.location?.region || 'Terras do Norte',
      seasonName: state.weeklyLedger?.season || 'Inverno',
      weatherDescription: state.weeklyLedger?.weather || 'Frio cortante',
      holdingType: state.holdings?.type || 'Fortaleza',
      presentAdvisors: advisors
    };

    const availableChoices: NarrativeChoicePrompt[] = (eventRecord.scene?.choices || []).map(c => ({
      choiceId: c.choiceId,
      label: c.label,
      descriptiveHint: c.additionalTimeCost && c.additionalTimeCost !== 'NONE'
        ? `Consome tempo adicional: ${c.additionalTimeCost}`
        : 'Ação imediata'
    }));

    const kind = eventRecord.magnitude === 'INCIDENTAL'
      ? 'ATMOSPHERIC_INCIDENT'
      : 'INCIDENT_OPENED';

    const request: IncidentNarrativeRequest = {
      kind,
      mechanicalFacts,
      context: eventRecord.descriptionContext,
      environmentContext,
      availableChoices: availableChoices.length > 0 ? availableChoices : undefined
    };

    // If LLM has a dedicated narrateIncident method, invoke it; otherwise fallback procedurally
    if (llm && typeof (llm as any).narrateIncident === 'function') {
      try {
        return await (llm as any).narrateIncident(request);
      } catch (err) {
        return buildProceduralIncidentNarrative(request);
      }
    }

    return buildProceduralIncidentNarrative(request);
  }

  /**
   * Translates the resolution of an incident choice into visceral closure prose.
   */
  public static async translateIncidentResolved(
    resolutionResult: SceneResolutionResult,
    baseEvent: EventRecord,
    state: CampaignState,
    llm?: NarrativeLLM
  ): Promise<IncidentNarrativeResponse> {
    const choiceId = resolutionResult.sceneOutcome.chosenChoiceId || '';
    const chosenChoice = baseEvent.scene?.choices.find(c => c.choiceId === choiceId);
    const mutationsApplied = resolutionResult.eventProcessingResult.mutationsApplied;
    const timeCostApplied = resolutionResult.eventProcessingResult.timeCostApplied;
    const resolutionEventId = resolutionResult.eventProcessingResult.eventId;

    const mechanicalFacts: MechanicalFacts = {
      eventId: baseEvent.eventId,
      eventType: baseEvent.descriptionContext.eventType,
      magnitude: baseEvent.magnitude,
      domain: baseEvent.domain,
      absoluteTurn: baseEvent.turnOccurred,
      timeCostSummary: timeCostApplied,
      mutationsSummary: summarizeMutations(mutationsApplied),
      resolutionEventId,
      choiceMade: {
        choiceId,
        label: chosenChoice?.label || choiceId,
        outcomeSummary: summarizeMutations(mutationsApplied).join('; ') || 'Nenhum dano material.'
      }
    };

    const advisors = state.advisors
      ? Object.entries(state.advisors).map(([role, name]) => ({ name: String(name), role }))
      : [];

    const environmentContext = {
      regionName: state.character?.location?.region || 'Terras do Norte',
      seasonName: state.weeklyLedger?.season || 'Inverno',
      weatherDescription: state.weeklyLedger?.weather || 'Frio cortante',
      holdingType: state.holdings?.type || 'Fortaleza',
      presentAdvisors: advisors
    };

    const request: IncidentNarrativeRequest = {
      kind: 'INCIDENT_RESOLVED',
      mechanicalFacts,
      context: baseEvent.descriptionContext,
      environmentContext
    };

    if (llm && typeof (llm as any).narrateIncident === 'function') {
      try {
        return await (llm as any).narrateIncident(request);
      } catch (err) {
        return buildProceduralIncidentNarrative(request);
      }
    }

    return buildProceduralIncidentNarrative(request);
  }
}

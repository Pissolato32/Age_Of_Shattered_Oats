import { EventOpportunity } from './EventOpportunityEngine';
import { SceneState, SceneChoice } from './models';

interface SceneTemplate {
  readonly opportunityId: string;
  readonly choices: readonly SceneChoice[];
}

const SCENE_CATALOG: readonly SceneTemplate[] = [
  // 1. TRAVEL: Encontro com Animal Selvagem
  {
    opportunityId: 'opp_travel_animal_encounter',
    choices: [
      {
        choiceId: 'choice_fight_beast',
        label: 'Empunhar armas e afugentar a fera pela força',
        additionalTimeCost: 'HOUR',
        mutations: [
          { kind: 'INJURY_LIGHT', targetId: 'mount' }
        ]
      },
      {
        choiceId: 'choice_feed_beast',
        label: 'Lançar rações de viagem para distrair a fera e recuar com cautela',
        additionalTimeCost: 'HALF_HOUR',
        mutations: [
          { kind: 'RESOURCE_LOSS', resource: 'food', amount: 5 }
        ]
      },
      {
        choiceId: 'choice_evade_path',
        label: 'Fazer um desvio longo pela mata fechada',
        additionalTimeCost: 'HALF_DAY',
        mutations: [
          { kind: 'TRAVEL_DELAY', days: 1 }
        ]
      }
    ]
  },

  // 2. TRAVEL: Acidente de Carroça / Estrada
  {
    opportunityId: 'opp_travel_road_accident',
    choices: [
      {
        choiceId: 'choice_repair_materials',
        label: 'Usar tábuas e ferramentas da comitiva para consertar o eixo imediatamente',
        additionalTimeCost: 'HOUR',
        mutations: [
          { kind: 'RESOURCE_LOSS', resource: 'timber', amount: 5 }
        ]
      },
      {
        choiceId: 'choice_wait_assistance',
        label: 'Aguardar ajuda de viajantes ou forjar reparo improvisado',
        additionalTimeCost: 'FULL_DAY',
        mutations: [
          { kind: 'TRAVEL_DELAY', days: 2 }
        ]
      }
    ]
  },

  // 3. TRADE: Oportunidade com Mercador Itinerante
  {
    opportunityId: 'opp_trade_opportunistic_merchant',
    choices: [
      {
        choiceId: 'choice_trade_iron',
        label: 'Comprar lingotes de ferro forjado a preço de ocasião (-30 SD, +10 Ferro)',
        additionalTimeCost: 'HOUR',
        mutations: [
          { kind: 'RESOURCE_LOSS', resource: 'silverdew', amount: 30 },
          { kind: 'RESOURCE_GAIN', resource: 'iron', amount: 10 }
        ]
      },
      {
        choiceId: 'choice_trade_timber',
        label: 'Adquirir vigas de carvalho selecionadas (-20 SD, +15 Madeira)',
        additionalTimeCost: 'HOUR',
        mutations: [
          { kind: 'RESOURCE_LOSS', resource: 'silverdew', amount: 20 },
          { kind: 'RESOURCE_GAIN', resource: 'timber', amount: 15 }
        ]
      },
      {
        choiceId: 'choice_trade_decline',
        label: 'Agradecer a oferta e seguir viagem sem negociar',
        additionalTimeCost: 'NONE',
        mutations: []
      }
    ]
  },

  // 4. BUILD: Problema de Suprimento / Material Defeituoso
  {
    opportunityId: 'opp_build_material_shortage',
    choices: [
      {
        choiceId: 'choice_buy_emergency_stock',
        label: 'Comprar vigas e pedras de fornecedores vizinhos a preço de urgência (-40 SD, +10 Madeira)',
        additionalTimeCost: 'HOUR',
        mutations: [
          { kind: 'RESOURCE_LOSS', resource: 'silverdew', amount: 40 },
          { kind: 'RESOURCE_GAIN', resource: 'timber', amount: 10 }
        ]
      },
      {
        choiceId: 'choice_halt_construction',
        label: 'Pausar o ritmo das obras até a chegada das remessas ordinárias',
        additionalTimeCost: 'FULL_DAY',
        mutations: []
      }
    ]
  },

  // 5. DIPLOMACY: Incidente de Tensão na Embaixada
  {
    opportunityId: 'opp_diplomacy_tension_incident',
    choices: [
      {
        choiceId: 'choice_diplomatic_gift',
        label: 'Oferecer um presente de prata para acalmar os ânimos (-50 SD, +1 Opinião)',
        additionalTimeCost: 'HOUR',
        mutations: [
          { kind: 'RESOURCE_LOSS', resource: 'silverdew', amount: 50 },
          { kind: 'DIPLOMATIC_SHIFT', houseId: 'House Blackwood', delta: 1 }
        ]
      },
      {
        choiceId: 'choice_diplomatic_stand_firm',
        label: 'Sustentar a posição com firmeza sem concessões (-1 Opinião)',
        additionalTimeCost: 'NONE',
        mutations: [
          { kind: 'DIPLOMATIC_SHIFT', houseId: 'House Blackwood', delta: -1 }
        ]
      }
    ]
  }
];

/**
 * SceneFactory (M18.9-C3)
 *
 * Pure functional factory for instantiating deterministic SceneState objects
 * for EventOpportunity occurrences that require player decision agency.
 *
 * Invariants:
 * 1. INCIDENTAL magnitude never opens a scene (returns undefined).
 * 2. Deterministic sceneId derived from eventId.
 * 3. Initial status is always 'OPEN'.
 * 4. Choices are immutable plain objects with predefined EventMutation[].
 */
export class SceneFactory {
  public static createSceneForOpportunity(
    opportunity: EventOpportunity,
    eventId: string
  ): SceneState | undefined {
    // 1. INCIDENTAL never creates a scene
    if (opportunity.magnitude === 'INCIDENTAL') {
      return undefined;
    }

    // 2. Find matching scene template
    const template = SCENE_CATALOG.find(t => t.opportunityId === opportunity.opportunityId);
    if (!template) {
      // If magnitude is MINOR and has no interactive template, it resolves without scene
      if (opportunity.magnitude === 'MINOR') {
        return undefined;
      }
      // For higher magnitudes without specific template, create a fallback generic tactical choice
      return {
        sceneId: `scene_${eventId}`,
        eventId,
        status: 'OPEN',
        choices: [
          {
            choiceId: 'choice_generic_cautious',
            label: 'Adotar postura cautelosa e preservar recursos',
            additionalTimeCost: 'HOUR',
            mutations: []
          },
          {
            choiceId: 'choice_generic_decisive',
            label: 'Agir com determinação e absorver o impacto',
            additionalTimeCost: 'NONE',
            mutations: []
          }
        ]
      };
    }

    return {
      sceneId: `scene_${eventId}`,
      eventId,
      status: 'OPEN',
      choices: template.choices.map(c => ({
        choiceId: c.choiceId,
        label: c.label,
        additionalTimeCost: c.additionalTimeCost,
        mutations: [...c.mutations]
      }))
    };
  }
}

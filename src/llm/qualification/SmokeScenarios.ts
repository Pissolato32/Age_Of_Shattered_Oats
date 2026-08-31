import { NarrativeAction, NarrativeCommand, NarrativeProjection } from '../../lib/narrativeContracts';

export interface SmokeInterpreterScenario {
  readonly id: string;
  readonly name: string;
  readonly playerInput: string;
  readonly expectedAction: NarrativeAction;
  readonly expectedParameters?: Record<string, unknown>;
  readonly expectedRequiresClarification?: boolean;
}

export interface SmokeNarratorScenario {
  readonly id: string;
  readonly name: string;
  readonly projection: NarrativeProjection;
  readonly expectedSensoryTone: string;
}

export const SMOKE_INTERPRETER_SCENARIOS: readonly SmokeInterpreterScenario[] = [
  {
    id: 'smoke_int_build',
    name: 'Construção Básica de Paliçada',
    playerInput: 'Construa uma paliçada de madeira usando 20 trabalhadores nos limites de Grey Keep.',
    expectedAction: 'BUILD',
    expectedRequiresClarification: false
  },
  {
    id: 'smoke_int_info',
    name: 'Consulta de Informações do Feudo',
    playerInput: 'Qual é a situação atual do tesouro e dos celeiros de Grey Keep?',
    expectedAction: 'INFORMATION',
    expectedRequiresClarification: false
  },
  {
    id: 'smoke_int_scout_constraint',
    name: 'Reconhecimento Militar com Restrição Negativa',
    playerInput: 'Destaque 10 homens para reconhecer as estradas ao leste sem iniciar combate nem perseguir inimigos.',
    expectedAction: 'ESPIONAGE',
    expectedParameters: { noCombat: true },
    expectedRequiresClarification: false
  },
  {
    id: 'smoke_int_trade_budget',
    name: 'Compra Comercial com Teto Orçamentário',
    playerInput: 'Compre alimentos para o celeiro, mas não gaste mais de 50 moedas de prata.',
    expectedAction: 'TRADE',
    expectedParameters: { maxCost: 50 },
    expectedRequiresClarification: false
  },
  {
    id: 'smoke_int_ambiguous',
    name: 'Entrada Altamente Ambígua',
    playerInput: 'Faça aquilo lá que combinamos com aquele lorde na semana passada.',
    expectedAction: 'UNKNOWN',
    expectedRequiresClarification: true
  }
];

export const SMOKE_NARRATOR_SCENARIOS: readonly SmokeNarratorScenario[] = [
  {
    id: 'smoke_nar_build_success',
    name: 'Narrativa de Sucesso de Construção',
    projection: {
      outcome: 'success',
      subject: 'Renascent Lord',
      location: 'Grey Keep',
      visibleEvents: [
        { eventId: 'EV_build_01', description: 'Paliçada de madeira reforçada erguida nos limites do feudo.' }
      ],
      authoritativeFacts: [
        'Vinte trabalhadores completaram a fortificação externa.',
        'Muralhas de estacas de carvalho reforçam o perímetro.'
      ],
      sensoryContext: {
        region: 'Florestas do Rio',
        season: 'Longdark',
        environment: 'Bastion'
      }
    },
    expectedSensoryTone: 'Iron Chronicle'
  },
  {
    id: 'smoke_nar_trade_rejection',
    name: 'Narrativa de Recusa Comercial por Orçamento',
    projection: {
      outcome: 'rejected',
      subject: 'Renascent Lord',
      location: 'Grey Keep',
      visibleEvents: [
        { eventId: 'EV_trade_rej_01', description: 'Nenhuma compra de alimentos realizada devido a preços excessivos.' }
      ],
      authoritativeFacts: [
        'Mercadores exigiam valores acima do limite autorizado pelo senhorio.',
        'O tesouro permaneceu intacto nos cofres da fortaleza.'
      ],
      sensoryContext: {
        region: 'Florestas do Rio',
        season: 'Longdark',
        environment: 'Bastion'
      }
    },
    expectedSensoryTone: 'Iron Chronicle'
  }
];

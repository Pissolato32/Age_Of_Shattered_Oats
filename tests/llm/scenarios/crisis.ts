import { BenchmarkScenario } from './types';

export const CRISIS_SCENARIOS: readonly BenchmarkScenario[] = [
  {
    id: 'CRI-001',
    category: 'crisis',
    condition: 'NORMAL',
    title: 'Responder a escassez severa de comida',
    playerInput: 'Distribuir rações emergenciais dos celeiros nobres para aplacar a fome do povo faminto.',
    expected: { action: 'SOCIAL', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_alter_famine_ticks_directly'],
    goldenMustNot: ['end_famine_instantly', 'kill_population_directly']
  },
  {
    id: 'CRI-002',
    category: 'crisis',
    condition: 'NORMAL',
    title: 'Conter motim de soldados com soldo atrasado',
    playerInput: 'Discursar no pátio e prometer pagamento integral do soldo assim que a caravana de prata chegar.',
    expected: { action: 'SOCIAL', stance: 'HONORABLE', requiresClarification: false },
    constraints: ['do_not_resolve_mutiny_instantly'],
    goldenMustNot: ['pay_unpaid_wages_without_silverdew']
  },
  {
    id: 'CRI-003',
    category: 'crisis',
    condition: 'NORMAL',
    title: 'Isolar foco de peste contagiosa',
    playerInput: 'Interditar os portões da vila baixa e queimar roupas e palhas contaminadas.',
    expected: { action: 'MILITARY', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_cure_plague_directly'],
    goldenMustNot: ['kill_all_peasants']
  },
  {
    id: 'CRI-004',
    category: 'crisis',
    condition: 'NORMAL',
    title: 'Combater incêndio nos armazéns de madeira',
    playerInput: 'Mobilizar todo o labor pool para transportar água dos poços e conter as chamas.',
    expected: { action: 'BUILD', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_resolve_fire_damage'],
    goldenMustNot: ['destroy_entire_castle']
  },
  {
    id: 'CRI-005',
    category: 'crisis',
    condition: 'NORMAL',
    title: 'Consultar gravidade da crise de mantimentos',
    playerInput: 'Quantas semanas de grãos ainda restam antes que a fome cause baixas no feudo?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_alter_food_state'],
    goldenMustNot: ['trigger_starvation_event']
  },
  {
    id: 'CRI-006',
    category: 'crisis',
    condition: 'NORMAL',
    title: 'Reprimir saques a celeiros',
    playerInput: 'Mandar a guarda patrulhar com porretes e prender qualquer saqueador pego roubando farinha.',
    expected: { action: 'MILITARY', stance: 'AGGRESSIVE', requiresClarification: false },
    constraints: ['do_not_execute_all_citizens'],
    goldenMustNot: ['slaughter_crowd_directly']
  },
  {
    id: 'CRI-007',
    category: 'crisis',
    condition: 'NORMAL',
    title: 'Solicitar socorro e empréstimo emergencial',
    playerInput: 'Enviar correio urgente pedindo empréstimo de prata à Casa Ironhand sob garantia de colheitas futuras.',
    expected: { action: 'DIPLOMACY', stance: 'DIPLOMATIC', requiresClarification: false },
    constraints: ['do_not_receive_silverdew_instantly'],
    goldenMustNot: ['add_debt_without_engine']
  },
  {
    id: 'CRI-008',
    category: 'crisis',
    condition: 'NORMAL',
    title: 'Evacuar camponeses antes da tempestade de gelo',
    playerInput: 'Abrir os salões e estábulos da fortaleza para abrigar as famílias de camponeses da geada.',
    expected: { action: 'SOCIAL', stance: 'HONORABLE', requiresClarification: false },
    constraints: ['do_not_alter_weather_state'],
    goldenMustNot: ['freeze_peasants_directly']
  },
  {
    id: 'CRI-009',
    category: 'crisis',
    condition: 'NORMAL',
    title: 'Executar líder da insurreição',
    playerInput: 'Levar o agitador rebelde a julgamento sumário para restabelecer a ordem na praça.',
    expected: { action: 'SOCIAL', stance: 'AGGRESSIVE', requiresClarification: false },
    constraints: ['do_not_simulate_rebellion_war'],
    goldenMustNot: ['declare_dynasty_fallen']
  },
  {
    id: 'CRI-010',
    category: 'crisis',
    condition: 'NORMAL',
    title: 'Comprar grãos a preço abusivo de especuladores',
    playerInput: 'Pagar o preço inflacionado exigido pelos mercadores para garantir a sobrevivência imediata da comitiva.',
    expected: { action: 'TRADE', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_resolve_trade_directly'],
    goldenMustNot: ['deplete_treasury_without_engine']
  }
];

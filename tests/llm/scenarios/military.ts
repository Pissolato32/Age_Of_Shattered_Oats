import { BenchmarkScenario } from './types';

export const MILITARY_SCENARIOS: readonly BenchmarkScenario[] = [
  {
    id: 'MIL-001',
    category: 'military',
    condition: 'NORMAL',
    title: 'Recrutar infantaria regular',
    playerInput: 'Recrutar 15 soldados para reforçar as defesas da fortaleza.',
    expected: { action: 'RECRUIT', magnitudeValue: 15, stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_invent_entities', 'do_not_resolve_outcome', 'do_not_modify_state'],
    goldenMustNot: ['calculate_result', 'invent_enemy', 'deduct_silverdew']
  },
  {
    id: 'MIL-002',
    category: 'military',
    condition: 'NORMAL',
    title: 'Patrulha de fronteira',
    playerInput: 'Enviar uma patrulha militar para vigiar as estradas da floresta.',
    expected: { action: 'MILITARY', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_invent_entities', 'do_not_resolve_outcome'],
    goldenMustNot: ['calculate_casualties', 'invent_ambush']
  },
  {
    id: 'MIL-003',
    category: 'military',
    condition: 'NORMAL',
    title: 'Marchar tropas para posto avançado',
    playerInput: 'Marchar a guarnição em direção às Colinas de Ferro.',
    expected: { action: 'TRAVEL', targetId: 'Colinas de Ferro', stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_resolve_outcome'],
    goldenMustNot: ['resolve_travel_speed', 'invent_encounter']
  },
  {
    id: 'MIL-004',
    category: 'military',
    condition: 'NORMAL',
    title: 'Consultar estado do exército',
    playerInput: 'Qual é o número atual de homens na guarnição e seu estado de armas?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_invent_numbers', 'do_not_treat_as_order'],
    goldenMustNot: ['order_march', 'invent_commander']
  },
  {
    id: 'MIL-005',
    category: 'military',
    condition: 'NORMAL',
    title: 'Contratar mercenários',
    playerInput: 'Contratar uma companhia mercenária de 30 lanças.',
    expected: { action: 'RECRUIT', magnitudeValue: 30, stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_deduct_coins', 'do_not_invent_loyalty_events'],
    goldenMustNot: ['resolve_payment', 'invent_rebellion']
  },
  {
    id: 'MIL-006',
    category: 'military',
    condition: 'NORMAL',
    title: 'Fortificar acampamento de cerco',
    playerInput: 'Levantar paliçadas defensivas ao redor do acampamento militar.',
    expected: { action: 'BUILD', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_deduct_timber'],
    goldenMustNot: ['complete_construction_instantly']
  },
  {
    id: 'MIL-007',
    category: 'military',
    condition: 'NORMAL',
    title: 'Posicionamento agressivo na ponte',
    playerInput: 'Bloquear a passagem da ponte com força total e impedir qualquer avanço.',
    expected: { action: 'MILITARY', stance: 'AGGRESSIVE', requiresClarification: false },
    constraints: ['do_not_resolve_battle'],
    goldenMustNot: ['invent_battle_result', 'invent_blood']
  },
  {
    id: 'MIL-008',
    category: 'military',
    condition: 'NORMAL',
    title: 'Vistoriar arsenais',
    playerInput: 'Informar a quantidade de lanças e armaduras disponíveis no arsenal.',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_invent_materials'],
    goldenMustNot: ['order_crafting']
  },
  {
    id: 'MIL-009',
    category: 'military',
    condition: 'NORMAL',
    title: 'Treinar recrutas',
    playerInput: 'Colocar os novos recrutas em treinamento intensivo nas muralhas.',
    expected: { action: 'MILITARY', stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_grant_xp_directly'],
    goldenMustNot: ['invent_veteran_levels']
  },
  {
    id: 'MIL-010',
    category: 'military',
    condition: 'NORMAL',
    title: 'Desmobilizar guarnição excedente',
    playerInput: 'Dispensar 10 soldados para reduzirmos os custos semanais de soldo.',
    expected: { action: 'MILITARY', magnitudeValue: 10, stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_modify_wages_directly'],
    goldenMustNot: ['invent_mutiny']
  },
  {
    id: 'MIL-011',
    category: 'military',
    condition: 'NORMAL',
    title: 'Organizar guarda noturna',
    playerInput: 'Dobrar os postos de vigia sobre as ameias durante a noite.',
    expected: { action: 'MILITARY', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_invent_assassins'],
    goldenMustNot: ['trigger_night_attack']
  },
  {
    id: 'MIL-012',
    category: 'military',
    condition: 'NORMAL',
    title: 'Reconhecimento tático na ravina',
    playerInput: 'Mandar patrulha cautelosa inspecionar a garganta rochosa ao norte.',
    expected: { action: 'MILITARY', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_invent_ambush'],
    goldenMustNot: ['calculate_scouting_roll']
  },
  {
    id: 'MIL-013',
    category: 'military',
    condition: 'NORMAL',
    title: 'Preparar trincheiras e fossos',
    playerInput: 'Cavar fossos e estacas pontiagudas à frente do portão principal.',
    expected: { action: 'BUILD', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_resolve_construction_time'],
    goldenMustNot: ['complete_instantly']
  },
  {
    id: 'MIL-014',
    category: 'military',
    condition: 'NORMAL',
    title: 'Consultar moral das tropas',
    playerInput: 'Como está o ânimo e a disciplina dos homens de armas?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_alter_morale_state'],
    goldenMustNot: ['force_decision']
  },
  {
    id: 'MIL-015',
    category: 'military',
    condition: 'NORMAL',
    title: 'Reforçar escolta da caravana',
    playerInput: 'Destacar 5 cavaleiros para escoltar os mantimentos até o vilarejo.',
    expected: { action: 'MILITARY', magnitudeValue: 5, stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_resolve_delivery'],
    goldenMustNot: ['invent_bandit_raid']
  },
  {
    id: 'MIL-016',
    category: 'military',
    condition: 'NORMAL',
    title: 'Recrutar arqueiros de caça',
    playerInput: 'Alistar 20 caçadores locais como atiradores para a fortaleza.',
    expected: { action: 'RECRUIT', magnitudeValue: 20, stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_invent_special_stats'],
    goldenMustNot: ['calculate_archery_bonus']
  },
  {
    id: 'MIL-017',
    category: 'military',
    condition: 'NORMAL',
    title: 'Posição defensiva e fechar portões',
    playerInput: 'Fechar as grades da fortaleza e colocar todos os homens em prontidão.',
    expected: { action: 'MILITARY', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_invent_siege_attack'],
    goldenMustNot: ['simulate_assault']
  },
  {
    id: 'MIL-018',
    category: 'military',
    condition: 'NORMAL',
    title: 'Consultar custo do soldo',
    playerInput: 'Quanto de prata é necessário semanalmente para manter o exército alimentado e pago?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_alter_treasury'],
    goldenMustNot: ['pay_wages_now']
  },
  {
    id: 'MIL-019',
    category: 'military',
    condition: 'NORMAL',
    title: 'Ordem de cerco a refúgio rebelde',
    playerInput: 'Cercar o covil dos desertores sem atacar diretamente, cortando seus suprimentos.',
    expected: { action: 'MILITARY', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_resolve_surrender'],
    goldenMustNot: ['invent_surrender_event']
  },
  {
    id: 'MIL-020',
    category: 'military',
    condition: 'NORMAL',
    title: 'Manobras conjuntas de cavalaria',
    playerInput: 'Executar exercícios de formação de cavalaria nos campos abertos.',
    expected: { action: 'MILITARY', stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_invent_casualties_in_drills'],
    goldenMustNot: ['roll_accident']
  }
];

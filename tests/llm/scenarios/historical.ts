import { BenchmarkScenario } from './types';

export const HISTORICAL_SCENARIOS: readonly BenchmarkScenario[] = [
  {
    id: 'HIST-001',
    category: 'historical',
    condition: 'NORMAL',
    title: 'Consultar fundador de Grey Keep',
    playerInput: 'Quem foi o lorde que fundou a fortaleza de Grey Keep e quando ele viveu?',
    expected: { action: 'INFORMATION', targetId: 'founder_alden', requiresClarification: false },
    constraints: ['return_historical_founder', 'do_not_invent_events'],
    goldenMustNot: ['make_current_character_founder', 'order_action']
  },
  {
    id: 'HIST-002',
    category: 'historical',
    condition: 'NORMAL',
    title: 'Ordem militar a general morto há turnos (Rejeição por Morte)',
    playerInput: 'Ordene ao General Morr que organize a defesa imediata das muralhas.',
    expected: { action: 'MILITARY', targetId: 'former_general_morr', requiresClarification: false, expectedDeadCharacter: true },
    constraints: ['must_reject_dead_character_action'],
    goldenMustNot: ['execute_military_action_with_dead_general', 'resurrect_character']
  },
  {
    id: 'HIST-003',
    category: 'historical',
    condition: 'NORMAL',
    title: 'Consultar causa da morte do antigo marechal',
    playerInput: 'Como morreu o General Morr e onde seus restos mortais descansam?',
    expected: { action: 'INFORMATION', targetId: 'former_general_morr', requiresClarification: false },
    constraints: ['respect_death_record_fact'],
    goldenMustNot: ['invent_different_death_cause']
  },
  {
    id: 'HIST-004',
    category: 'historical',
    condition: 'NORMAL',
    title: 'Consultar linhagem e governantes anteriores',
    playerInput: 'Apresente a linhagem de nobres que governaram este feudo antes de meu senhorio.',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['respect_genealogy_truth'],
    goldenMustNot: ['invent_fictional_dynasty']
  },
  {
    id: 'HIST-005',
    category: 'historical',
    condition: 'NORMAL',
    title: 'Ação diplomática endereçada a nobre falecido',
    playerInput: 'Enviar uma proposta de casamento com o Lorde Alden o Velho.',
    expected: { action: 'DIPLOMACY', targetId: 'founder_alden', requiresClarification: false, expectedDeadCharacter: true },
    constraints: ['reject_diplomacy_with_deceased_ancestor'],
    goldenMustNot: ['accept_marriage_with_dead_founder']
  },
  {
    id: 'HIST-006',
    category: 'historical',
    condition: 'NORMAL',
    title: 'Consultar tratados selados na era passada',
    playerInput: 'Quais pactos feudais foram firmados na época da Grande Guerra das Cinzas?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['consult_immutable_historical_facts'],
    goldenMustNot: ['alter_ancient_treaty']
  },
  {
    id: 'HIST-007',
    category: 'historical',
    condition: 'NORMAL',
    title: 'Consultar sucessão dinástica ancestral',
    playerInput: 'Quem era o herdeiro legítimo durante o reinado de Lorde Alden?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['respect_succession_history'],
    goldenMustNot: ['rewrite_past_succession']
  },
  {
    id: 'HIST-008',
    category: 'historical',
    condition: 'NORMAL',
    title: 'Prestar honras fúnebres no túmulo do general',
    playerInput: 'Visitar o túmulo do General Morr na cripta e depositar uma coroa de louros.',
    expected: { action: 'SOCIAL', targetId: 'former_general_morr', stance: 'HONORABLE', requiresClarification: false },
    constraints: ['allow_commemoration_without_resurrection'],
    goldenMustNot: ['raise_undead_general']
  },
  {
    id: 'HIST-009',
    category: 'historical',
    condition: 'NORMAL',
    title: 'Consultar antigos votos quebrados pela Casa Ironhand',
    playerInput: 'A Casa Ironhand já traiu juramentos nos últimos 100 anos de história?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['ground_in_historical_memory'],
    goldenMustNot: ['declare_unilateral_war']
  },
  {
    id: 'HIST-010',
    category: 'historical',
    condition: 'NORMAL',
    title: 'Inquirir sobre antigas fortalezas soterradas',
    playerInput: 'Há registros históricos de fortalezas destruídas que possam ser reconstruídas na região?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['respect_cartographic_history'],
    goldenMustNot: ['spawn_castle_instantly']
  }
];

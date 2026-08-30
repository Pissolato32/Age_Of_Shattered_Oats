import { BenchmarkScenario } from './types';

export const AMBIGUOUS_SCENARIOS: readonly BenchmarkScenario[] = [
  {
    id: 'AMB-001',
    category: 'ambiguous',
    condition: 'AMBIGUOUS',
    title: 'Ordem vaga: resolver o problema do norte',
    playerInput: 'Resolva a questão que surgiu ao norte.',
    expected: { action: 'UNKNOWN', requiresClarification: true },
    constraints: ['must_request_clarification'],
    goldenMustNot: ['execute_military_attack_directly', 'make_random_choice']
  },
  {
    id: 'AMB-002',
    category: 'ambiguous',
    condition: 'AMBIGUOUS',
    title: 'Marchar sem destino',
    playerInput: 'Quero que as tropas marchem imediatamente.',
    expected: { action: 'TRAVEL', requiresClarification: true },
    constraints: ['must_request_destination_or_clarification'],
    goldenMustNot: ['pick_random_castle']
  },
  {
    id: 'AMB-003',
    category: 'ambiguous',
    condition: 'AMBIGUOUS',
    title: 'Construir algo útil',
    playerInput: 'Usem os materiais para construir algo bom para nós.',
    expected: { action: 'BUILD', requiresClarification: true },
    constraints: ['must_request_building_type'],
    goldenMustNot: ['build_random_cathedral']
  },
  {
    id: 'AMB-004',
    category: 'ambiguous',
    condition: 'AMBIGUOUS',
    title: 'Conversar com alguém importante',
    playerInput: 'Quero falar com quem manda por aqui.',
    expected: { action: 'SOCIAL', requiresClarification: true },
    constraints: ['must_ask_which_character_or_advisor'],
    goldenMustNot: ['execute_random_character']
  },
  {
    id: 'AMB-005',
    category: 'ambiguous',
    condition: 'AMBIGUOUS',
    title: 'Comprar coisas no mercado',
    playerInput: 'Gastar nossa prata comprando suprimentos na feira.',
    expected: { action: 'TRADE', requiresClarification: false },
    constraints: ['do_not_deduct_random_gold'],
    goldenMustNot: ['buy_invalid_goods']
  },
  {
    id: 'AMB-006',
    category: 'ambiguous',
    condition: 'AMBIGUOUS',
    title: 'Texto quase ininteligível',
    playerInput: 'hmmm ok entao tipo... faz aquilo la sabe',
    expected: { action: 'UNKNOWN', requiresClarification: true },
    constraints: ['must_mark_unknown_or_clarification'],
    goldenMustNot: ['trigger_war']
  },
  {
    id: 'AMB-007',
    category: 'ambiguous',
    condition: 'AMBIGUOUS',
    title: 'Investigar suspeitas sem foco',
    playerInput: 'Investiguem o que quer que pareça fora do lugar.',
    expected: { action: 'ESPIONAGE', requiresClarification: true },
    constraints: ['must_ask_target_or_location'],
    goldenMustNot: ['arrest_random_innocent']
  },
  {
    id: 'AMB-008',
    category: 'ambiguous',
    condition: 'AMBIGUOUS',
    title: 'Perguntar sobre a situação geral',
    playerInput: 'Como estão as coisas por aqui hoje?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_interpret_as_action_order'],
    goldenMustNot: ['start_combat', 'recruit_army']
  },
  {
    id: 'AMB-009',
    category: 'ambiguous',
    condition: 'AMBIGUOUS',
    title: 'Ordem de reforço sem quantidade',
    playerInput: 'Alistem mais recrutas para o castelo.',
    expected: { action: 'RECRUIT', requiresClarification: false },
    constraints: ['magnitude_engine_determined'],
    goldenMustNot: ['recruit_infinity']
  },
  {
    id: 'AMB-010',
    category: 'ambiguous',
    condition: 'AMBIGUOUS',
    title: 'Expressão de desagrado',
    playerInput: 'Isso é inaceitável. Não tolerarei tal situação.',
    expected: { action: 'SOCIAL', stance: 'AGGRESSIVE', requiresClarification: true },
    constraints: ['do_not_execute_all_advisors'],
    goldenMustNot: ['murder_advisors']
  }
];

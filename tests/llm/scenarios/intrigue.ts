import { BenchmarkScenario } from './types';

export const INTRIGUE_SCENARIOS: readonly BenchmarkScenario[] = [
  {
    id: 'INT-001',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Infiltrar espião na corte vizinha',
    playerInput: 'Enviar um informante disfarçado de criado para a corte da Casa Vance.',
    expected: { action: 'ESPIONAGE', targetId: 'Casa Vance', stance: 'DECEPTIVE', requiresClarification: false },
    constraints: ['do_not_resolve_infiltration_outcome'],
    goldenMustNot: ['discover_secrets_instantly', 'kill_spy']
  },
  {
    id: 'INT-002',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Consultar rumores da taberna',
    playerInput: 'Há boatos ou sussurros suspeitos circulando entre os viajantes nas hospedarias?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_invent_unregistered_plots'],
    goldenMustNot: ['trigger_assassination_event']
  },
  {
    id: 'INT-003',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Interrogar prisioneiro suspeito',
    playerInput: 'Pressionar o batedor capturado nas masmorras para descobrir quem o contratou.',
    expected: { action: 'INTRIGUE', stance: 'AGGRESSIVE', requiresClarification: false },
    constraints: ['do_not_reveal_unauthorized_secrets'],
    goldenMustNot: ['execute_prisoner_without_order']
  },
  {
    id: 'INT-004',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Semear boatos e desinformação',
    playerInput: 'Espalhar rumores falsos nas feiras de que nossas defesas foram triplicadas.',
    expected: { action: 'INTRIGUE', stance: 'DECEPTIVE', requiresClarification: false },
    constraints: ['do_not_alter_public_opinion_directly'],
    goldenMustNot: ['resolve_deception_check']
  },
  {
    id: 'INT-005',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Subornar oficial da guarnição inimiga',
    playerInput: 'Oferecer 30 moedas de prata para o sargento do portão da fortaleza rival deixar uma passagem destrancada.',
    expected: { action: 'INTRIGUE', magnitudeValue: 30, stance: 'DECEPTIVE', requiresClarification: false },
    constraints: ['do_not_deduct_coins_directly'],
    goldenMustNot: ['open_gates_instantly']
  },
  {
    id: 'INT-006',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Investigar traidor no conselho',
    playerInput: 'Vigiar discretamente as correspondências de Barth para confirmar se ele vende informações.',
    expected: { action: 'ESPIONAGE', targetId: 'Barth', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_condemn_without_evidence'],
    goldenMustNot: ['hang_advisor_directly']
  },
  {
    id: 'INT-007',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Interceptar mensageiro a cavalo',
    playerInput: 'Montar emboscada na floresta para capturar a correspondência lacrada do mensageiro real.',
    expected: { action: 'ESPIONAGE', stance: 'DECEPTIVE', requiresClarification: false },
    constraints: ['do_not_resolve_ambush_combat'],
    goldenMustNot: ['read_letter_contents_instantly']
  },
  {
    id: 'INT-008',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Consultar segredos conhecidos',
    playerInput: 'Quais são as fraquezas e segredos documentados sobre nossos rivais?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_invent_secrets'],
    goldenMustNot: ['grant_blackmail_tokens']
  },
  {
    id: 'INT-009',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Proteger aposentos contra veneno e intrusos',
    playerInput: 'Trocar as fechaduras e ordenar que um provador de comida examine cada prato servido.',
    expected: { action: 'ESPIONAGE', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_invent_poisoning_attempt'],
    goldenMustNot: ['kill_food_taster']
  },
  {
    id: 'INT-010',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Financiar rede de informantes nas docas',
    playerInput: 'Destinar 15 moedas de prata para pagar taverneiros e marinheiros por notícias do porto.',
    expected: { action: 'ESPIONAGE', magnitudeValue: 15, stance: 'DECEPTIVE', requiresClarification: false },
    constraints: ['do_not_deduct_coins_directly'],
    goldenMustNot: ['grant_vision_bonus_directly']
  },
  {
    id: 'INT-011',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Chantagear mercador contrabandista',
    playerInput: 'Ameaçar denunciar os depósitos ilegais de vinho do mercador a menos que ele nos forneça aço barato.',
    expected: { action: 'INTRIGUE', stance: 'DECEPTIVE', requiresClarification: false },
    constraints: ['do_not_resolve_blackmail'],
    goldenMustNot: ['add_steel_directly']
  },
  {
    id: 'INT-012',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Falsificar selo e documentos nobres',
    playerInput: 'Criar uma carta com selo falso da chancelaria autorizando o trânsito de nossas carroças.',
    expected: { action: 'INTRIGUE', stance: 'DECEPTIVE', requiresClarification: false },
    constraints: ['do_not_resolve_forgery_success'],
    goldenMustNot: ['grant_forged_item_directly']
  },
  {
    id: 'INT-013',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Silenciar testemunha incômoda',
    playerInput: 'Prender discretamente o criado que ouviu a discussão do conselho antes que ele fale na vila.',
    expected: { action: 'INTRIGUE', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_kill_character_without_engine'],
    goldenMustNot: ['murder_character_directly']
  },
  {
    id: 'INT-014',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Identificar espião inimigo na guarda',
    playerInput: 'Realizar revistas surpresa e conferir os pertences dos recrutas das muralhas.',
    expected: { action: 'ESPIONAGE', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_invent_culprit'],
    goldenMustNot: ['execute_random_guard']
  },
  {
    id: 'INT-015',
    category: 'intrigue',
    condition: 'NORMAL',
    title: 'Consultar fidelidade dos criados da casa',
    playerInput: 'O mestre dos servos notou alguma movimentação suspeita ou desvio de prata nos aposentos?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_alter_servant_loyalty'],
    goldenMustNot: ['force_accusation']
  }
];

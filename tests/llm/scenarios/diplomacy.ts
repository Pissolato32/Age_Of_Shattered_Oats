import { BenchmarkScenario } from './types';

export const DIPLOMACY_SCENARIOS: readonly BenchmarkScenario[] = [
  {
    id: 'DIP-001',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Consultar relação com Casa Ironhand',
    playerInput: 'Qual é o estado atual de nossa aliança e opinião da Casa Ironhand?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_alter_opinion', 'do_not_force_decision'],
    goldenMustNot: ['declare_war', 'invent_secret_pact']
  },
  {
    id: 'DIP-002',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Enviar embaixador com proposta de paz',
    playerInput: 'Enviar Chanceler Mara com uma comitiva para propor um pacto de não agressão à Casa Vance.',
    expected: { action: 'DIPLOMACY', targetId: 'Casa Vance', stance: 'DIPLOMATIC', requiresClarification: false },
    constraints: ['do_not_resolve_acceptance'],
    goldenMustNot: ['resolve_pact_success', 'invent_assassination']
  },
  {
    id: 'DIP-003',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Silêncio deliberado na corte',
    playerInput: 'Permaneço em silêncio observando o emissário sem proferir nenhuma palavra.',
    expected: { action: 'DIPLOMACY', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_interpret_as_unknown'],
    goldenMustNot: ['reject_input', 'force_speech']
  },
  {
    id: 'DIP-004',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Enviar presentes diplomáticos',
    playerInput: 'Enviar 50 moedas de prata e tecidos finos como presente de cortesia ao Lorde de Rivermeet.',
    expected: { action: 'DIPLOMACY', stance: 'DIPLOMATIC', requiresClarification: false },
    constraints: ['do_not_deduct_coins_before_engine'],
    goldenMustNot: ['modify_treasury_directly']
  },
  {
    id: 'DIP-005',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Ameaça formal de retaliação',
    playerInput: 'Exigir a retirada imediata das patrulhas vizinhas de nossas terras sob pena de retaliação armada.',
    expected: { action: 'THREAT', stance: 'AGGRESSIVE', requiresClarification: false },
    constraints: ['do_not_trigger_immediate_war'],
    goldenMustNot: ['roll_morale_check']
  },
  {
    id: 'DIP-006',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Oferecer casamento dinástico',
    playerInput: 'Propor ao Duque Alden uma união matrimonial entre nossas linhagens para selar a aliança.',
    expected: { action: 'DIPLOMACY', stance: 'DIPLOMATIC', requiresClarification: false },
    constraints: ['do_not_resolve_marriage_outcome'],
    goldenMustNot: ['marry_instantly']
  },
  {
    id: 'DIP-007',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Receber emissário estrangeiro',
    playerInput: 'Conceder audiência formal ao mensageiro das Terras Baixas no grande salão.',
    expected: { action: 'SOCIAL', stance: 'HONORABLE', requiresClarification: false },
    constraints: ['do_not_invent_insults'],
    goldenMustNot: ['invent_poisoned_dagger']
  },
  {
    id: 'DIP-008',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Consultar pretensões territoriais',
    playerInput: 'Quais são as reivindicações legítimas que possuímos sobre as terras do leste?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_alter_claims'],
    goldenMustNot: ['grant_casus_belli']
  },
  {
    id: 'DIP-009',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Pagar tributo exigido',
    playerInput: 'Remeter o tributo anual de prata exigido pela Coroa para manter nossa vassalagem intacta.',
    expected: { action: 'DIPLOMACY', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_mutate_tithe_state'],
    goldenMustNot: ['resolve_crown_reaction']
  },
  {
    id: 'DIP-010',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Propor acordo comercial bilateral',
    playerInput: 'Abrir negociações para redução de pedágios com a guilda de mercadores de Oakhaven.',
    expected: { action: 'TRADE', stance: 'DIPLOMATIC', requiresClarification: false },
    constraints: ['do_not_calculate_profit'],
    goldenMustNot: ['modify_trade_income']
  },
  {
    id: 'DIP-011',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Repudiar insulto diplomático',
    playerInput: 'Expulsar o enviado insolente de nossa presença sem aceitar seus termos degradantes.',
    expected: { action: 'DIPLOMACY', stance: 'AGGRESSIVE', requiresClarification: false },
    constraints: ['do_not_execute_envoy_without_order'],
    goldenMustNot: ['invent_war_declaration']
  },
  {
    id: 'DIP-012',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Consultar lealdade dos vassalos',
    playerInput: 'Qual é o relatório de lealdade dos barões e cavaleiros que nos juraram fidelidade?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_invent_rebellion'],
    goldenMustNot: ['trigger_civil_war']
  },
  {
    id: 'DIP-013',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Mediação de disputa de fronteira',
    playerInput: 'Convidar ambos os fazendeiros e o xerife para resolver a disputa dos marcos de terra.',
    expected: { action: 'SOCIAL', stance: 'HONORABLE', requiresClarification: false },
    constraints: ['do_not_resolve_arbitration'],
    goldenMustNot: ['impose_judgment_instantly']
  },
  {
    id: 'DIP-014',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Oferecer asilo político',
    playerInput: 'Conceder refúgio e abrigo ao nobre fugitivo da Casa Corvo dentro de nossos muros.',
    expected: { action: 'DIPLOMACY', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_resolve_foreign_wrath'],
    goldenMustNot: ['trigger_retaliation_event']
  },
  {
    id: 'DIP-015',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Exigir juramento de fidelidade',
    playerInput: 'Convocar o novo senhor de Stonehill para prestar vassalagem e beijar a lâmina da linhagem.',
    expected: { action: 'DIPLOMACY', stance: 'HONORABLE', requiresClarification: false },
    constraints: ['do_not_invent_rejection'],
    goldenMustNot: ['modify_feudal_tier']
  },
  {
    id: 'DIP-016',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Consultar histórico do tratado antigo',
    playerInput: 'O que dizem os tratados antigos guardados nos arquivos sobre as minas do sul?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_invent_legal_clauses'],
    goldenMustNot: ['award_ownership']
  },
  {
    id: 'DIP-017',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Propor aliança militar mútua',
    playerInput: 'Enviar carta selada propondo pacto de socorro militar imediato se qualquer fronteira for atacada.',
    expected: { action: 'DIPLOMACY', stance: 'DIPLOMATIC', requiresClarification: false },
    constraints: ['do_not_seal_pact_directly'],
    goldenMustNot: ['resolve_ai_decision']
  },
  {
    id: 'DIP-018',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Comprar passagem segura',
    playerInput: 'Oferecer 20 moedas para os guardas da passagem da montanha garantirem trânsito livre de nossos mercadores.',
    expected: { action: 'TRADE', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_deduct_coins'],
    goldenMustNot: ['invent_corruption_scandal']
  },
  {
    id: 'DIP-019',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Protesto formal contra violação de divisa',
    playerInput: 'Redigir um protesto formal contra o corte de madeira irregular realizado pelos lenhadores vizinhos.',
    expected: { action: 'DIPLOMACY', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_escalate_to_combat'],
    goldenMustNot: ['order_attack']
  },
  {
    id: 'DIP-020',
    category: 'diplomacy',
    condition: 'NORMAL',
    title: 'Participar de conselho nobre',
    playerInput: 'Cavalgar com comitiva honrosa para a assembleia dos senhores do vale.',
    expected: { action: 'TRAVEL', stance: 'HONORABLE', requiresClarification: false },
    constraints: ['do_not_resolve_council_voting'],
    goldenMustNot: ['simulate_parliament']
  }
];

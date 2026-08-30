import { BenchmarkScenario } from './types';

export const CROSS_SYSTEM_SCENARIOS: readonly BenchmarkScenario[] = [
  {
    id: 'CRS-001',
    category: 'cross_system',
    condition: 'NORMAL',
    title: 'Cruzamento: Morte + Papel de Comando (Comando a Oficial Morto)',
    playerInput: 'Mande o General Morr reunir a cavalaria e preparar uma sortida contra os invasores.',
    expected: { action: 'MILITARY', targetId: 'former_general_morr', expectedDeadCharacter: true, requiresClarification: false },
    constraints: ['dead_character_action_rejection', 'prevent_ghost_army'],
    goldenMustNot: ['simulate_charge_with_dead_general']
  },
  {
    id: 'CRS-002',
    category: 'cross_system',
    condition: 'NORMAL',
    title: 'Cruzamento: Genealogia + Sucessão + Diplomacia',
    playerInput: 'Consultar a linhagem da Casa Vance para identificar o herdeiro legítimo e propor um tratado nupcial.',
    expected: { action: 'INFORMATION', targetId: 'Casa Vance', requiresClarification: false },
    constraints: ['respect_lineage_and_diplomacy'],
    goldenMustNot: ['marry_invalid_heir_directly']
  },
  {
    id: 'CRS-003',
    category: 'cross_system',
    condition: 'NORMAL',
    title: 'Cruzamento: Intriga + Memória Histórica de 50 anos',
    playerInput: 'Usar o segredo guardado sobre a traição antiga do avô do Lorde Vance para pressioná-lo a ceder passagem.',
    expected: { action: 'INTRIGUE', targetId: 'Casa Vance', stance: 'DECEPTIVE', requiresClarification: false },
    constraints: ['ground_in_historical_secret'],
    goldenMustNot: ['resolve_blackmail_without_engine']
  },
  {
    id: 'CRS-004',
    category: 'cross_system',
    condition: 'NORMAL',
    title: 'Cruzamento: Economia + Ciclo de Vida de Nobres',
    playerInput: 'Destinar uma pensão anual de 20 moedas de prata para a viúva e órfãos do falecido General Morr.',
    expected: { action: 'TRADE', magnitudeValue: 20, stance: 'HONORABLE', requiresClarification: false },
    constraints: ['deduct_via_engine_rules'],
    goldenMustNot: ['modify_treasury_directly']
  },
  {
    id: 'CRS-005',
    category: 'cross_system',
    condition: 'NORMAL',
    title: 'Cruzamento: Papel Anterior vs Papel Atual de Chanceler',
    playerInput: 'Pedir ao Barth que assuma o comando da guarda militar nas muralhas.',
    expected: { action: 'MILITARY', targetId: 'barth', requiresClarification: false },
    constraints: ['respect_current_role_steward_vs_marshal'],
    goldenMustNot: ['reassign_roles_without_engine']
  },
  {
    id: 'CRS-006',
    category: 'cross_system',
    condition: 'NORMAL',
    title: 'Cruzamento: Diplomacia + Memória de Votos Quebrados',
    playerInput: 'Relembrar publicamente ao embaixador Ironhand sobre o juramento que seu pai quebrou na colina.',
    expected: { action: 'DIPLOMACY', stance: 'AGGRESSIVE', requiresClarification: false },
    constraints: ['reference_historical_vow'],
    goldenMustNot: ['trigger_instant_feud']
  },
  {
    id: 'CRS-007',
    category: 'cross_system',
    condition: 'NORMAL',
    title: 'Cruzamento: Sucessão Dinástica + Crise de Guerra',
    playerInput: 'Em caso de minha morte no cerco iminente, quem assumirá o comando como regente da fortaleza?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['evaluate_succession_order'],
    goldenMustNot: ['kill_current_ruler']
  },
  {
    id: 'CRS-008',
    category: 'cross_system',
    condition: 'NORMAL',
    title: 'Cruzamento: Exploração de Mina Ancestral Esgotada',
    playerInput: 'Enviar mineiros para reabrir a antiga galeria de ferro abandonada desde a fundação.',
    expected: { action: 'EXPLORATION', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['respect_patch_historical_state'],
    goldenMustNot: ['replenish_mine_instantly']
  },
  {
    id: 'CRS-009',
    category: 'cross_system',
    condition: 'NORMAL',
    title: 'Cruzamento: Reivindicação Territorial por Ancestralidade',
    playerInput: 'Reivindicar a posse do Vale dos Rios com base nos direitos de primogenitura de Lorde Alden.',
    expected: { action: 'DIPLOMACY', stance: 'HONORABLE', requiresClarification: false },
    constraints: ['respect_founder_claim_rules'],
    goldenMustNot: ['grant_holding_instantly']
  },
  {
    id: 'CRS-010',
    category: 'cross_system',
    condition: 'NORMAL',
    title: 'Cruzamento: Desmobilização Militar + Reassentamento Histórico',
    playerInput: 'Dispensar 15 veteranos e doar a eles lotes de terra nas fazendas do leste para cultivo.',
    expected: { action: 'MILITARY', magnitudeValue: 15, stance: 'HONORABLE', requiresClarification: false },
    constraints: ['resolve_demobilization_via_engine'],
    goldenMustNot: ['mutate_land_ownership_directly']
  }
];

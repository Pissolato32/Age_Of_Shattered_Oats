import { BenchmarkScenario } from './types';

export const ECONOMY_SCENARIOS: readonly BenchmarkScenario[] = [
  {
    id: 'ECO-001',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Consultar tesouro e celeiros',
    playerInput: 'Quanto temos de prata, grãos e materiais estocados na fortaleza?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_alter_ledger', 'do_not_force_decision'],
    goldenMustNot: ['trade_resources', 'pay_tithe']
  },
  {
    id: 'ECO-002',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Construir celeiro fortificado',
    playerInput: 'Iniciar a construção de um celeiro adicional para evitar deterioração de grãos.',
    expected: { action: 'BUILD', stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_deduct_stone_or_timber'],
    goldenMustNot: ['complete_instantly', 'increase_capacity_directly']
  },
  {
    id: 'ECO-003',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Comprar mantimentos no mercado',
    playerInput: 'Comprar 50 fardos de trigo de mercadores itinerantes para abastecer os estoques.',
    expected: { action: 'TRADE', magnitudeValue: 50, stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_resolve_trade_price'],
    goldenMustNot: ['deduct_silverdew_directly', 'add_food_directly']
  },
  {
    id: 'ECO-004',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Vender excedente de madeira',
    playerInput: 'Vender 30 feixes de madeira serrada na feira da cidade para obter prata.',
    expected: { action: 'TRADE', magnitudeValue: 30, stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_calculate_revenue'],
    goldenMustNot: ['add_silverdew_directly']
  },
  {
    id: 'ECO-005',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Ajustar tributação dos camponeses',
    playerInput: 'Elevar a cobrança de impostos sobre as colheitas dos plebeus nesta estação.',
    expected: { action: 'SOCIAL', stance: 'AGGRESSIVE', requiresClarification: false },
    constraints: ['do_not_modify_tax_rate_directly'],
    goldenMustNot: ['trigger_peasant_revolt']
  },
  {
    id: 'ECO-006',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Construir forja de armaduras',
    playerInput: 'Construir uma forja e armaria nos pátios internos da fortificação.',
    expected: { action: 'BUILD', stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_modify_holding_type'],
    goldenMustNot: ['complete_building_directly']
  },
  {
    id: 'ECO-007',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Consultar deterioração de alimentos',
    playerInput: 'Qual é a taxa semanal de perda de grãos nos celeiros devido a pragas e umidade?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_modify_spoilage'],
    goldenMustNot: ['spoil_food_now']
  },
  {
    id: 'ECO-008',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Reparar muralhas danificadas',
    playerInput: 'Empregar pedreiros e pedra talhada para reparar as brechas na muralha oeste.',
    expected: { action: 'BUILD', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_deduct_stone'],
    goldenMustNot: ['restore_holding_durability_directly']
  },
  {
    id: 'ECO-009',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Contratar mão de obra servil',
    playerInput: 'Recrutar 40 trabalhadores camponeses para drenar os pântanos do vale.',
    expected: { action: 'RECRUIT', magnitudeValue: 40, stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_alter_labor_pool'],
    goldenMustNot: ['add_labor_directly']
  },
  {
    id: 'ECO-010',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Comprar minério de ferro',
    playerInput: 'Adquirir 20 lingotes de ferro bruto da guilda dos mineiros.',
    expected: { action: 'TRADE', magnitudeValue: 20, stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_resolve_exchange'],
    goldenMustNot: ['modify_inventory']
  },
  {
    id: 'ECO-011',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Inspecionar produção agrícola',
    playerInput: 'Qual é a estimativa de rendimento da colheita deste outono antes das geadas?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_alter_crop_yield'],
    goldenMustNot: ['harvest_now']
  },
  {
    id: 'ECO-012',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Forjar ferramentas agrícolas',
    playerInput: 'Gastar ferro do armazém para forjar arados e foices para os colonos.',
    expected: { action: 'CRAFT', stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_resolve_crafting'],
    goldenMustNot: ['add_tools_directly']
  },
  {
    id: 'ECO-013',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Reduzir ração dos soldados para economizar',
    playerInput: 'Racionar a distribuição diária de grãos e carne da guarnição pela metade.',
    expected: { action: 'MILITARY', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_alter_food_upkeep'],
    goldenMustNot: ['decrease_morale_directly']
  },
  {
    id: 'ECO-014',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Investir na construção de moinho',
    playerInput: 'Financiar a construção de um moinho d’água junto ao rio da planície.',
    expected: { action: 'BUILD', stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_resolve_project_progress'],
    goldenMustNot: ['complete_instantly']
  },
  {
    id: 'ECO-015',
    category: 'economy',
    condition: 'NORMAL',
    title: 'Verificar balanço semanal de renda líquida',
    playerInput: 'Apresente o relatório do intendente sobre a arrecadação líquida e os custos de manutenção da fortaleza.',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_deduct_expenses'],
    goldenMustNot: ['force_decision']
  }
];

import { BenchmarkScenario } from './types';

export const EXPLORATION_SCENARIOS: readonly BenchmarkScenario[] = [
  {
    id: 'EXP-001',
    category: 'exploration',
    condition: 'NORMAL',
    title: 'Mapear trilhas da floresta densa',
    playerInput: 'Enviar batedores experientes para explorar e cartografar os pântanos do sul.',
    expected: { action: 'EXPLORATION', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_resolve_fog_of_war_directly'],
    goldenMustNot: ['discover_dungeon_instantly', 'kill_scouts']
  },
  {
    id: 'EXP-002',
    category: 'exploration',
    condition: 'NORMAL',
    title: 'Viajar para o feudo aliado',
    playerInput: 'Cavalgar com pequena escolta em direção à Fortaleza de Riverwatch.',
    expected: { action: 'TRAVEL', targetId: 'Fortaleza de Riverwatch', stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_resolve_arrival'],
    goldenMustNot: ['instant_teleport', 'invent_roadside_ambush']
  },
  {
    id: 'EXP-003',
    category: 'exploration',
    condition: 'NORMAL',
    title: 'Consultar rotas de viagem conhecidas',
    playerInput: 'Quais estradas estão seguras e desimpedidas para o trânsito nesta estação de chuvas?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_alter_route_safety'],
    goldenMustNot: ['block_road_directly']
  },
  {
    id: 'EXP-004',
    category: 'exploration',
    condition: 'NORMAL',
    title: 'Investigar ruínas antigas de pedra',
    playerInput: 'Mandar uma patrulha inspecionar as fundações em ruínas no alto da colina.',
    expected: { action: 'EXPLORATION', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_invent_magical_monsters'],
    goldenMustNot: ['grant_magical_loot']
  },
  {
    id: 'EXP-005',
    category: 'exploration',
    condition: 'NORMAL',
    title: 'Procurar novas jazidas de pedra ou minério',
    playerInput: 'Enviar prospectores com ferramentas para buscar veios de ferro na encosta rochosa.',
    expected: { action: 'EXPLORATION', stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_grant_mine_deposit_directly'],
    goldenMustNot: ['add_iron_reserve_instantly']
  },
  {
    id: 'EXP-006',
    category: 'exploration',
    condition: 'NORMAL',
    title: 'Reconhecimento de vau do rio',
    playerInput: 'Verificar a profundidade das águas do rio para saber se as carroças conseguem atravessar.',
    expected: { action: 'EXPLORATION', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_drown_wagons'],
    goldenMustNot: ['resolve_crossing_roll']
  },
  {
    id: 'EXP-007',
    category: 'exploration',
    condition: 'NORMAL',
    title: 'Procurar refúgio seguro nas montanhas',
    playerInput: 'Encontrar cavernas ou passagens secas para servir de abrigo contra nevascas.',
    expected: { action: 'EXPLORATION', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_spawn_shelter_directly'],
    goldenMustNot: ['invent_dragon_lair']
  },
  {
    id: 'EXP-008',
    category: 'exploration',
    condition: 'NORMAL',
    title: 'Consultar tempo de marcha para a capital',
    playerInput: 'Quantos dias de marcha a passo de infantaria nos separam da corte real?',
    expected: { action: 'INFORMATION', requiresClarification: false },
    constraints: ['do_not_modify_travel_time'],
    goldenMustNot: ['order_instant_march']
  },
  {
    id: 'EXP-009',
    category: 'exploration',
    condition: 'NORMAL',
    title: 'Rastrear pegadas de invasores',
    playerInput: 'Seguir os rastros de cavalos que cruzaram nossa fronteira ao amanhecer.',
    expected: { action: 'EXPLORATION', stance: 'CAUTIOUS', requiresClarification: false },
    constraints: ['do_not_resolve_tracking_roll'],
    goldenMustNot: ['trigger_confrontation_directly']
  },
  {
    id: 'EXP-010',
    category: 'exploration',
    condition: 'NORMAL',
    title: 'Expedição fluvial com barcaças',
    playerInput: 'Descer o curso do rio em barcas leves para explorar as vilas pesqueiras a jusante.',
    expected: { action: 'TRAVEL', stance: 'NEUTRAL', requiresClarification: false },
    constraints: ['do_not_sink_barges'],
    goldenMustNot: ['invent_pirate_attack']
  }
];

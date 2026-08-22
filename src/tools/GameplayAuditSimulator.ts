import { createInitialState, resolveWeeklyTurn } from '../engine';
import { CampaignState } from '../types';
import { ProductionService } from '../domain/kingdom/services/ProductionService';
import { PayrollService } from '../domain/military/services/PayrollService';
import { FoodService } from '../domain/kingdom/services/FoodService';
import { LaborService } from '../domain/kingdom/services/LaborService';
import { ConstructionService } from '../domain/kingdom/services/ConstructionService';
import { resolveGenericPlausibleAction } from '../lib/genericResolution';
import { globalRNG } from '../core/RandomService';

export interface SnapshotMetrics {
  week: number;
  season: string;
  silverdew: number;
  food: number;
  laborPool: number;
  materials: { timber: number; stone: number; iron: number };
  armySize: number;
  famineTicks: number;
  unpaidWagesTicks: number;
}

export type ScenarioType = 'PACIFICO' | 'GUERRA' | 'EXPANSIONISTA' | 'CONSERVADOR' | 'CRISE' | 'RECUPERACAO';

export function runScenarioSimulation(scenario: ScenarioType, maxWeeks: number): SnapshotMetrics[] {
  let state = createInitialState('Landed Knight', 'Florestas do Rio');
  state.holdings.type = 'Bastion';
  state.holdings.population = 400;
  state.holdings.resourcePatches = [
    { id: 'patch_grain_1', name: 'Campos de Trigo', type: 'Grain Field', tier: 1, quality: 'Common', incomePerDay: 2, yieldPerDay: 0.5, laborRequired: 20 },
    { id: 'patch_timber_1', name: 'Acampamento Madeireiro', type: 'Timber Camp', tier: 1, quality: 'Common', incomePerDay: 1, yieldPerDay: 2, laborRequired: 20 }
  ];
  state.weeklyLedger.silverdew = 300;
  state.weeklyLedger.food = 10.0;
  state.weeklyLedger.materials = { timber: 80, stone: 40, iron: 15 };

  // Setup específico por cenário
  if (scenario === 'PACIFICO') {
    // Foco em colheita, manutenção mínima de tropa (20 homens)
    state.army.units = [
      { id: 'u1', name: 'Garrison Retinue', size: 20, maxSize: 20, tier: 1, ac: 3, weapon: 'Spears', mount: 'None', morale: 5, type: 'Levy' }
    ];
  } else if (scenario === 'GUERRA') {
    // Exército grande (120 soldados), perdas periódicas, sem novas construções
    state.army.units = [
      { id: 'u1', name: 'Line Infantry', size: 80, maxSize: 80, tier: 1, ac: 4, weapon: 'Polearms', mount: 'None', morale: 5, type: 'Infantry' },
      { id: 'u2', name: 'Bowmen', size: 40, maxSize: 40, tier: 1, ac: 3, weapon: 'Bows', mount: 'None', morale: 5, type: 'Archers' }
    ];
  } else if (scenario === 'EXPANSIONISTA') {
    // Recrutamento e construções contínuas a cada 10 semanas
    state.army.units = [
      { id: 'u1', name: 'Vanguard', size: 40, maxSize: 40, tier: 1, ac: 3, weapon: 'Spears', mount: 'None', morale: 5, type: 'Levy' }
    ];
  } else if (scenario === 'CONSERVADOR') {
    // Zero recrutamento, zero expansão de obras, foco em acumulação
    state.army.units = [
      { id: 'u1', name: 'Personal Guard', size: 15, maxSize: 15, tier: 1, ac: 4, weapon: 'Swords', mount: 'None', morale: 5, type: 'Men-at-Arms' }
    ];
  } else if (scenario === 'CRISE') {
    // Começa com tesouro quase zero (20 SD), comida 0, 60 soldados
    state.weeklyLedger.silverdew = 20;
    state.weeklyLedger.food = 0.5;
    state.army.units = [
      { id: 'u1', name: 'Hungry Garrison', size: 60, maxSize: 60, tier: 1, ac: 3, weapon: 'Spears', mount: 'None', morale: 4, type: 'Levy' }
    ];
  } else if (scenario === 'RECUPERACAO') {
    // Começa em crise mas adota desmobilização de tropa e foco exclusivo em grãos
    state.weeklyLedger.silverdew = 30;
    state.weeklyLedger.food = 1.0;
    state.army.units = [
      { id: 'u1', name: 'Skeleton Crew', size: 10, maxSize: 10, tier: 1, ac: 3, weapon: 'Spears', mount: 'None', morale: 3, type: 'Levy' }
    ];
  }

  const milestones = [1, 10, 20, 50, 100, 250, 520];
  const snapshots: SnapshotMetrics[] = [];

  for (let w = 1; w <= maxWeeks; w++) {
    // Ações comportamentais do cenário no meio do ciclo
    if (scenario === 'EXPANSIONISTA' && w % 12 === 0) {
      // Tenta construir / expandir se houver recursos
      if (state.weeklyLedger.silverdew >= 60 && state.weeklyLedger.materials.timber >= 20) {
        state.weeklyLedger.silverdew -= 60;
        state.weeklyLedger.materials.timber -= 20;
        state.holdings.resourcePatches.push({
          id: `patch_timber_${w}`,
          name: 'Expansão Madeireira',
          type: 'Timber Camp',
          tier: 1,
          quality: 'Common',
          incomePerDay: 1,
          yieldPerDay: 1.5,
          laborRequired: 20
        });
      }
    }

    if (scenario === 'GUERRA' && w % 8 === 0) {
      // Sofre baixas de combate (-10 a -15 homens)
      const u = state.army.units[0];
      if (u && u.size > 15) {
        u.size = Math.max(10, u.size - 12);
      }
    }

    // Virada de semana determinística
    const res = resolveWeeklyTurn(state);
    state = res.updatedState;

    if (milestones.includes(w)) {
      const totalSoldiers = state.army.units.reduce((acc, u) => acc + u.size, 0);
      snapshots.push({
        week: w,
        season: state.weeklyLedger.season,
        silverdew: Math.round(state.weeklyLedger.silverdew * 10) / 10,
        food: Math.round(state.weeklyLedger.food * 10) / 10,
        laborPool: state.holdings.laborPool,
        materials: { ...state.weeklyLedger.materials },
        armySize: totalSoldiers,
        famineTicks: state.weeklyLedger.famineTicks,
        unpaidWagesTicks: state.weeklyLedger.unpaidWagesTicks
      });
    }
  }

  return snapshots;
}

export function executeAudit() {
  console.log('======================================================================');
  console.log('⚔️ M18: AUDITORIA GLOBAL DE GAMEPLAY, ECONOMIA E BALANCEAMENTO');
  console.log('======================================================================\n');

  console.log('--- 1. CONSTANTES E FÓRMULAS CANÔNICAS DA ENGINE ---\n');
  console.log('• Renda Base de Feudos (por semana = 1/4 da renda mensal):');
  console.log('  - Bastion:        75 SD/sem (300/4)');
  console.log('  - Castle:        225 SD/sem (900/4)');
  console.log('  - Fortified Town:150 SD/sem (600/4)');
  console.log('  - Walled City:   375 SD/sem (1500/4)\n');

  console.log('• Custos de Manutenção Militar (Payroll & Food Service):');
  console.log('  - Soldos: 10 soldados = 1 SD/sem (Math.ceil(tropas / 10))');
  console.log('  - Guarnição: 20 guardas = 1 SD/sem (Math.ceil(garrison / 20))');
  console.log('  - Alimentação: 100 soldados = 1.0 FSU/sem ((tropas / 100))\n');

  console.log('• Mão de Obra e População (LaborService):');
  console.log('  - laborPool disponível = Math.floor(population * 0.7) - sum(patch.laborCost)');
  console.log('  - População 400 = 280 mão de obra base\n');

  console.log('• Penalidade de Inverno (Deepfrost):');
  console.log('  - Produção de grãos / FSU: reduzida em 50% (* 0.5)\n');

  const scenarios: ScenarioType[] = ['PACIFICO', 'CONSERVADOR', 'EXPANSIONISTA', 'GUERRA', 'CRISE', 'RECUPERACAO'];

  for (const sc of scenarios) {
    console.log(`\n======================================================================`);
    console.log(`📈 SIMULAÇÃO DE CENÁRIO: [${sc}] (Até 520 Semanas / 10 Anos)`);
    console.log(`======================================================================`);
    const results = runScenarioSimulation(sc, 520);
    console.table(results.map(r => ({
      Semana: r.week,
      Estação: r.season,
      Prata_SD: r.silverdew,
      Comida_FSU: r.food,
      MãoDeObra: r.laborPool,
      Madeira: r.materials.timber,
      Pedra: r.materials.stone,
      Ferro: r.materials.iron,
      Exército: r.armySize,
      Fome_Ticks: r.famineTicks,
      Dívida_Ticks: r.unpaidWagesTicks
    })));
  }
}

executeAudit();

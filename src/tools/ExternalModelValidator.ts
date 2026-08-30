import { createInitialState, resolveWeeklyTurn } from '../engine';
import { CampaignState } from '../types';
import { globalRNG } from '../core/RandomService';

// ============================================================================
// 1. MODELO EXTERNO DE BALANCEAMENTO PROPOSTO (M18.1 / M18.2)
// ============================================================================

export interface HoldingUpkeepModel {
  [holdingType: string]: number;
}

export const PROPOSED_HOLDING_UPKEEP: HoldingUpkeepModel = {
  'Bastion': 70,          // Receita 75 + 21 patches = 96 SD -> Saldo Líquido +22 SD/sem
  'Fortified Town': 130,  // Receita 150 + 21 patches = 171 SD -> Saldo Líquido +37 SD/sem
  'Castle': 190,          // Receita 225 + 21 patches = 246 SD -> Saldo Líquido +52 SD/sem
  'Walled City': 300      // Receita 375 + 21 patches = 396 SD -> Saldo Líquido +81 SD/sem
};

export const PROPOSED_GRANARY_CAPACITY: Record<string, number> = {
  'Bastion': 50.0,
  'Fortified Town': 100.0,
  'Castle': 150.0,
  'Walled City': 300.0
};

export interface TargetCheckpoint {
  week: number;
  year: string;
  targetSD: number;
  targetFSU: number;
}

export const SCENARIO_TARGETS: Record<string, TargetCheckpoint[]> = {
  'PACIFICO': [
    { week: 1, year: 'Sem 1', targetSD: 300, targetFSU: 10.0 },
    { week: 10, year: 'Sem 10', targetSD: 450, targetFSU: 20.0 },
    { week: 50, year: 'Ano 1', targetSD: 1000, targetFSU: 45.0 },
    { week: 100, year: 'Ano 2', targetSD: 1800, targetFSU: 50.0 },
    { week: 156, year: 'Ano 3', targetSD: 2600, targetFSU: 50.0 },
    { week: 260, year: 'Ano 5', targetSD: 4200, targetFSU: 50.0 },
    { week: 312, year: 'Ano 6', targetSD: 5000, targetFSU: 50.0 },
    { week: 520, year: 'Ano 10', targetSD: 7500, targetFSU: 50.0 }
  ],
  'CONSERVADOR': [
    { week: 1, year: 'Sem 1', targetSD: 300, targetFSU: 10.0 },
    { week: 10, year: 'Sem 10', targetSD: 420, targetFSU: 18.0 },
    { week: 50, year: 'Ano 1', targetSD: 900, targetFSU: 40.0 },
    { week: 100, year: 'Ano 2', targetSD: 1500, targetFSU: 50.0 },
    { week: 156, year: 'Ano 3', targetSD: 2200, targetFSU: 50.0 },
    { week: 260, year: 'Ano 5', targetSD: 3500, targetFSU: 50.0 },
    { week: 312, year: 'Ano 6', targetSD: 4200, targetFSU: 50.0 },
    { week: 520, year: 'Ano 10', targetSD: 6200, targetFSU: 50.0 }
  ],
  'EXPANSIONISTA': [
    { week: 1, year: 'Sem 1', targetSD: 300, targetFSU: 10.0 },
    { week: 10, year: 'Sem 10', targetSD: 320, targetFSU: 18.0 },
    { week: 50, year: 'Ano 1', targetSD: 550, targetFSU: 40.0 },
    { week: 100, year: 'Ano 2', targetSD: 1100, targetFSU: 50.0 },
    { week: 156, year: 'Ano 3', targetSD: 1800, targetFSU: 50.0 },
    { week: 260, year: 'Ano 5', targetSD: 3200, targetFSU: 50.0 },
    { week: 312, year: 'Ano 6', targetSD: 4000, targetFSU: 50.0 },
    { week: 520, year: 'Ano 10', targetSD: 6800, targetFSU: 50.0 }
  ],
  'GUERRA': [
    { week: 1, year: 'Sem 1', targetSD: 300, targetFSU: 10.0 },
    { week: 10, year: 'Sem 10', targetSD: 220, targetFSU: 12.0 },
    { week: 50, year: 'Ano 1', targetSD: 350, targetFSU: 22.0 },
    { week: 100, year: 'Ano 2', targetSD: 600, targetFSU: 35.0 },
    { week: 156, year: 'Ano 3', targetSD: 950, targetFSU: 45.0 },
    { week: 260, year: 'Ano 5', targetSD: 1400, targetFSU: 50.0 },
    { week: 312, year: 'Ano 6', targetSD: 1800, targetFSU: 50.0 },
    { week: 520, year: 'Ano 10', targetSD: 2800, targetFSU: 50.0 }
  ],
  'CRISE': [
    { week: 1, year: 'Sem 1', targetSD: 20, targetFSU: 0.5 },
    { week: 10, year: 'Sem 10', targetSD: 110, targetFSU: 4.5 },
    { week: 50, year: 'Ano 1', targetSD: 350, targetFSU: 18.0 },
    { week: 100, year: 'Ano 2', targetSD: 800, targetFSU: 35.0 },
    { week: 156, year: 'Ano 3', targetSD: 1400, targetFSU: 50.0 },
    { week: 260, year: 'Ano 5', targetSD: 2600, targetFSU: 50.0 },
    { week: 312, year: 'Ano 6', targetSD: 3200, targetFSU: 50.0 },
    { week: 520, year: 'Ano 10', targetSD: 5200, targetFSU: 50.0 }
  ],
  'RECUPERACAO': [
    { week: 1, year: 'Sem 1', targetSD: 30, targetFSU: 1.0 },
    { week: 10, year: 'Sem 10', targetSD: 150, targetFSU: 6.5 },
    { week: 50, year: 'Ano 1', targetSD: 450, targetFSU: 22.0 },
    { week: 100, year: 'Ano 2', targetSD: 1050, targetFSU: 45.0 },
    { week: 156, year: 'Ano 3', targetSD: 1700, targetFSU: 50.0 },
    { week: 260, year: 'Ano 5', targetSD: 3000, targetFSU: 50.0 },
    { week: 312, year: 'Ano 6', targetSD: 3800, targetFSU: 50.0 },
    { week: 520, year: 'Ano 10', targetSD: 6000, targetFSU: 50.0 }
  ]
};

// Simulação externa aplicando as regras propostas de Upkeep, Spoilage e Wealth Friction
export function simulateExternalModel(scenario: string, maxWeeks = 520) {
  let state = createInitialState('Landed Knight', 'Florestas do Rio');
  state.holdings.type = 'Bastion';
  state.holdings.population = 400;
  state.holdings.resourcePatches = [
    { id: 'p1', name: 'Campos de Trigo', type: 'Grain Field', tier: 1, quality: 'Common', incomePerDay: 2, yieldPerDay: 0.5, laborRequired: 20 },
    { id: 'p2', name: 'Acampamento Madeireiro', type: 'Timber Camp', tier: 1, quality: 'Common', incomePerDay: 1, yieldPerDay: 2, laborRequired: 20 }
  ];
  state.weeklyLedger.silverdew = 300;
  state.weeklyLedger.food = 10.0;

  if (scenario === 'PACIFICO') {
    state.army.units = [{ id: 'u1', name: 'Garrison Retinue', size: 20, maxSize: 20, tier: 1, ac: 3, weapon: 'Spears', mount: 'None', morale: 5, type: 'Levy' }];
  } else if (scenario === 'CONSERVADOR') {
    state.army.units = [{ id: 'u1', name: 'Personal Guard', size: 15, maxSize: 15, tier: 1, ac: 4, weapon: 'Swords', mount: 'None', morale: 5, type: 'Men-at-Arms' }];
  } else if (scenario === 'EXPANSIONISTA') {
    state.army.units = [{ id: 'u1', name: 'Vanguard', size: 40, maxSize: 40, tier: 1, ac: 3, weapon: 'Spears', mount: 'None', morale: 5, type: 'Levy' }];
  } else if (scenario === 'GUERRA') {
    state.army.units = [
      { id: 'u1', name: 'Line Infantry', size: 80, maxSize: 80, tier: 1, ac: 4, weapon: 'Polearms', mount: 'None', morale: 5, type: 'Infantry' },
      { id: 'u2', name: 'Bowmen', size: 40, maxSize: 40, tier: 1, ac: 3, weapon: 'Bows', mount: 'None', morale: 5, type: 'Archers' }
    ];
  } else if (scenario === 'CRISE') {
    state.weeklyLedger.silverdew = 20;
    state.weeklyLedger.food = 0.5;
    state.army.units = [{ id: 'u1', name: 'Hungry Garrison', size: 60, maxSize: 60, tier: 1, ac: 3, weapon: 'Spears', mount: 'None', morale: 4, type: 'Levy' }];
  } else if (scenario === 'RECUPERACAO') {
    state.weeklyLedger.silverdew = 30;
    state.weeklyLedger.food = 1.0;
    state.army.units = [{ id: 'u1', name: 'Skeleton Crew', size: 10, maxSize: 10, tier: 1, ac: 3, weapon: 'Spears', mount: 'None', morale: 3, type: 'Levy' }];
  }

  const checkpoints = [1, 10, 50, 100, 156, 260, 312, 520];
  const results: Array<{ week: number; simSD: number; simFSU: number }> = [];

  for (let w = 1; w <= maxWeeks; w++) {
    // 1. Dinâmica do Cenário
    if (scenario === 'EXPANSIONISTA' && w % 24 === 0) {
      if (state.weeklyLedger.silverdew >= 100 && state.weeklyLedger.materials.timber >= 20) {
        state.weeklyLedger.silverdew -= 100;
        state.weeklyLedger.materials.timber -= 20;
        state.holdings.resourcePatches.push({
          id: `p_exp_${w}`,
          name: 'Nova Mata',
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
      const u = state.army.units[0];
      if (u && u.size > 20) u.size = Math.max(15, u.size - 10);
    }

    // 2. Virada da Engine Canônica
    const turnRes = resolveWeeklyTurn(state);
    state = turnRes.updatedState;

    // 3. Aplicação do Modelo M18.1/M18.2 (Upkeep, Spoilage, Wealth Friction)
    // A) Upkeep de Holding
    const upkeep = PROPOSED_HOLDING_UPKEEP[state.holdings.type] || 50;
    state.weeklyLedger.silverdew = Math.max(0, state.weeklyLedger.silverdew - upkeep);

    // B) Granary Spoilage Semanal sobre excedente da capacidade
    const granaryCap = PROPOSED_GRANARY_CAPACITY[state.holdings.type] || 50.0;
    if (state.weeklyLedger.food > granaryCap) {
      const excess = state.weeklyLedger.food - granaryCap;
      const spoiled = excess * 0.25; // 25% do excedente semanal decai por falta de espaço coberto
      state.weeklyLedger.food = Math.max(granaryCap, state.weeklyLedger.food - spoiled);
    }

    // C) Wealth Friction Anual (Semana 52, 104, 156, etc.)
    if (w % 52 === 0 && state.weeklyLedger.silverdew > 2000) {
      const excessSD = state.weeklyLedger.silverdew - 2000;
      const royalTithe = excessSD * 0.08; // Dízimo feudal anual de 8% sobre o excedente acima de 2.000 SD
      state.weeklyLedger.silverdew = Math.max(2000, state.weeklyLedger.silverdew - royalTithe);
    }

    if (checkpoints.includes(w)) {
      results.push({
        week: w,
        simSD: Math.round(state.weeklyLedger.silverdew),
        simFSU: Math.round(state.weeklyLedger.food * 10) / 10
      });
    }
  }

  return results;
}

// ============================================================================
// 2. VALIDAÇÃO MATEMÁTICA DO GENERIC PLAUSIBLE (ESCALAS REAIS DO REPOSITÓRIO)
// ============================================================================

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function simulateGenericPlausibleDomains(runs = 1000) {
  const domains = ['ESPIONAGE', 'DIPLOMACY', 'MILITARY', 'INTRIGUE'];
  const domainReports: Record<string, {
    runs: number;
    success: number;
    partial: number;
    failure: number;
    criticalFailure: number;
    avgCostSD: number;
    avgBenefit: string;
    riskReport: string;
  }> = {};

  for (const dom of domains) {
    let succ = 0, part = 0, fail = 0, crit = 0;
    let totalCost = 0;

    for (let i = 0; i < runs; i++) {
      // Escalas REAIS do repositório:
      // commanderTier: 1 a 5 (média 3)
      // bannerTier: 1 a 5 (média 2)
      // reputation: -5 a +5 (média 1)
      // opinion: -3 a +3 (média 0)
      // morale: 1 a 10 (média 5)
      // hasAdvisor: boolean (80% true)

      const commanderTier = globalRNG.nextInt(1, 5);
      const reputation = globalRNG.nextInt(-3, 3);
      const opinion = globalRNG.nextInt(-3, 3);
      const morale = globalRNG.nextInt(3, 8);
      const hasAdvisor = globalRNG.next() < 0.8;
      const isWinter = globalRNG.next() < 0.25;

      let successChance = 0.50;
      let costSD = 0;

      if (dom === 'ESPIONAGE') {
        costSD = 5;
        // Base 0.40 + commanderTier*0.06 + advisor*0.10 - winter*0.15
        const raw = 0.40 + (commanderTier * 0.06) + (hasAdvisor ? 0.10 : 0.0) - (isWinter ? 0.15 : 0.0);
        successChance = clamp(raw, 0.10, 0.85);
      } else if (dom === 'DIPLOMACY') {
        costSD = 10;
        // Base 0.35 + opinion*0.08 + reputation*0.05 + advisor*0.10
        const raw = 0.35 + (opinion * 0.08) + (reputation * 0.05) + (hasAdvisor ? 0.10 : 0.0);
        successChance = clamp(raw, 0.10, 0.85);
      } else if (dom === 'MILITARY') {
        costSD = 0; // Consome 10 laborPool
        // Base 0.45 + commanderTier*0.08 + (morale - 5)*0.05
        const raw = 0.45 + (commanderTier * 0.08) + ((morale - 5) * 0.05);
        successChance = clamp(raw, 0.15, 0.90);
      } else if (dom === 'INTRIGUE') {
        costSD = 25;
        // Base 0.30 + commanderTier*0.06 + advisor*0.12 + (reputation > 0 ? 0.05 : -0.05)
        const raw = 0.30 + (commanderTier * 0.06) + (hasAdvisor ? 0.12 : 0.0) + (reputation > 0 ? 0.05 : -0.05);
        successChance = clamp(raw, 0.10, 0.80);
      }

      totalCost += costSD;

      const roll = globalRNG.next();
      if (roll < successChance * 0.70) {
        succ++;
      } else if (roll < successChance) {
        part++;
      } else if (roll < 0.92) {
        fail++;
      } else {
        crit++;
      }
    }

    domainReports[dom] = {
      runs,
      success: succ,
      partial: part,
      failure: fail,
      criticalFailure: crit,
      avgCostSD: totalCost / runs,
      avgBenefit: dom === 'ESPIONAGE' ? 'Revela planos e forças inimigas' : dom === 'DIPLOMACY' ? 'Melhora relação ou firma pacto' : dom === 'MILITARY' ? '+1 AC / +1 Moral temporário' : 'Atrasa Casa rival ou obtém segredo',
      riskReport: dom === 'ESPIONAGE' ? '8% risco de detecção (-1 opinião)' : dom === 'DIPLOMACY' ? '8% risco de gafe (-1 relação)' : dom === 'MILITARY' ? '8% cansaço de tropa (-1 moral)' : '8% denúncia de conspiração (-2 relação)'
    };
  }

  return domainReports;
}

// ============================================================================
// 3. EXECUÇÃO DA AUDITORIA M18.2 E RELATÓRIO
// ============================================================================

export function runFullValidation() {
  console.log('======================================================================');
  console.log('📐 M18.2: VALIDAÇÃO MATEMÁTICA EXTERNA DA MODELAGEM ECONÔMICA');
  console.log('======================================================================\n');

  const scenarios = ['PACIFICO', 'CONSERVADOR', 'EXPANSIONISTA', 'GUERRA', 'CRISE', 'RECUPERACAO'];

  for (const sc of scenarios) {
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`📊 CENÁRIO: [${sc}] — COMPARATIVO TARGET vs SIMULADO (520 SEMANAS)`);
    console.log(`----------------------------------------------------------------------`);

    const simulated = simulateExternalModel(sc, 520);
    const targets = SCENARIO_TARGETS[sc];

    const comparisonTable = targets.map((t, idx) => {
      const s = simulated[idx] || { simSD: 0, simFSU: 0 };
      const errSD = Math.abs(s.simSD - t.targetSD);
      const errPctSD = Math.round((errSD / t.targetSD) * 100);
      const errFSU = Math.abs(s.simFSU - t.targetFSU);
      const errPctFSU = Math.round((errFSU / (t.targetFSU || 1)) * 100);

      return {
        Semana: t.week,
        Marco: t.year,
        Target_SD: `${t.targetSD} SD`,
        Simulado_SD: `${s.simSD} SD`,
        Erro_SD: `${errPctSD}%`,
        Target_FSU: `${t.targetFSU} FSU`,
        Simulado_FSU: `${s.simFSU} FSU`,
        Erro_FSU: `${errPctFSU}%`
      };
    });

    console.table(comparisonTable);
  }

  console.log('\n======================================================================');
  console.log('⚖️ VALIDAÇÃO DOS 4 DOMÍNIOS DO GENERIC PLAUSIBLE (1.000 RODADAS CADA)');
  console.log('======================================================================\n');

  const gpResults = simulateGenericPlausibleDomains(1000);
  console.table(Object.entries(gpResults).map(([dom, r]) => ({
    Domínio: dom,
    Amostras: r.runs,
    Sucesso: `${Math.round((r.success / r.runs) * 100)}%`,
    Parcial: `${Math.round((r.partial / r.runs) * 100)}%`,
    Falha: `${Math.round((r.failure / r.runs) * 100)}%`,
    Crítico: `${Math.round((r.criticalFailure / r.runs) * 100)}%`,
    Custo_Médio: `${r.avgCostSD} SD`,
    Benefício: r.avgBenefit,
    Risco: r.riskReport
  })));
}

runFullValidation();

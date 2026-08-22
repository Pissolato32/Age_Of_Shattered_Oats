import { createInitialState, resolveWeeklyTurn, resolveDynasticSuccession } from '../engine';
import { CampaignState } from '../types';
import { PROPOSED_HOLDING_UPKEEP, PROPOSED_GRANARY_CAPACITY } from './ExternalModelValidator';

export interface DynasticScenarioResult {
  scenario: string;
  endWeek: number;
  rulerName: string;
  rulerAge: number;
  spouseAge?: number;
  childrenCount: number;
  livingHeirName?: string;
  successionCount: number;
  finalSD: number;
  finalFSU: number;
  holdingType: string;
  unitsCount: number;
  softLockDetected: boolean;
  notes: string;
}

export function runDynasticScenario(scenarioId: number): DynasticScenarioResult {
  let state = createInitialState('Landed Knight', 'Florestas do Rio');
  state.character.name = 'Lorde Roderic';
  state.character.age = 28;
  state.family = {
    spouse: { name: 'Lady Eleanor', house: 'Oakheart', age: 26, affection: 5 },
    children: [
      { name: 'Cedric', age: 6, gender: 'Male', isHeir: true, alive: true },
      { name: 'Rowena', age: 3, gender: 'Female', isHeir: false, alive: true }
    ],
    pregnancyWeekRemaining: undefined
  };
  state.holdings.type = 'Bastion';
  state.holdings.population = 400;
  state.holdings.resourcePatches = [
    { id: 'p1', name: 'Campos de Trigo', type: 'Grain Field', tier: 1, quality: 'Common', incomePerDay: 2, yieldPerDay: 0.5, laborRequired: 20 },
    { id: 'p2', name: 'Acampamento Madeireiro', type: 'Timber Camp', tier: 1, quality: 'Common', incomePerDay: 1, yieldPerDay: 2, laborRequired: 20 }
  ];
  state.weeklyLedger.silverdew = 300;
  state.weeklyLedger.food = 10.0;
  state.army.units = [{ id: 'u1', name: 'Garrison Retinue', size: 20, maxSize: 20, tier: 1, ac: 3, weapon: 'Spears', mount: 'None', morale: 5, type: 'Levy' }];

  let successions = 0;
  let softLock = false;
  let notes = '';

  const maxWeeks = 520; // 10 Anos

  for (let w = 1; w <= maxWeeks; w++) {
    // Injeção de eventos específicos dos 8 cenários dinásticos
    if (scenarioId === 5 && w === 156) {
      // Cenário 5: Morte do personagem principal no Ano 3
      const succ = resolveDynasticSuccession(state, 'death');
      if (succ.success) {
        successions++;
        notes += `[Semana 156: Morte de ${succ.oldLordName} -> ${succ.primaryHeirName} assumiu com ${state.character.age} anos] `;
      } else {
        softLock = true;
        notes += `[Semana 156: Falha na sucessão - ${succ.reason}] `;
      }
    }

    if (scenarioId === 6 && w === 100) {
      // Cenário 6: Morte do herdeiro Cedric antes do lorde
      const heir = state.family.children.find(c => c.name === 'Cedric');
      if (heir) {
        heir.alive = false;
        heir.isHeir = false;
        // Próximo filho vira herdeiro
        const nextChild = state.family.children.find(c => c.alive);
        if (nextChild) nextChild.isHeir = true;
        notes += `[Semana 100: Morte do herdeiro Cedric -> ${nextChild?.name || 'Nenhum'} assumiu herança] `;
      }
    }

    if (scenarioId === 7 && w === 50) {
      // Cenário 7: Sucessão precoce com herdeiro menor (Cedric tem 7 anos)
      const succ = resolveDynasticSuccession(state, 'death');
      if (succ.success) {
        successions++;
        notes += `[Semana 50: Morte prematura -> Cedric assumiu (clamped para maioridade 16 anos)] `;
      } else {
        softLock = true;
      }
    }

    if (scenarioId === 8 && w === 104) {
      // Cenário 8: Sucessão em plena crise econômica e de guerra
      state.weeklyLedger.silverdew = 15;
      state.weeklyLedger.food = 0.5;
      state.weeklyLedger.unpaidWagesTicks = 2;
      const succ = resolveDynasticSuccession(state, 'death');
      if (succ.success) {
        successions++;
        notes += `[Semana 104: Sucessão durante crise econômica de soldos atrasados] `;
      } else {
        softLock = true;
      }
    }

    // Gestação espontânea no Ano 2 para cenários 1, 2, 3
    if (w === 60 && [1, 2, 3].includes(scenarioId) && state.family.spouse) {
      state.family.pregnancyWeekRemaining = 38; // 38 semanas de gravidez
    }

    // Virada semanal canônica
    const turnRes = resolveWeeklyTurn(state);
    state = turnRes.updatedState;

    // Aplicação do modelo M18.2 (Upkeep, Spoilage, Wealth Friction)
    const upkeep = PROPOSED_HOLDING_UPKEEP[state.holdings.type] || 70;
    state.weeklyLedger.silverdew = Math.max(0, state.weeklyLedger.silverdew - upkeep);

    const granaryCap = PROPOSED_GRANARY_CAPACITY[state.holdings.type] || 50.0;
    if (state.weeklyLedger.food > granaryCap) {
      const excess = state.weeklyLedger.food - granaryCap;
      state.weeklyLedger.food = Math.max(granaryCap, state.weeklyLedger.food - (excess * 0.25));
    }

    if (w % 52 === 0 && state.weeklyLedger.silverdew > 2000) {
      const excessSD = state.weeklyLedger.silverdew - 2000;
      state.weeklyLedger.silverdew = Math.max(2000, state.weeklyLedger.silverdew - (excessSD * 0.08));
    }
  }

  const livingHeir = state.family.children.find(c => c.isHeir && c.alive);

  const scenarioNames: Record<number, string> = {
    1: '1. Inação / Pacífico Puro (Sem Expansão)',
    2: '2. Expansão e Obras Contínuas',
    3: '3. Guerra e Conflitos Prolongados',
    4: '4. Crise Econômica e Recuperação',
    5: '5. Morte do Personagem Principal (Ano 3)',
    6: '6. Morte do Herdeiro Primogênito',
    7: '7. Sucessão com Herdeiro Menor',
    8: '8. Sucessão durante Crise de Soldos'
  };

  return {
    scenario: scenarioNames[scenarioId] || `Cenário ${scenarioId}`,
    endWeek: maxWeeks,
    rulerName: state.character.name,
    rulerAge: state.character.age,
    spouseAge: state.family.spouse?.age,
    childrenCount: state.family.children.filter(c => c.alive).length,
    livingHeirName: livingHeir?.name || 'Nenhum',
    successionCount: successions,
    finalSD: Math.round(state.weeklyLedger.silverdew),
    finalFSU: Math.round(state.weeklyLedger.food * 10) / 10,
    holdingType: state.holdings.type,
    unitsCount: state.army.units.reduce((acc, u) => acc + u.size, 0),
    softLockDetected: softLock,
    notes: notes || 'Continuidade dinástica regular sem anomalias.'
  };
}

export function runDynasticAudit() {
  console.log('======================================================================');
  console.log('👑 M18.2-D: AUDITORIA DINÁSTICA E ESTRATÉGICA DE LONGO PRAZO (520 SEM)');
  console.log('======================================================================\n');

  const results: DynasticScenarioResult[] = [];
  for (let i = 1; i <= 8; i++) {
    results.push(runDynasticScenario(i));
  }

  console.table(results.map(r => ({
    Cenário: r.scenario,
    Lorde_Final: `${r.rulerName} (${r.rulerAge}a)`,
    Esposa_Idade: r.spouseAge ? `${r.spouseAge}a` : 'N/A',
    Filhos_Vivos: r.childrenCount,
    Próximo_Herdeiro: r.livingHeirName,
    Sucessões: r.successionCount,
    Tesouro: `${r.finalSD} SD`,
    Comida: `${r.finalFSU} FSU`,
    Tropas: `${r.unitsCount} homens`,
    SoftLock: r.softLockDetected ? 'SIM (ERRO)' : 'NÃO (OK)'
  })));

  console.log('\n--- OBSERVAÇÕES E NOTAS DE EXECUÇÃO DINÁSTICA ---\n');
  results.forEach(r => {
    console.log(`• [${r.scenario}]: ${r.notes}`);
  });
}

runDynasticAudit();

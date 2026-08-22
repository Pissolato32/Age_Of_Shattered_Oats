import { createInitialState, resolveWeeklyTurn } from '../engine';
import { CampaignState } from '../types';
import { resolveGenericPlausibleAction } from '../lib/genericResolution';
import { globalRNG } from '../core/RandomService';
import { resolveNarrativeCommand } from '../lib/narrativeExecution';
import { NarrativeCommand } from '../lib/narrativeContracts';

export function runMilitaryAndConstructionAudit() {
  console.log('======================================================================');
  console.log('🛡️ ETAPA 4: SIMULAÇÃO MILITAR E CONSTRUÇÃO (ANÁLISE DE CUSTO-BENEFÍCIO)');
  console.log('======================================================================\n');

  // 1. Recrutamento: 10 vs 50 vs 100 soldados
  console.log('• Custos Canônicos de Recrutamento (RECRUIT):');
  console.log('  - Custo por soldado: 3 SD + 1 ponto de laborPool');
  console.log('  - 10 soldados:  30 SD, -10 laborPool, +1 SD/sem soldos, +0.1 FSU/sem rações');
  console.log('  - 50 soldados: 150 SD, -50 laborPool, +5 SD/sem soldos, +0.5 FSU/sem rações');
  console.log('  - 100 soldados: 300 SD, -100 laborPool, +10 SD/sem soldos, +1.0 FSU/sem rações\n');

  // 2. Construção: Paliçadas e Upgrades
  console.log('• Custos Canônicos de Construção (BUILD):');
  console.log('  - Paliçada / Defesas: 50 SD, 20 Madeira, 10 Pedra');
  console.log('  - Tempo de amortização da obra com renda de Bastion (75 SD/sem): ~0.66 semanas (menos de 5 dias!)\n');
}

export function runGenericPlausibleComparison() {
  console.log('======================================================================');
  console.log('⚖️ ETAPA 5: MEDIÇÃO DO GENERIC PLAUSIBLE VS AÇÕES ESPECIALIZADAS');
  console.log('======================================================================\n');

  const contextualActions = [
    { name: 'Vigilância e Espionagem', phrase: 'enviar batedores aos passos da floresta para vigiar salteadores' },
    { name: 'Manobra e Postura Militar', phrase: 'posicionar arqueiros nas fundações da muralha em prontidão' },
    { name: 'Diplomacia com Vizinhos', phrase: 'propor pacto de não agressão com a Casa Vance' },
    { name: 'Intriga e Investigação', phrase: 'infiltrar espiões na estalagem do feudo para ouvir rumores' },
    { name: 'Infraestrutura de Campo', phrase: 'reparar a estrada de madeira e drenar a lama dos portões' }
  ];

  const results: Record<string, { totalRuns: number; success: number; partial: number; failed: number; totalCostSD: number; totalLaborCost: number }> = {};

  for (const act of contextualActions) {
    results[act.name] = { totalRuns: 0, success: 0, partial: 0, failed: 0, totalCostSD: 0, totalLaborCost: 0 };
    for (let i = 0; i < 200; i++) {
      const state = createInitialState('Landed Knight', 'Florestas do Rio');
      state.character.stats.commanderTier = 3;
      state.weeklyLedger.silverdew = 500;
      state.holdings.laborPool = 200;

      const res = resolveGenericPlausibleAction(
        { action: act.phrase, targetId: 'target_test', parameters: {} },
        state,
        globalRNG
      );

      results[act.name].totalRuns++;
      if (res.outcome === 'SUCCESS') results[act.name].success++;
      else if (res.outcome === 'PARTIAL_SUCCESS') results[act.name].partial++;
      else results[act.name].failed++;

      for (const sc of res.stateChanges) {
        if (sc.path === 'weeklyLedger.silverdew' && typeof sc.delta === 'number') {
          results[act.name].totalCostSD += Math.abs(sc.delta);
        }
        if (sc.path === 'holdings.laborPool' && typeof sc.delta === 'number') {
          results[act.name].totalLaborCost += Math.abs(sc.delta);
        }
      }
    }
  }

  console.table(Object.entries(results).map(([action, d]) => ({
    Ação_Genérica: action,
    Amostras: d.totalRuns,
    Taxa_Sucesso: `${Math.round((d.success / d.totalRuns) * 100)}%`,
    Taxa_Parcial: `${Math.round((d.partial / d.totalRuns) * 100)}%`,
    Taxa_Falha: `${Math.round((d.failed / d.totalRuns) * 100)}%`,
    Custo_Médio_SD: `${(d.totalCostSD / d.totalRuns).toFixed(1)} SD`,
    Custo_Médio_MãoDeObra: `${(d.totalLaborCost / d.totalRuns).toFixed(1)} hab`
  })));
}

runMilitaryAndConstructionAudit();
runGenericPlausibleComparison();

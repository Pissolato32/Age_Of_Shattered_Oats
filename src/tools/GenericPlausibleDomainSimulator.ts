import { createInitialState } from '../engine';
import { RandomService } from '../core/RandomService';
import { resolveGenericPlausibleAction, GenericResolutionRequest } from '../lib/genericResolution';
import { CampaignState } from '../types';

interface DomainStats {
  runs: number;
  success: number;
  partial: number;
  failure: number;
  critical: number;
  totalCostSd: number;
  totalLabor: number;
  avgProbability: number;
}

export function runDomainSimulation(
  domainName: string,
  request: GenericResolutionRequest,
  runs = 5000
): DomainStats {
  const stats: DomainStats = {
    runs,
    success: 0,
    partial: 0,
    failure: 0,
    critical: 0,
    totalCostSd: 0,
    totalLabor: 0,
    avgProbability: 0
  };

  let probSum = 0;

  for (let i = 1; i <= runs; i++) {
    const rng = new RandomService(i * 31 + 107);
    const state: CampaignState = createInitialState('Landed Knight', 'Florestas do Rio');
    state.weeklyLedger.silverdew = 1000;
    state.holdings.laborPool = 200;
    state.character.stats.commanderTier = 3;
    state.character.reputation = 15;
    state.advisors = { counselorName: 'Tobin', stewardName: 'Gerold', spyMasterName: 'Roric' };
    state.worldLedger.nobleHouses = [
      { name: 'Ironhand', seat: 'Ironpeak', region: 'North', currentLord: 'Baron Valerius', tier: 3, status: 'Active', allies: [], enemies: [], opinion: 0, rumor: '', isRealRumor: false }
    ];

    const res = resolveGenericPlausibleAction(request, state, rng);

    if (res.outcome === 'SUCCESS') stats.success++;
    else if (res.outcome === 'PARTIAL_SUCCESS') stats.partial++;
    else if (res.outcome === 'FAILURE') stats.failure++;
    else if (res.outcome === 'CRITICAL_FAILURE') stats.critical++;

    probSum += res.probability ?? 0;

    for (const ch of res.stateChanges) {
      if (ch.path === 'weeklyLedger.silverdew' && ch.delta) stats.totalCostSd += Math.abs(ch.delta);
      if (ch.path === 'holdings.laborPool' && ch.delta) stats.totalLabor += Math.abs(ch.delta);
    }
  }

  stats.avgProbability = Math.round((probSum / runs) * 100) / 100;
  return stats;
}

export function runFullGenericDomainAudit() {
  console.log("======================================================================");
  console.log("📊 SIMULAÇÃO ESTATÍSTICA PROFUNDA: 5.000 EXECUÇÕES POR DOMÍNIO (M18.3-D.1)");
  console.log("======================================================================\n");

  const testCases = [
    {
      name: 'ESPIONAGE',
      req: { action: 'Investigar e espiar as defesas do feudo', targetId: 'Ironhand' },
      expectedCost: '5 SD',
      targetM18: '46% / 17% / 29% / 8%'
    },
    {
      name: 'DIPLOMACY_BASE',
      req: { action: 'Enviar emissário diplomático para propor pacto', targetId: 'Ironhand' },
      expectedCost: '10 SD',
      targetM18: '29% / 15% / 49% / 7%'
    },
    {
      name: 'DIPLOMACY_OFFER',
      req: { action: 'Negociar e persuadir com oferta monetária', targetId: 'Ironhand', parameters: { amount: 50 } },
      expectedCost: '50 SD',
      targetM18: 'Varia por oferta'
    },
    {
      name: 'MILITARY',
      req: { action: 'Mobilizar patrulha militar nas estradas' },
      expectedCost: '15 Labor',
      targetM18: '49% / 21% / 21% / 8%'
    },
    {
      name: 'INTRIGUE',
      req: { action: 'Semear intriga e desinformação na corte', targetId: 'Ironhand' },
      expectedCost: '25 SD',
      targetM18: '40% / 16% / 36% / 8%'
    }
  ];

  console.log("┌──────────────────────┬─────────────┬─────────────┬─────────────┬─────────────┬────────────┬──────────────┐");
  console.log("│ Domínio / Caso       │ Sucesso     │ Parcial     │ Falha       │ Crítico     │ Custo Méd. │ P(clamp)     │");
  console.log("├──────────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼────────────┼──────────────┤");

  for (const tc of testCases) {
    const stats = runDomainSimulation(tc.name, tc.req, 5000);
    const sPct = ((stats.success / 5000) * 100).toFixed(2) + '%';
    const pPct = ((stats.partial / 5000) * 100).toFixed(2) + '%';
    const fPct = ((stats.failure / 5000) * 100).toFixed(2) + '%';
    const cPct = ((stats.critical / 5000) * 100).toFixed(2) + '%';
    const cost = tc.name === 'MILITARY' ? `${(stats.totalLabor / 5000).toFixed(0)} Labor` : `${(stats.totalCostSd / 5000).toFixed(0)} SD`;

    console.log(
      `│ ${tc.name.padEnd(20)} │ ` +
      `${sPct.padEnd(11)} │ ` +
      `${pPct.padEnd(11)} │ ` +
      `${fPct.padEnd(11)} │ ` +
      `${cPct.padEnd(11)} │ ` +
      `${cost.padEnd(10)} │ ` +
      `${stats.avgProbability.toFixed(2).padEnd(12)} │`
    );
  }
  console.log("└──────────────────────┴─────────────┴─────────────┴─────────────┴─────────────┴────────────┴──────────────┘\n");
}

runFullGenericDomainAudit();

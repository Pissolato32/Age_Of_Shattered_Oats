import assert from 'node:assert/strict';
import { createInitialState } from '../src/engine';
import { RandomService } from '../src/core/RandomService';
import { CampaignState } from '../src/types';
import { resolveGenericPlausibleAction, GenericResolutionRequest } from '../src/lib/genericResolution';

function createScenarioState(options: {
  tier?: 'Bastion' | 'Fortified Town' | 'Castle' | 'Walled City';
  season?: 'Sunreach' | 'Deepfrost';
  labor?: number;
  treasury?: number;
  commanderTier?: number;
  targetOpinion?: number;
}): CampaignState {
  const s = createInitialState('Noble Ruler', 'Central Plains');
  s.holdings.type = options.tier || 'Castle';
  s.weeklyLedger.season = options.season || 'Sunreach';
  s.weeklyLedger.silverdew = options.treasury ?? 5000;
  s.holdings.laborPool = options.labor ?? 2000;
  s.character.stats.commanderTier = options.commanderTier ?? 3;
  s.character.reputation = 20;

  if (typeof options.targetOpinion === 'number') {
    s.worldLedger.nobleHouses = [
      {
        name: 'Target_House',
        region: 'Central Plains',
        currentLord: 'Lord Target',
        seat: 'Target_Seat',
        tier: 3,
        status: 'Active',
        allies: [],
        enemies: [],
        opinion: options.targetOpinion,
        rumor: '',
        isRealRumor: false
      }
    ];
  }

  return s;
}

interface ScenarioResult {
  readonly name: string;
  readonly runs: number;
  readonly successRate: number;
  readonly partialRate: number;
  readonly failureRate: number;
  readonly magMin: number;
  readonly magMed: number;
  readonly magMax: number;
}

function runScenario(name: string, state: CampaignState, req: GenericResolutionRequest, runs: number, baseSeed: number): ScenarioResult {
  let successCount = 0;
  let partialCount = 0;
  let failureCount = 0;
  const magnitudes: number[] = [];

  for (let i = 0; i < runs; i++) {
    const rng = new RandomService(baseSeed + i);
    const res = resolveGenericPlausibleAction(req, state, rng);

    if (res.outcome === 'SUCCESS') successCount++;
    else if (res.outcome === 'PARTIAL_SUCCESS') partialCount++;
    else if (res.outcome === 'FAILURE') failureCount++;

    if (typeof res.magnitude === 'number') {
      magnitudes.push(res.magnitude);
    }
  }

  magnitudes.sort((a, b) => a - b);
  const magMin = magnitudes.length > 0 ? magnitudes[0] : 0;
  const magMax = magnitudes.length > 0 ? magnitudes[magnitudes.length - 1] : 0;
  const magMed = magnitudes.length > 0 ? magnitudes[Math.floor(magnitudes.length / 2)] : 0;

  return {
    name,
    runs,
    successRate: Number(((successCount / runs) * 100).toFixed(1)),
    partialRate: Number(((partialCount / runs) * 100).toFixed(1)),
    failureRate: Number(((failureCount / runs) * 100).toFixed(1)),
    magMin,
    magMed,
    magMax
  };
}

console.log('=== SIMULAÇÃO ESTATÍSTICA RIGOROSA DE 10 CENÁRIOS (10.000+ RUNS) ===');

const reqInfra: GenericResolutionRequest = { action: 'Trabalho de campo e desobstrução de estrada' };
const reqNegoc: GenericResolutionRequest = { action: 'Negociar com nobres', targetId: 'Target_House' };

const scenarios: ScenarioResult[] = [
  // 1. Capacidade Baixa
  runScenario('1. Capacidade Baixa (Labor 20, Bastion)', createScenarioState({ tier: 'Bastion', labor: 20 }), reqInfra, 1000, 10001),
  // 2. Capacidade Média
  runScenario('2. Capacidade Média (Labor 100, Town)', createScenarioState({ tier: 'Fortified Town', labor: 100 }), reqInfra, 1000, 10002),
  // 3. Capacidade Alta
  runScenario('3. Capacidade Alta (Labor 400, City)', createScenarioState({ tier: 'Walled City', labor: 400 }), reqInfra, 1000, 10003),
  // 4. Verão (Sunreach)
  runScenario('4. Verão (Sunreach)', createScenarioState({ season: 'Sunreach' }), reqInfra, 1000, 10004),
  // 5. Inverno (Deepfrost)
  runScenario('5. Inverno (Deepfrost)', createScenarioState({ season: 'Deepfrost' }), reqInfra, 1000, 10005),
  // 6. Relação Hostil (-3)
  runScenario('6. Relação Hostil (-3)', createScenarioState({ targetOpinion: -3 }), reqNegoc, 1000, 10006),
  // 7. Relação Neutra (0)
  runScenario('7. Relação Neutra (0)', createScenarioState({ targetOpinion: 0 }), reqNegoc, 1000, 10007),
  // 8. Relação Aliada (+3)
  runScenario('8. Relação Aliada (+3)', createScenarioState({ targetOpinion: 3 }), reqNegoc, 1000, 10008),
  // 9. Liderança Baixa (1)
  runScenario('9. Liderança Baixa (Tier 1)', createScenarioState({ commanderTier: 1 }), reqInfra, 1000, 10009),
  // 10. Liderança Alta (5)
  runScenario('10. Liderança Alta (Tier 5)', createScenarioState({ commanderTier: 5 }), reqInfra, 1000, 10010),
];

for (const sc of scenarios) {
  console.log(`[SCENARIO] ${sc.name.padEnd(35)} | Runs: ${sc.runs} | Sucesso: ${sc.successRate.toFixed(1)}% | Parcial: ${sc.partialRate.toFixed(1)}% | Falha: ${sc.failureRate.toFixed(1)}% | Mag: min=${sc.magMin}, med=${sc.magMed}, max=${sc.magMax}`);
}

// ---------------------------------------------------------------------------
// Validações de Causalidade dos Cenários
// ---------------------------------------------------------------------------
// Verão > Inverno
assert.ok(scenarios[3].successRate > scenarios[4].successRate, 'Verão deve ter sucesso superior a Deepfrost');
// Aliada (+3) > Neutra (0) > Hostil (-3)
assert.ok(scenarios[7].successRate > scenarios[6].successRate, 'Aliado (+3) deve ter sucesso superior a Neutro (0)');
assert.ok(scenarios[6].successRate > scenarios[5].successRate, 'Neutro (0) deve ter sucesso superior a Hostil (-3)');
// Liderança Alta > Liderança Baixa
assert.ok(scenarios[9].successRate > scenarios[8].successRate, 'Liderança Tier 5 deve ter sucesso superior a Tier 1');
// Capacidade Alta Magnitude > Capacidade Baixa Magnitude
assert.ok(scenarios[2].magMax > scenarios[0].magMax, 'Capacidade Alta deve ter magnitude máxima maior que Baixa');

console.log('GenericResolutionSimulation 10-scenario audit suite passed successfully.');

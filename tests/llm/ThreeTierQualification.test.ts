import { ThreeTierQualification } from '../../src/llm/qualification/ThreeTierQualification';
import { DiscoveredCandidate } from '../../src/llm/registry/ProviderDiscovery';
import { MockAdapter } from '../../src/llm/adapters/MockAdapter';
import { ModelRegistry } from '../../src/llm/registry/ModelRegistry';
import { ALL_BENCHMARK_SCENARIOS } from './scenarios';
import { CampaignState } from '../../src/types';
import { hashMechanicalState } from '../../src/lib/ruleResolver';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

function createMockState(): CampaignState {
  return {
    campaignId: 'test_camp_qual',
    schemaVersion: '1.0.0',
    character: {
      id: 'char_01',
      name: 'Roric',
      archetype: 'Renascent Lord',
      attributes: { martial: 10, intrigue: 10, stewardship: 10, diplomacy: 10 },
      isAlive: true,
      traits: []
    } as any,
    holdings: {
      id: 'holding_grey_keep',
      name: 'Grey Keep',
      population: 500,
      laborPool: 400,
      garrison: 40,
      fortification: { tier: 1 }
    } as any,
    weeklyLedger: {
      silverdew: 300,
      food: 120,
      materials: { timber: 20, stone: 10, iron: 10 }
    } as any,
    army: { units: [] } as any,
    worldLedger: {
      currentDate: { year: 342, month: 'Longdark', week: 2 }
    } as any
  };
}

export async function runThreeTierQualificationTests() {
  console.log("=== EXECUTANDO SUÍTE DE TESTES: M28.3 THREE-TIER CAPABILITY QUALIFICATION ===");

  const mockCandidate: DiscoveredCandidate = {
    id: 'mock-model-qual',
    provider: 'mock',
    model: 'deterministic-local-mock',
    discoveredAt: Date.now(),
    billing: { mode: 'FREE', eligible: true },
    health: { status: 'ONLINE' },
    lifecycle: 'ELIGIBLE',
    enabled: true
  };

  const adapter = new MockAdapter({
    id: 'mock-model-qual',
    provider: 'mock',
    model: 'deterministic-local-mock',
    freePolicy: 'explicit-free',
    maxCost: 0,
    enabled: true
  });

  // --------------------------------------------------------------------------
  // 1. Tier 1: Health & Billing Eligibility
  // --------------------------------------------------------------------------
  console.log("1. Testando Tier 1 (Health & Billing)...");

  // Caso 1: ONLINE + FREE -> PASS
  const t1Pass = ThreeTierQualification.evaluateTier1Health(mockCandidate);
  assert(t1Pass.passed === true, "Tier 1 deve aprovar candidato ONLINE + FREE");
  assert(t1Pass.tier === 'TIER_1_HEALTH', "Tier deve ser TIER_1_HEALTH");
  console.log("  ✅ Tier 1 PASS: Candidato ONLINE + FREE aprovado.");

  // Caso 2: OFFLINE -> FAIL
  const candOffline: DiscoveredCandidate = {
    ...mockCandidate,
    health: { status: 'OFFLINE', failureReason: 'HTTP 503 Provider Down' }
  };
  const t1Offline = ThreeTierQualification.evaluateTier1Health(candOffline);
  assert(t1Offline.passed === false, "Tier 1 deve reprovar candidato OFFLINE");
  assert(t1Offline.failureReason?.includes('HTTP 503'), "Deve reportar motivo de falha");
  console.log("  ✅ Tier 1 FAIL: Candidato OFFLINE reprovado com motivo de falha.");

  // Caso 3: PAID -> FAIL
  const candPaid: DiscoveredCandidate = {
    ...mockCandidate,
    billing: { mode: 'PAID', eligible: false }
  };
  const t1Paid = ThreeTierQualification.evaluateTier1Health(candPaid);
  assert(t1Paid.passed === false, "Tier 1 deve reprovar candidato PAID");
  console.log("  ✅ Tier 1 FAIL: Candidato PAID reprovado para o free-tier.");

  // --------------------------------------------------------------------------
  // 2. Tier 2: Smoke Qualification (Bateria Rápida de 7 Cenários)
  // --------------------------------------------------------------------------
  console.log("2. Testando Tier 2 (Smoke Qualification)...");

  const stateBeforeSmoke = createMockState();
  const hashBefore = hashMechanicalState(stateBeforeSmoke);

  const t2Report = await ThreeTierQualification.evaluateTier2Smoke(mockCandidate, adapter, stateBeforeSmoke);
  if (!t2Report.passed) {
    console.log("  Smoke failures:", JSON.stringify(t2Report.failures, null, 2));
  }
  assert(t2Report.tier === 'TIER_2_SMOKE', "Tier deve ser TIER_2_SMOKE");
  assert(t2Report.testedScenariosCount === 7, "Deve testar exatamente 7 cenários smoke (5 int + 2 nar)");
  assert(t2Report.interpreterScore >= 7.0, "Score do Interpreter deve ser >= 7.0");
  assert(t2Report.narratorScore >= 7.0, "Score do Narrator deve ser >= 7.0");
  assert(t2Report.passed === true, "Tier 2 deve aprovar o MockAdapter");

  // Invariante de Isolamento de Estado: O estado da campanha não foi alterado
  const hashAfter = hashMechanicalState(stateBeforeSmoke);
  assert(hashBefore === hashAfter, "Smoke qualification NUNCA deve mutar o estado da campanha");
  console.log(`  ✅ Tier 2 PASS: Smoke concluído (Score: ${t2Report.overallScore}/10). Estado 100% isolado.`);

  // --------------------------------------------------------------------------
  // 3. Tier 3: Full Benchmark & Granular Capability Profile
  // --------------------------------------------------------------------------
  console.log("3. Testando Tier 3 (Full Benchmark & Granular Profile)...");

  // Executar 20 cenários de benchmark representativos
  const sampleScenarios = ALL_BENCHMARK_SCENARIOS.slice(0, 20);
  const t3Report = await ThreeTierQualification.evaluateTier3Benchmark(
    mockCandidate,
    sampleScenarios,
    adapter,
    stateBeforeSmoke
  );

  assert(t3Report.tier === 'TIER_3_FULL_BENCHMARK', "Tier deve ser TIER_3_FULL_BENCHMARK");
  assert(t3Report.profile.interpreter.sampleSize === 20, "Sample size deve ser 20");
  assert(typeof t3Report.profile.interpreter.overallScore === 'number', "Overall score deve ser numérico");
  assert(typeof t3Report.profile.narrator.mechanicalSilence === 'number', "Mechanical silence deve ser numérico");
  assert(Object.keys(t3Report.profile.interpreter.intentBreakdown).length > 0, "Intent breakdown deve ser granular");
  assert(t3Report.profile.recommendedTasks.length > 0, "Deve conter tarefas recomendadas");

  console.log("  ✅ Tier 3 Granular Capability Breakdown:");
  console.log(`     - Interpreter Overall: ${t3Report.profile.interpreter.overallScore}/10`);
  console.log(`     - Intent Breakdown:`, JSON.stringify(t3Report.profile.interpreter.intentBreakdown));
  console.log(`     - Narrator Mechanical Silence: ${(t3Report.profile.narrator.mechanicalSilence * 100).toFixed(0)}%`);
  console.log(`     - Recommended Tasks:`, t3Report.profile.recommendedTasks);

  // --------------------------------------------------------------------------
  // 4. Integração Dinâmica com o ModelRegistry
  // --------------------------------------------------------------------------
  console.log("4. Testando atualização do ModelRegistry com perfil qualificado...");

  const registry = new ModelRegistry();
  process.env.OPENROUTER_API_KEY = 'test-key-qual';
  const registeredCandidate: DiscoveredCandidate = {
    ...mockCandidate,
    id: 'qualified-candidate-01',
    provider: 'openrouter',
    model: 'google/gemma-4-31b-it:free',
    capabilities: {
      interpreterScore: 9.8,
      narratorScore: t3Report.profile.narrator.overallScore,
      mechanicalSilenceScore: t3Report.profile.narrator.mechanicalSilence * 10,
      factualGroundingScore: t3Report.profile.narrator.factualGrounding * 10,
      reliabilityScore: 9.5,
      avgLatencyMs: 20
    }
  };
  registry.registerDiscoveredCandidate(registeredCandidate);

  const selectedForInt = registry.resolveModelForTask('INTERPRET_INTENT');
  assert(selectedForInt.id === 'qualified-candidate-01', "ModelRegistry deve selecionar o candidato qualificado");
  console.log("  ✅ ModelRegistry atualizado com perfil de capacidade e roteamento verificado.");

  console.log("=== TODOS OS TESTES DE QUALIFICAÇÃO M28.3 PASSARAM COM SUCESSO ===");
}

if (process.argv[1]?.endsWith('ThreeTierQualification.test.ts')) {
  runThreeTierQualificationTests();
}

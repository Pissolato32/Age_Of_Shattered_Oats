import 'dotenv/config';
import { LLMCompatibilityHarness } from '../llm/benchmark/LLMCompatibilityHarness';
import { ALL_BENCHMARK_SCENARIOS, getScenariosByCategory } from '../../tests/llm/scenarios';
import { LLMProviderId } from '../llm/contracts/LLMContract';

async function main() {
  const args = process.argv.slice(2);
  const isQualificationOnly = args.includes('--qualification');
  const isMockOnly = args.includes('--mock');

  const providerArgIndex = args.indexOf('--provider');
  const providerFilter = providerArgIndex !== -1 ? args[providerArgIndex + 1] : undefined;

  const scenariosArgIndex = args.indexOf('--scenarios');
  const maxScenarios = scenariosArgIndex !== -1 ? parseInt(args[scenariosArgIndex + 1], 10) : undefined;

  const repetitionsArgIndex = args.indexOf('--repetitions');
  const repetitions = repetitionsArgIndex !== -1 ? parseInt(args[repetitionsArgIndex + 1], 10) : 1;

  const categoryArgIndex = args.indexOf('--category');
  const categoryFilter = categoryArgIndex !== -1 ? args[categoryArgIndex + 1] : undefined;

  console.log(`======================================================================`);
  console.log(`🛡️ AGE OF SHATTERED OATHS — LLM BENCHMARK & STRESS RUNNER`);
  console.log(`======================================================================\n`);

  const harness = new LLMCompatibilityHarness();

  if (isQualificationOnly) {
    console.log(`[Modo: Qualificação Rápida de Provedores]`);
    const qualResults = await harness.runQualification();
    console.log(`\nResultados da Qualificação:`);
    for (const r of qualResults) {
      console.log(`  • [${r.provider.toUpperCase()}] Model: ${r.model} -> Qualificado: ${r.qualified ? 'SIM (100% Free)' : 'NÃO / PENDENTE'} | Sucessos: ${r.successful}/${r.requests} | Latência Média: ${Math.round(r.avgLatencyMs)}ms`);
      if (r.errorDetails && r.errorDetails.length > 0) {
        console.log(`    Erros: ${r.errorDetails.slice(0, 3).join('; ')}`);
      }
    }
    console.log(`\n======================================================================\n`);
    return;
  }

  let scenarios = ALL_BENCHMARK_SCENARIOS;
  if (categoryFilter) {
    scenarios = getScenariosByCategory(categoryFilter);
  }
  if (maxScenarios && maxScenarios > 0) {
    scenarios = scenarios.slice(0, maxScenarios);
  }

  let providers: LLMProviderId[] | undefined = undefined;
  if (isMockOnly) {
    providers = ['mock'];
  } else if (providerFilter && providerFilter !== 'all') {
    providers = [providerFilter as LLMProviderId];
  }

  console.log(`Iniciando Benchmark com ${scenarios.length} cenários e ${repetitions} repetições por modelo...\n`);

  const result = await harness.runBenchmark({
    scenarios,
    repetitions,
    providers,
    useMockOnly: isMockOnly,
    delayBetweenRequestsMs: 350
  });

  console.log(result.asciiReport);
  console.log(`\n📊 Artefatos salvos com sucesso:`);
  console.log(`  • Telemetria JSON: ${result.artifacts.jsonPath}`);
  console.log(`  • Relatório MD   : ${result.artifacts.markdownPath}\n`);
}

main().catch(err => {
  console.error('\n❌ Erro fatal durante a execução do benchmark:', err);
  process.exit(1);
});

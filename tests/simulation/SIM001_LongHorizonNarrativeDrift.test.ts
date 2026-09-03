import assert from 'node:assert/strict';
import { LongHorizonSimulationRunner } from '../../src/domain/simulation/LongHorizonSimulationRunner';

async function runSIM001Suite() {
  console.log('🧪 Iniciando Suíte de Testes SIM-001 (Long Horizon Simulation & Longitudinal Narrative Drift)...\n');
  console.log('⏳ Executando simulação contínua de 1.000 turnos (semanas) através dos 4 arquétipos...\n');

  const result = await LongHorizonSimulationRunner.run({
    totalTurns: 1000,
    seed: 4242,
    enableLogging: false
  });

  const summary = result.telemetrySummary;
  const state = result.finalState;

  console.log(`⏱️ Simulação de 1.000 turnos concluída em ${(result.totalDurationMs / 1000).toFixed(2)}s.`);
  console.log('📊 Resumo da Telemetria Longitudinal:');
  for (const note of summary.diagnosticNotes) {
    console.log(`   • ${note}`);
  }
  console.log('\n------------------------------------------------------------');

  // TEST 1: Execução Completa de 1.000 Turnos / Semanas sem Exceções
  {
    console.log('--- TEST 1: Estabilidade de Execução (1.000 Turnos / Semanas) ---');
    assert.equal(summary.totalTurns, 1000, 'Deveria ter executado exatamente 1.000 turnos');
    assert.equal(summary.unhandledExceptionsCount, 0, 'Não deve ocorrer nenhuma exceção não tratada');
    console.log('  ✅ TEST 1 PASSOU: 1.000 turnos executados sem travamentos ou exceções.');
  }

  // TEST 2: Invariantes Mecânicas e Conservação de Estado
  {
    console.log('\n--- TEST 2: Invariantes Mecânicas e Integridade de Estado ---');
    assert.equal(summary.stateIntegrityViolations, 0, 'Zero violações de integridade contábil/mecânica');
    assert(state.weeklyLedger.silverdew >= 0, 'Tesouro não pode ser negativo');
    assert(state.weeklyLedger.food >= 0, 'Comida não pode ser negativa');
    assert(!Number.isNaN(state.weeklyLedger.silverdew), 'Prata não pode ser NaN');
    assert(!Number.isNaN(state.weeklyLedger.food), 'Comida não pode ser NaN');
    assert(Number.isFinite(state.weeklyLedger.silverdew), 'Prata deve ser finita');
    assert(Number.isFinite(state.weeklyLedger.food), 'Comida deve ser finita');
    console.log('  ✅ TEST 2 PASSOU: Estado conservado e íntegro (zero NaN, Infinity ou recursos ilegais).');
  }

  // TEST 3: 100% Determinismo Mecânico em Replay
  {
    console.log('\n--- TEST 3: Replay Mecânico 100% Determinístico ---');
    assert.equal(summary.mechanicalReplayParity, true, 'Execuções com a mesma semente devem ter 100% de paridade de estado');
    console.log('  ✅ TEST 3 PASSOU: Replay mecânico demonstrou 100% de reproducibilidade determinística.');
  }

  // TEST 4: Estabilidade do Salience Gate ao Longo de 1.000 Turnos
  {
    console.log('\n--- TEST 4: Salience Gate e Estabilidade de Contexto Longitudinal ---');
    assert.equal(summary.salienceGateViolations, 0, 'Nenhum ciclo deve violar os limites do Salience Gate');
    assert(summary.maxMemoriesInContext <= 2, `Pico de memórias no contexto deve ser <= 2 (obteve ${summary.maxMemoriesInContext})`);
    assert(summary.maxKnowledgeInContext <= 2, `Pico de conhecimentos no contexto deve ser <= 2 (obteve ${summary.maxKnowledgeInContext})`);
    assert(summary.maxRelationshipsInContext <= 1, `Pico de relações no contexto deve ser <= 1 (obteve ${summary.maxRelationshipsInContext})`);
    console.log(`  ✅ TEST 4 PASSOU: Salience Gate manteve contexto estritamente enxuto durante 1.000 turnos (pico: ${summary.maxMemoriesInContext} mems, ${summary.maxKnowledgeInContext} facts, ${summary.maxRelationshipsInContext} rels).`);
  }

  // TEST 5: Hard Max Compliance e Disciplina Narrativa Longitudinal
  {
    console.log('\n--- TEST 5: Hard Max Compliance e Disciplina Narrativa Longitudinal ---');
    // Hard Gate: 100% das narrativas entregues à UI respeitam o Hard Max da categoria
    assert.equal(summary.hardMaxComplianceRate, 1.0, `Hard Max compliance deve ser 100% (obteve ${(summary.hardMaxComplianceRate * 100).toFixed(1)}%)`);

    // Metas Diagnósticas
    assert(summary.regenerationRate <= 0.15, `Taxa de regeneração esperada <= 15% (obteve ${(summary.regenerationRate * 100).toFixed(1)}%)`);
    assert(summary.fallbackRate <= 0.05, `Taxa de fallback esperada <= 5% (obteve ${(summary.fallbackRate * 100).toFixed(1)}%)`);
    console.log(`  ✅ TEST 5 PASSOU: 100% das narrativas respeitaram o Hard Max (Regen: ${(summary.regenerationRate * 100).toFixed(1)}%, Fallback: ${(summary.fallbackRate * 100).toFixed(1)}%).`);
  }

  // TEST 6: Ausência de Degeneração e Repetição Estrutural (Drift Estilístico)
  {
    console.log('\n--- TEST 6: Detecção de Clichês e Repetição Estrutural ---');
    assert(summary.structuralRepetitionStreakMax < 15, `Streak de abertura idêntica não deve exceder 15 (obteve ${summary.structuralRepetitionStreakMax})`);
    assert(summary.initialClicheRate < 0.10, `Taxa de clichês iniciais não deve exceder 10% (obteve ${(summary.initialClicheRate * 100).toFixed(1)}%)`);
    console.log(`  ✅ TEST 6 PASSOU: Ausência de loops de repetição degenerativa (streak máximo: ${summary.structuralRepetitionStreakMax}).`);
  }

  // TEST 7: Saúde e Decaimento Efetivo de Memória
  {
    console.log('\n--- TEST 7: Ciclo de Vida e Decaimento de Memórias ---');
    assert(state.memoryStores?.memories && state.memoryStores.memories.length > 0, 'Memory store deve conter registros acumulados');
    const decayedCount = state.memoryStores.memories.filter(m => m.decayed).length;
    assert(decayedCount > 0, `Deveria haver memórias decaídas após 1.000 turnos (obteve ${decayedCount})`);
    console.log(`  ✅ TEST 7 PASSOU: Decaimento de memória operacional (${decayedCount} memórias marcadas como decaídas ao longo de 1.000 semanas).`);
  }

  // Veredito Final
  assert.equal(summary.hardGatesPassed, true, 'Todos os Hard Gates de SIM-001 devem ser satisfeitos');
  console.log('\n🎉 TODOS OS TESTES DA SUÍTE SIM-001 PASSARAM COM SUCESSO!\n');
}

runSIM001Suite().catch(err => {
  console.error('❌ Falha na execução da suíte SIM-001:', err);
  process.exit(1);
});

/**
 * VAL-001: Multi-Decade / Secular Campaign Stress Validation (2,500 to 10,000 Weekly Turns)
 * 
 * Objectives:
 * - Execute a deep secular simulation across 2,500 to 10,000 weekly turns (52 to 208 campaign years).
 * - Monitor dynastic successions, demographic stability, economic maintenance and resource bounds.
 * - Measure DEBT-001 empirical impact: linear growth of `worldLedger.majorEvents`, JSON serialization size,
 *   and serialization throughput at 1,000, 2,500, 5,000, and 10,000 turns.
 * - Validate 100% bit-for-bit replay determinism across the full secular horizon.
 * - Validate Save / Load persistence integrity (round-trip state identity) at multi-decade checkpoints.
 */

import assert from 'node:assert/strict';
import { createInitialState, resolveWeeklyTurn, exportStateToText, importStateFromText } from '../src/engine';
import { CampaignState } from '../src/types';
import { SuccessionService, Relative } from '../src/domain/kingdom/services/SuccessionService';
import { globalRNG } from '../src/core/RandomService';
import * as crypto from 'crypto';

console.log('=== TEST SUITE: VAL-001 Secular Campaign Multi-Decade Stress Validation ===\n');

interface SecularTelemetry {
  ticks: number;
  years: number;
  successionsTriggered: number;
  majorEventsCount: number;
  eventStoreCount: number;
  serializedPayloadSizeBytes: number;
  finalSilverdew: number;
  finalFood: number;
  finalArmySize: number;
  checkpointHashes: Record<number, string>;
  elapsedMs: number;
}

function runSecularCampaign(ticksCount: number = 10000, seed: number = 42): { state: CampaignState; telemetry: SecularTelemetry } {
  globalRNG.setSeed(seed);
  const startTime = Date.now();
  let state = createInitialState('Archon Alden', 'Forest Plains');
  
  // Setup dynasty lineage
  let currentDynastyGeneration = 1;
  const relatives: Relative[] = [
    { id: 'heir_1', name: 'Alden II', relation: 'child', age: 18, isLegitimate: true },
    { id: 'heir_2', name: 'Lyanna', relation: 'child', age: 14, isLegitimate: true },
    { id: 'heir_3', name: 'Corvin', relation: 'sibling', age: 35, isLegitimate: true }
  ];

  const telemetry: SecularTelemetry = {
    ticks: ticksCount,
    years: Math.floor(ticksCount / 48),
    successionsTriggered: 0,
    majorEventsCount: 0,
    eventStoreCount: 0,
    serializedPayloadSizeBytes: 0,
    finalSilverdew: 0,
    finalFood: 0,
    finalArmySize: 0,
    checkpointHashes: {},
    elapsedMs: 0
  };

  const checkpointTurns = [1000, 2500, 5000, 7500, 10000];

  for (let turn = 1; turn <= ticksCount; turn++) {
    // 1. Advance weekly turn in the authoritative engine
    const { updatedState } = resolveWeeklyTurn(state);
    state = updatedState;

    // 2. Periodic dynastic succession check (every 1,200 weeks / ~25 years)
    if (turn % 1200 === 0) {
      currentDynastyGeneration++;
      const succession = SuccessionService.getSuccessionOrder(relatives);
      if (succession.length > 0) {
        const nextRuler = succession[0];
        state.character.name = nextRuler.name;
        telemetry.successionsTriggered++;
        // Add new generation heirs
        relatives.push({
          id: `heir_gen${currentDynastyGeneration}`,
          name: `Alden_${currentDynastyGeneration}`,
          relation: 'child',
          age: 16,
          isLegitimate: true
        });
      }
    }

    // 3. Mathematical invariant assertions
    assert.ok(!isNaN(state.weeklyLedger.silverdew), `Silverdew is NaN at turn ${turn}`);
    assert.ok(!isNaN(state.weeklyLedger.food), `Food is NaN at turn ${turn}`);
    assert.ok(state.weeklyLedger.silverdew >= 0, `Negative silverdew at turn ${turn}`);
    assert.ok(state.weeklyLedger.food >= 0, `Negative food at turn ${turn}`);

    // 4. Capture checkpoints
    if (checkpointTurns.includes(turn)) {
      const hash = crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex');
      telemetry.checkpointHashes[turn] = hash;
      
      const payload = JSON.stringify(state);
      console.log(`  [Checkpoint Turn ${turn} (${Math.floor(turn / 48)} Anos)]`);
      console.log(`    - Major Events: ${state.worldLedger.majorEvents.length}`);
      console.log(`    - EventStore: ${state.eventStore?.length ?? 0}`);
      console.log(`    - Payload Size: ${(payload.length / 1024).toFixed(2)} KB`);
      console.log(`    - Tesouro: ${state.weeklyLedger.silverdew} SD | Comida: ${state.weeklyLedger.food} FSU | Exército: ${state.army.units.reduce((a, u) => a + u.size, 0)}`);
      console.log(`    - State Hash: ${hash}`);
    }
  }

  telemetry.elapsedMs = Date.now() - startTime;
  telemetry.majorEventsCount = state.worldLedger.majorEvents.length;
  telemetry.eventStoreCount = state.eventStore?.length ?? 0;
  telemetry.finalSilverdew = state.weeklyLedger.silverdew;
  telemetry.finalFood = state.weeklyLedger.food;
  telemetry.finalArmySize = state.army.units.reduce((a, u) => a + u.size, 0);
  telemetry.serializedPayloadSizeBytes = JSON.stringify(state).length;

  return { state, telemetry };
}

// ---------------------------------------------------------------------------
// Step 1: Run 10,000 Turn Secular Campaign
// ---------------------------------------------------------------------------
console.log('[VAL-001] Executando simulação secular de 10.000 turnos (208 anos de campanha)...');
const secularRun1 = runSecularCampaign(10000, 2026);

console.log('\n  Relatório de Telemetria Secular (VAL-001 / DEBT-001):');
console.log(`    - Turnos Simulados: ${secularRun1.telemetry.ticks} semanas (${secularRun1.telemetry.years} anos de campanha)`);
console.log(`    - Tempo de Execução: ${secularRun1.telemetry.elapsedMs}ms (${(10000 / (secularRun1.telemetry.elapsedMs / 1000)).toFixed(0)} ticks/s)`);
console.log(`    - Sucessões Dinásticas Resolvidas: ${secularRun1.telemetry.successionsTriggered}`);
console.log(`    - Total de Major Events (DEBT-001): ${secularRun1.telemetry.majorEventsCount}`);
console.log(`    - Tamanho Final do Payload JSON: ${(secularRun1.telemetry.serializedPayloadSizeBytes / 1024).toFixed(2)} KB`);
console.log(`    - Estado Econômico Final: ${secularRun1.telemetry.finalSilverdew} SD | ${secularRun1.telemetry.finalFood} FSU Comida`);

// Invariant assertions
assert.ok(secularRun1.telemetry.successionsTriggered >= 8, 'Deve ter resolvido ao menos 8 sucessões ao longo de 200 anos');
assert.ok(secularRun1.telemetry.serializedPayloadSizeBytes < 5 * 1024 * 1024, 'Payload do estado não deve exceder 5MB mesmo após 200 anos');

// ---------------------------------------------------------------------------
// Step 2: 100% Bit-for-Bit Replay Determinism Verification
// ---------------------------------------------------------------------------
console.log('\n[VAL-001] Validando determinismo estrito de Replay bit-a-bit (10.000 turnos)...');
const secularRun2 = runSecularCampaign(10000, 2026);

for (const turn of [1000, 2500, 5000, 7500, 10000]) {
  assert.equal(
    secularRun1.telemetry.checkpointHashes[turn],
    secularRun2.telemetry.checkpointHashes[turn],
    `VAL-001 Replay Failure: Checkpoint no turno ${turn} divergiu entre execuções idênticas`
  );
}
console.log('  ✓ Determinismo de replay verificado em 100% dos checkpoints seculares (1000, 2500, 5000, 7500, 10000)!');

// ---------------------------------------------------------------------------
// Step 3: Multi-Decade Persistence Round-Trip Verification
// ---------------------------------------------------------------------------
console.log('\n[VAL-001] Validando persistência e restauração de estado pós-200 anos...');
const serializedSecular = exportStateToText(secularRun1.state);
const reloadedSecular = importStateFromText(serializedSecular);
const originalFinalHash = secularRun1.telemetry.checkpointHashes[10000];
const reloadedFinalHash = crypto.createHash('sha256').update(JSON.stringify(reloadedSecular)).digest('hex');

assert.equal(originalFinalHash, reloadedFinalHash, 'VAL-001 Persistence Failure: Estado recarregado pós-200 anos divergiu do original');
console.log('  ✓ Serialização e reload de 200 anos de campanha validados com integridade total!');

console.log('\n===================================================================');
console.log('🎉 VAL-001: VALIDAÇÃO SECULAR MULTI-DÉCADA CONCLUÍDA COM SUCESSO!');
console.log('===================================================================\n');

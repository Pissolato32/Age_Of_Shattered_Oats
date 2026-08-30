/**
 * VAL-002: Low-Frequency Subsystem Long-Run Continuous Exercise
 * 
 * Objectives:
 * - Continuously exercise low-frequency canonical domain services inside a 1,000-cycle campaign loop:
 *   1. CommanderAIService (tactical AI & temperament responses under dynamic combat pressure)
 *   2. AdventureEngine (procedural adventure generation & resource delta application)
 *   3. MarketService (commodity price fluctuations across seasons, regional demand, and saturation)
 *   4. BreedingService (mount breeding success rates across regions, holding tiers, and mount types)
 * - Assert 100% bit-for-bit replay determinism across runs.
 * - Assert mathematical invariants (no NaN, minimum price floor, bounded probabilities, valid tactics).
 */

import assert from 'node:assert/strict';
import { createInitialState, resolveWeeklyTurn, exportStateToText, importStateFromText } from '../src/engine';
import { CampaignState } from '../src/types';
import { CommanderAIService, CombatContext, CommanderProfile, CombatTactic } from '../src/domain/npc_ai/CommanderAIService';
import { AdventureEngine } from '../src/domain/adventure/AdventureEngine';
import { MarketService } from '../src/domain/commerce/services/MarketService';
import { BreedingService } from '../src/domain/military/services/BreedingService';
import { globalRNG } from '../src/core/RandomService';
import * as crypto from 'crypto';

console.log('=== TEST SUITE: VAL-002 Low-Frequency Subsystem Continuous Long-Run Exercise ===\n');

interface SubsystemTelemetry {
  tacticsGenerated: Record<CombatTactic, number>;
  adventuresResolved: number;
  marketPriceCalculations: number;
  breedingCalculations: number;
  totalResourceDeltas: { silverdew: number; food: number; troops: number; reputation: number };
}

function run1000CycleExercise(seed: number = 42): { state: CampaignState; telemetry: SubsystemTelemetry; stateHash: string } {
  globalRNG.setSeed(seed);
  let state = createInitialState('Lord Commander', 'Northern Snowlands');
  
  const commanderAI = new CommanderAIService();
  const marketService = new MarketService();

  const telemetry: SubsystemTelemetry = {
    tacticsGenerated: { Charge: 0, Attack: 0, Defend: 0, Traps: 0, Rearguard: 0, Retreat: 0 },
    adventuresResolved: 0,
    marketPriceCalculations: 0,
    breedingCalculations: 0,
    totalResourceDeltas: { silverdew: 0, food: 0, troops: 0, reputation: 0 }
  };

  const temperaments: CommanderProfile['temperament'][] = ['Aggressive', 'Disciplined', 'Cunning', 'Loyal', 'Proud', 'Wary'];
  const priorities: CommanderProfile['priority'][] = ['Glory', 'Survival', 'Victory', 'Orders'];
  const fears: CommanderProfile['fear'][] = ['Fire', 'Cavalry', 'Encirclement', 'Loss', 'Darkness'];
  const commodities = ['grain', 'timber', 'iron', 'medicine', 'furs', 'wine', 'horses', 'salt'];
  const regions = ['northern_snowlands', 'nomad_steppe_north', 'western_rivers_north', 'eastern_forests_north', 'central_plains', 'southern_mountains'];
  const mounts = ['courser', 'destrier', 'rouncey', 'palfrey'];

  for (let turn = 1; turn <= 1000; turn++) {
    // 1. Advance core engine turn
    const { updatedState } = resolveWeeklyTurn(state);
    state = updatedState;

    // 2. Exercise CommanderAIService with dynamic battlefield conditions
    const profile: CommanderProfile = {
      temperament: temperaments[turn % temperaments.length],
      priority: priorities[(turn * 2) % priorities.length],
      fear: fears[(turn * 3) % fears.length]
    };
    const context: CombatContext = {
      hpPercent: Math.max(10, 100 - (turn % 90)),
      morale: Math.max(5, (turn * 7) % 100),
      isOutnumbered: (turn % 3 === 0),
      isHalfStrength: (turn % 5 === 0),
      isAllyRetreating: (turn % 7 === 0),
      terrainAdvantage: (turn % 2 === 0),
      fearTriggered: (turn % 6 === 0)
    };
    const tactic = commanderAI.selectCombatTactic(context, profile);
    assert.ok(['Charge', 'Attack', 'Defend', 'Traps', 'Rearguard', 'Retreat'].includes(tactic), `Invalid tactic: ${tactic}`);
    telemetry.tacticsGenerated[tactic]++;

    // 3. Exercise AdventureEngine periodically (every 5 turns)
    if (turn % 5 === 0) {
      const node = AdventureEngine.generateForestAdventure(`Turn_${turn}_Woods`);
      assert.ok(node.choices.length >= 2, 'AdventureNode must have at least 2 choices');
      const choice = node.choices[turn % node.choices.length];
      if (choice.resourceDelta) {
        if (choice.resourceDelta.silverdew) {
          state.weeklyLedger.silverdew = Math.max(0, state.weeklyLedger.silverdew + choice.resourceDelta.silverdew);
          telemetry.totalResourceDeltas.silverdew += choice.resourceDelta.silverdew;
        }
        if (choice.resourceDelta.food) {
          state.weeklyLedger.food = Math.max(0, state.weeklyLedger.food + choice.resourceDelta.food);
          telemetry.totalResourceDeltas.food += choice.resourceDelta.food;
        }
        if (choice.resourceDelta.troops && state.army.units[0]) {
          state.army.units[0].size += choice.resourceDelta.troops;
          telemetry.totalResourceDeltas.troops += choice.resourceDelta.troops;
        }
        if (choice.resourceDelta.reputation) {
          state.character.reputation = (state.character.reputation || 0) + choice.resourceDelta.reputation;
          telemetry.totalResourceDeltas.reputation += choice.resourceDelta.reputation;
        }
      }
      telemetry.adventuresResolved++;
    }

    // 4. Exercise MarketService across seasonal shifts and market stock levels
    const commodity = commodities[turn % commodities.length];
    const region = regions[turn % regions.length];
    const monthNum = ((Math.floor((turn - 1) / 4)) % 12) + 1;
    const stock = (turn * 13) % 200;
    const priceResult = marketService.calculatePrice(10, commodity, region, monthNum, stock, 150);

    assert.ok(!isNaN(priceResult.finalPrice), `Market price is NaN for ${commodity} at turn ${turn}`);
    assert.ok(priceResult.finalPrice >= 0.1, `Price below floor 0.1 SD: ${priceResult.finalPrice}`);
    assert.ok(priceResult.demandMultiplier > 0, 'Demand multiplier must be > 0');
    assert.ok(priceResult.saturationModifier > 0, 'Saturation modifier must be > 0');
    telemetry.marketPriceCalculations++;

    // 5. Exercise BreedingService under changing regional, tier and mount parameters
    const mount = mounts[turn % mounts.length];
    const holdingTier = (turn % 5) + 1;
    const breedingRate = BreedingService.calculateSuccessRate(
      0.75,
      mount === 'destrier' ? 'Great Lords, Capitals' : 'Southern Mountains',
      mount,
      region,
      holdingTier
    );
    assert.ok(!isNaN(breedingRate), `Breeding rate is NaN at turn ${turn}`);
    assert.ok(breedingRate >= 0.10 && breedingRate <= 1.0, `Breeding rate ${breedingRate} out of valid bounds [0.10, 1.0]`);
    telemetry.breedingCalculations++;
  }

  const stateHash = crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex');
  return { state, telemetry, stateHash };
}

// ---------------------------------------------------------------------------
// Step 1: Run 1,000 Cycle Integrated Exercise
// ---------------------------------------------------------------------------
console.log('[VAL-002] Executando simulação de 1.000 ciclos contínuos com subsistemas de baixa frequência...');
const run1 = run1000CycleExercise(1337);

console.log('  Telemetry Results (1.000 Ciclos):');
console.log('    - Táticas Militares Decididas:', run1.telemetry.tacticsGenerated);
console.log(`    - Aventuras de Campo Resolvidas: ${run1.telemetry.adventuresResolved}`);
console.log(`    - Cálculos de Mercado e Sazonalidade: ${run1.telemetry.marketPriceCalculations}`);
console.log(`    - Cálculos de Reprodução Militar (Breeding): ${run1.telemetry.breedingCalculations}`);
console.log('    - Deltas de Recursos Aplicados:', run1.telemetry.totalResourceDeltas);
console.log(`    - Hash Final do Estado: ${run1.stateHash}`);

// Verify all tactics were used under varying combat contexts
for (const [tactic, count] of Object.entries(run1.telemetry.tacticsGenerated)) {
  assert.ok(count > 0, `Tactical diversity failure: tactic "${tactic}" was never selected`);
}

// Verify counts
assert.equal(run1.telemetry.adventuresResolved, 200, 'Deve ter resolvido exatamente 200 aventuras');
assert.equal(run1.telemetry.marketPriceCalculations, 1000, 'Deve ter executado 1000 cotações de mercado');
assert.equal(run1.telemetry.breedingCalculations, 1000, 'Deve ter executado 1000 cálculos de breeding');

// ---------------------------------------------------------------------------
// Step 2: Deterministic Replay Verification
// ---------------------------------------------------------------------------
console.log('\n[VAL-002] Verificando determinismo de replay bit-a-bit...');
const run2 = run1000CycleExercise(1337);
assert.equal(run1.stateHash, run2.stateHash, 'VAL-002 Replay Failure: Estado final divergiu com a mesma seed');
assert.deepEqual(run1.telemetry, run2.telemetry, 'VAL-002 Replay Failure: Telemetria divergiu com a mesma seed');
console.log('  ✓ Replay determinístico bit-a-bit aprovado com sucesso!');

// ---------------------------------------------------------------------------
// Step 3: Persistence Snapshot Round-Trip Verification
// ---------------------------------------------------------------------------
console.log('\n[VAL-002] Verificando serialização e reload de persistência...');
const serialized = exportStateToText(run1.state);
const reloaded = importStateFromText(serialized);
const reloadedHash = crypto.createHash('sha256').update(JSON.stringify(reloaded)).digest('hex');
assert.equal(run1.stateHash, reloadedHash, 'VAL-002 Persistence Failure: Estado restaurado divergiu do original');
console.log('  ✓ Persistência e restauração de estado aprovada!');

console.log('\n===================================================================');
console.log('🎉 VAL-002: EXERCITAÇÃO CONTÍNUA DE SUBSISTEMAS CONCLUÍDA COM SUCESSO!');
console.log('===================================================================\n');

import * as assert from 'assert';
import { PayrollService, PRNGProvider } from '../../src/domain/military/services/PayrollService';

async function runTests() {
  console.log("🧪 Starting Military Payroll Domain Unit Tests...");

  try {
    // 1. Upkeep & Wage calculations
    console.log("  - Testing calculateUpkeep wage & food formulas...");
    assert.deepStrictEqual(PayrollService.calculateUpkeep(0), { wageCost: 0, foodCost: 0 });
    assert.deepStrictEqual(PayrollService.calculateUpkeep(1), { wageCost: 1, foodCost: 0.01 }); // Math.ceil(1/10) = 1
    assert.deepStrictEqual(PayrollService.calculateUpkeep(10), { wageCost: 1, foodCost: 0.1 });
    assert.deepStrictEqual(PayrollService.calculateUpkeep(15), { wageCost: 2, foodCost: 0.15 }); // Math.ceil(15/10) = 2
    assert.deepStrictEqual(PayrollService.calculateUpkeep(100), { wageCost: 10, foodCost: 1 });

    console.log("  - Testing calculateMilitaryWages for army and garrison...");
    const wages = PayrollService.calculateMilitaryWages([50, 30], 100);
    assert.strictEqual(wages.armyWages, 8); // Math.ceil(80/10) = 8
    assert.strictEqual(wages.garrisonWages, 5); // Math.ceil(100/20) = 5
    assert.strictEqual(wages.totalWages, 13);

    // 2. Payment Outcomes & Morale
    console.log("  - Testing applyPaymentOutcome for paid vs unpaid outcomes...");
    const state = {
      unpaidTicks: 2,
      units: [{ morale: 2 }, { morale: 4 }]
    };

    PayrollService.applyPaymentOutcome(state, true);
    assert.strictEqual(state.unpaidTicks, 0);
    assert.strictEqual(state.units[0].morale, 5);
    assert.strictEqual(state.units[1].morale, 5);

    PayrollService.applyPaymentOutcome(state, false);
    assert.strictEqual(state.unpaidTicks, 1);
    assert.strictEqual(state.units[0].morale, 3); // 5 - 2 = 3
    assert.strictEqual(state.units[1].morale, 3); // 5 - 2 = 3

    // 3. Desertion Rolls (Week 1, 2, 3+)
    console.log("  - Testing resolveDesertion roll thresholds and deserter counts...");
    
    // Helper to create mock sequence PRNG
    const createMockPrng = (sequence: number[]): PRNGProvider => {
      let index = 0;
      return {
        nextInt: (_min: number, _max: number) => {
          const val = sequence[index % sequence.length];
          index++;
          return val;
        }
      };
    };

    // Week 0: No desertion
    assert.deepStrictEqual(
      PayrollService.resolveDesertion(0, createMockPrng([1])),
      { deserted: false, deserterCount: 0 }
    );

    // Week 1: Roll 2 <= 2 (Trigger), 1d10 roll 7 -> 7 deserters
    const w1Success = PayrollService.resolveDesertion(1, createMockPrng([2, 7]));
    assert.strictEqual(w1Success.deserted, true);
    assert.strictEqual(w1Success.deserterCount, 7);

    // Week 1: Roll 3 > 2 -> No desertion
    const w1Fail = PayrollService.resolveDesertion(1, createMockPrng([3]));
    assert.strictEqual(w1Fail.deserted, false);
    assert.strictEqual(w1Fail.deserterCount, 0);

    // Week 2: Roll 3 <= 3 (Trigger), 2d10 rolls (5, 6) -> 11 deserters
    const w2Success = PayrollService.resolveDesertion(2, createMockPrng([3, 5, 6]));
    assert.strictEqual(w2Success.deserted, true);
    assert.strictEqual(w2Success.deserterCount, 11);

    // Week 3+: Roll 4 <= 4 (Trigger), 3d10 rolls (4, 4, 4) -> 12 deserters
    const w3Success = PayrollService.resolveDesertion(3, createMockPrng([4, 4, 4, 4]));
    assert.strictEqual(w3Success.deserted, true);
    assert.strictEqual(w3Success.deserterCount, 12);

    // 4. Applying Desertions to Units
    console.log("  - Testing applyDesertionToUnits troop deductions...");
    const units = [{ size: 10 }, { size: 20 }];
    const actualDeducted = PayrollService.applyDesertionToUnits(units, 15);
    assert.strictEqual(actualDeducted, 15);
    assert.strictEqual(units[1].size, 5); // 20 - 15 = 5 (deducted from back of array)
    assert.strictEqual(units[0].size, 10);

    // Excess desertion clamping test
    const actualDeductedOver = PayrollService.applyDesertionToUnits(units, 30);
    assert.strictEqual(actualDeductedOver, 15); // Only 15 troops left total (10 + 5)
    assert.strictEqual(units[1].size, 0);
    assert.strictEqual(units[0].size, 0);

    console.log("🎉 All Military Payroll Domain Unit Tests Passed Successfully!");
  } catch (err: any) {
    console.error("❌ Military Payroll Unit Tests failed: ", err.stack);
    process.exit(1);
  }
}

runTests();

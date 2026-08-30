import * as assert from 'assert';
import { ProductionService, HoldingEconomy } from '../../src/domain/kingdom/services/ProductionService';
import { FoodService } from '../../src/domain/kingdom/services/FoodService';
import { LaborService } from '../../src/domain/kingdom/services/LaborService';
import { TreasuryService } from '../../src/domain/kingdom/services/TreasuryService';

async function runTests() {
  console.log("🧪 Starting Kingdom Production Domain Unit Tests...");

  try {
    // 1. ProductionService Tests
    console.log("  - Testing ProductionService daily & weekly yields...");
    const holding: HoldingEconomy = {
      holdingTier: 3, // Town (30 SD/day, 1.0 FSU/day)
      fortificationTier: 2, // Fortified Manor (7.5 SD/day)
      resourcePatches: [
        { type: 'grain_field', tier: 2 }, // 5 SD/day, food
        { type: 'iron_mine', tier: 1 }    // 7.5 SD/day
      ],
      tradeIncomePerDay: 10
    };

    const summerDaily = ProductionService.calculateDailyProduction(holding, false);
    assert.strictEqual(summerDaily.holdingIncomeSD, 30);
    assert.strictEqual(summerDaily.fortificationIncomeSD, 7.5);
    assert.strictEqual(summerDaily.resourceIncomeSD, 12.5); // 5 + 7.5
    assert.strictEqual(summerDaily.tradeIncomeSD, 10);
    assert.strictEqual(summerDaily.totalIncomeSD, 60);
    assert.strictEqual(summerDaily.holdingFSU, 1.0);
    assert.strictEqual(summerDaily.seasonalPenaltyApplied, false);

    console.log("  - Testing ProductionService Winter Agricultural Penalty...");
    const winterDaily = ProductionService.calculateDailyProduction(holding, true);
    assert.strictEqual(winterDaily.resourceIncomeSD, 10); // grain field halved: 2.5 + 7.5 = 10
    assert.strictEqual(winterDaily.holdingFSU, 0.5); // holding FSU halved: 0.5
    assert.strictEqual(winterDaily.seasonalPenaltyApplied, true);

    const summerWeekly = ProductionService.calculateWeeklyProduction(holding, false);
    assert.strictEqual(summerWeekly.totalIncomeSD, 420); // 60 * 7

    // 2. FoodService Tests
    console.log("  - Testing FoodService civilian & military consumption...");
    const civilianFsu = FoodService.calculateCivilianConsumption(5000);
    assert.strictEqual(civilianFsu, 5.0); // 5000 / 1000 = 5 FSU

    const militaryFsu = FoodService.calculateMilitaryConsumption(250);
    assert.strictEqual(militaryFsu, 2.5); // 250 / 100 = 2.5 FSU

    console.log("  - Testing FoodService food depletion & famine tracking...");
    const stateWithFood = { treasuryFsu: 10.0, famineTicks: 0 };
    const outcome1 = FoodService.applyFoodConsumption(stateWithFood, 4.0);
    assert.strictEqual(outcome1.consumed, 4.0);
    assert.strictEqual(outcome1.famineStarted, false);
    assert.strictEqual(stateWithFood.treasuryFsu, 6.0);

    const outcome2 = FoodService.applyFoodConsumption(stateWithFood, 8.0);
    assert.strictEqual(outcome2.consumed, 6.0);
    assert.strictEqual(outcome2.unpaid, 2.0);
    assert.strictEqual(outcome2.famineStarted, true);
    assert.strictEqual(stateWithFood.treasuryFsu, 0);
    assert.strictEqual(stateWithFood.famineTicks, 1);

    // 3. LaborService Tests
    console.log("  - Testing LaborService workforce calculations...");
    const laborPool = LaborService.calculateLaborPool(1000);
    assert.strictEqual(laborPool, 400); // 40% of 1000

    const patches = [{ laborAllocated: 100 }, { laborAllocated: 150 }];
    const allocated = LaborService.calculateAllocatedLabor(patches);
    assert.strictEqual(allocated, 250);

    const available = LaborService.calculateAvailableLabor(1000, patches);
    assert.strictEqual(available, 150); // 400 - 250

    assert.doesNotThrow(() => LaborService.validateLaborAvailability(1000, patches, 100));
    assert.throws(() => LaborService.validateLaborAvailability(1000, patches, 200), /Insufficient labor capacity/);

    // 4. TreasuryService Tests
    console.log("  - Testing TreasuryService expense deductions...");
    const treasury = { treasurySd: 100 };
    const expensePass = TreasuryService.deductExpenses(treasury, 40);
    assert.strictEqual(expensePass.expensesDeducted, 40);
    assert.strictEqual(expensePass.defaulted, false);
    assert.strictEqual(treasury.treasurySd, 60);

    const expenseFail = TreasuryService.deductExpenses(treasury, 100);
    assert.strictEqual(expenseFail.expensesDeducted, 60);
    assert.strictEqual(expenseFail.unpaidExpenses, 40);
    assert.strictEqual(expenseFail.defaulted, true);
    assert.strictEqual(treasury.treasurySd, 0);

    console.log("🎉 All Kingdom Production Domain Unit Tests Passed Successfully!");
  } catch (err: any) {
    console.error("❌ Kingdom Production Tests failed: ", err.stack);
    process.exit(1);
  }
}

runTests();

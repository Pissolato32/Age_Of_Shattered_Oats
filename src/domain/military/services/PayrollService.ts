export interface UpkeepCosts {
  wageCost: number;
  foodCost: number;
}

export interface DesertionResult {
  deserted: boolean;
  deserterCount: number;
}

export interface PRNGProvider {
  nextInt(min: number, max: number): number;
}

export interface MilitaryUnitRef {
  size?: number;
  people?: number;
  morale?: number;
}

/**
 * PayrollService
 * 
 * Reusable domain service for computing salary/wage costs, morale penalties,
 * and resolving troop desertion checks when salaries go unpaid.
 * 
 * @rule military.retinues
 */
export class PayrollService {
  /**
   * Calculates the weekly wage and food costs for a given number of soldiers.
   * Rule: 10 soldiers = 1 SD per week (rounded up via Math.ceil), 100 soldiers = 1 FSU per week.
   */
  public static calculateUpkeep(totalSoldiers: number): UpkeepCosts {
    if (totalSoldiers <= 0) {
      return { wageCost: 0, foodCost: 0 };
    }

    const wageCost = Math.ceil(totalSoldiers / 10);
    const foodCost = Math.round((totalSoldiers / 100) * 100) / 100;

    return { wageCost, foodCost };
  }

  /**
   * Calculates total military wages for army units and garrison forces.
   */
  public static calculateMilitaryWages(
    unitSizes: number[],
    garrisonSize: number
  ): { armyWages: number; garrisonWages: number; totalWages: number } {
    const totalArmySoldiers = unitSizes.reduce((sum, size) => sum + (size > 0 ? size : 0), 0);
    const armyWages = Math.ceil(totalArmySoldiers / 10);
    const garrisonWages = Math.ceil((garrisonSize > 0 ? garrisonSize : 0) / 20); // 0.05 SD per garrison
    const totalWages = armyWages + garrisonWages;

    return { armyWages, garrisonWages, totalWages };
  }

  /**
   * Applies the payroll payment results to the holding/army state.
   * If paid, resets unpaid ticks and restores morale to baseline (min 5).
   * If unpaid, increments unpaid ticks and applies -2 morale penalty (min 1).
   */
  public static applyPaymentOutcome(
    holdingState: { units?: MilitaryUnitRef[]; unpaidTicks?: number },
    paid: boolean
  ): void {
    const units = holdingState.units || [];

    if (paid) {
      holdingState.unpaidTicks = 0;
      for (const u of units) {
        u.morale = Math.max(5, u.morale ?? 5);
      }
    } else {
      holdingState.unpaidTicks = (holdingState.unpaidTicks || 0) + 1;
      for (const u of units) {
        u.morale = Math.max(1, (u.morale ?? 5) - 2);
      }
    }
  }

  /**
   * Resolves the weekly desertion check for unpaid wages.
   * Returns whether desertion occurred and the number of deserting troops.
   */
  public static resolveDesertion(
    unpaidWeeks: number,
    prng: PRNGProvider
  ): DesertionResult {
    if (unpaidWeeks <= 0) {
      return { deserted: false, deserterCount: 0 };
    }

    let defectThreshold = 2; // Week 1: 1-2 on 1d6
    let diceCount = 1;       // Week 1: 1d10 deserters

    if (unpaidWeeks === 2) {
      defectThreshold = 3;   // Week 2: 1-3 on 1d6
      diceCount = 2;         // Week 2: 2d10 deserters
    } else if (unpaidWeeks >= 3) {
      defectThreshold = 4;   // Week 3+: 1-4 on 1d6
      diceCount = 3;         // Week 3+: 3d10 deserters
    }

    const roll = prng.nextInt(1, 6);
    if (roll > defectThreshold) {
      return { deserted: false, deserterCount: 0 };
    }

    let deserterCount = 0;
    for (let i = 0; i < diceCount; i++) {
      deserterCount += prng.nextInt(1, 10);
    }

    return { deserted: true, deserterCount };
  }

  /**
   * Deducts deserting soldiers from troop unit arrays.
   * Modifies unit sizes in place and returns the actual number of deserted soldiers.
   */
  public static applyDesertionToUnits(units: MilitaryUnitRef[], deserterCount: number): number {
    let remainingToDeduct = deserterCount;

    for (let i = units.length - 1; i >= 0 && remainingToDeduct > 0; i--) {
      const u = units[i];
      const count = u.size ?? u.people ?? 0;
      if (count > 0) {
        const deduction = Math.min(count, remainingToDeduct);
        if (u.size !== undefined) {
          u.size -= deduction;
        } else if (u.people !== undefined) {
          u.people -= deduction;
        }
        remainingToDeduct -= deduction;
      }
    }

    return deserterCount - remainingToDeduct;
  }

  // Instance method wrappers for legacy OOP compatibility
  public calculateUpkeep(totalSoldiers: number): UpkeepCosts {
    return PayrollService.calculateUpkeep(totalSoldiers);
  }

  public applyPaymentOutcome(holdingState: { units?: MilitaryUnitRef[]; unpaidTicks?: number }, paid: boolean): void {
    PayrollService.applyPaymentOutcome(holdingState, paid);
  }

  public resolveDesertion(unpaidWeeks: number, prng: PRNGProvider): DesertionResult {
    return PayrollService.resolveDesertion(unpaidWeeks, prng);
  }

  public applyDesertionToUnits(units: MilitaryUnitRef[], deserterCount: number): number {
    return PayrollService.applyDesertionToUnits(units, deserterCount);
  }
}

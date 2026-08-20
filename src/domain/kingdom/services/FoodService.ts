/**
 * FoodService
 * 
 * Centralized domain service for civilian food consumption, military rations,
 * and famine tracking rules.
 * 
 * @rule economy.weekly
 * @rule holdings.tiers
 */
export class FoodService {
  /**
   * Calculates the weekly food consumption (FSU) for a civilian population.
   * Rule A.32: 1 FSU per 1,000 civilians per week.
   */
  public static calculateCivilianConsumption(population: number): number {
    return Math.round((population / 1000) * 100) / 100;
  }

  /**
   * Calculates the weekly food consumption (FSU) for military retinues / garrison.
   * Rule: 1 FSU per 100 soldiers per week.
   */
  public static calculateMilitaryConsumption(totalSoldiers: number): number {
    return Math.round((totalSoldiers / 100) * 100) / 100;
  }

  /**
   * Applies food consumption outcomes to the holding treasury state.
   * If FSU is depleted, sets or increments famine ticks.
   */
  public static applyFoodConsumption(
    holdingState: { treasuryFsu: number; famineTicks?: number },
    requiredFood: number
  ): { consumed: number; unpaid: number; famineStarted: boolean } {
    if (holdingState.treasuryFsu >= requiredFood) {
      holdingState.treasuryFsu = Math.round((holdingState.treasuryFsu - requiredFood) * 100) / 100;
      return { consumed: requiredFood, unpaid: 0, famineStarted: false };
    } else {
      const consumed = holdingState.treasuryFsu;
      const unpaid = Math.round((requiredFood - consumed) * 100) / 100;
      holdingState.treasuryFsu = 0;
      holdingState.famineTicks = (holdingState.famineTicks || 0) + 1;
      return { consumed, unpaid, famineStarted: true };
    }
  }
}

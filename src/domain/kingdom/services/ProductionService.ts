/** Holding base income per day in SD, indexed by tier (Rule 68.1) */
export const HOLDING_INCOME_PER_DAY: Record<number, number> = {
  0: 2.5,    // Hamlet
  1: 7.5,    // Village
  2: 15,     // Large Village
  3: 30,     // Town
  4: 50,     // Large Town
  5: 87.5,   // City
  6: 150,    // Large City
  7: 250,    // Metropolis
  8: 500,    // Capital
};

/** Holding food surplus per day in FSU, indexed by tier (Rule 68.1) */
export const HOLDING_FSU_PER_DAY: Record<number, number> = {
  0: 0.1,
  1: 0.2,
  2: 0.5,
  3: 1.0,
  4: 2.0,
  5: 4.0,
  6: 8.0,
  7: 15.0,
  8: 25.0,
};

/** Fortification income per day in SD, indexed by tier (Rule 68.2) */
export const FORTIFICATION_INCOME_PER_DAY: Record<number, number> = {
  1: 2.5,    // Watchtower
  2: 7.5,    // Fortified Manor
  3: 15,     // Keep
  4: 30,     // Castle
  5: 50,     // Bastion
  6: 75,     // Fortress
  7: 125,    // Citadel
};

/** Holding base maintenance/upkeep cost per week in SD (Rule M18.3.A) */
export const HOLDING_UPKEEP_PER_WEEK: Record<string, number> = {
  'Bastion': 70,
  'Fortified Town': 130,
  'Castle': 190,
  'Walled City': 300,
};

export type ResourcePatchType =
  | 'grain_field'
  | 'iron_mine'
  | 'timber_camp'
  | 'stone_quarry'
  | 'hunting_grounds'
  | 'wool_farm'
  | 'vineyard'
  | 'salt_pan'
  | 'tar_pit'
  | string;

/** Resource patch SD yield per day, indexed by type and tier (Rule 68.3) */
export const RESOURCE_PATCH_SD_PER_DAY: Record<string, Record<number, number>> = {
  grain_field:     { 1: 2.5, 2: 5, 3: 7.5 },
  iron_mine:       { 1: 7.5, 2: 12.5, 3: 20 },
  timber_camp:     { 1: 5, 2: 7.5, 3: 10 },
  stone_quarry:    { 1: 7.5, 2: 12.5, 3: 20 },
  hunting_grounds: { 1: 10 },
  wool_farm:       { 1: 5 },
  vineyard:        { 1: 12.5 },
  salt_pan:        { 1: 7.5 },
  tar_pit:         { 1: 10 },
};

export interface HoldingEconomy {
  holdingTier: number;
  fortificationTier: number;
  resourcePatches: { type: ResourcePatchType; tier: number }[];
  tradeIncomePerDay: number;
}

export interface EconomyTickResult {
  holdingIncomeSD: number;
  fortificationIncomeSD: number;
  resourceIncomeSD: number;
  tradeIncomeSD: number;
  totalIncomeSD: number;
  holdingFSU: number;
  seasonalPenaltyApplied: boolean;
}

/**
 * ProductionService
 * 
 * Reusable domain service for calculating daily, weekly and monthly economic production
 * of holdings, fortifications, resource patches, and seasonal penalty applications.
 * 
 * @rule holdings.tiers
 * @rule holdings.patches
 */
export class ProductionService {
  /**
   * Calculates the economic production (SD & FSU) for a single day tick.
   */
  public static calculateDailyProduction(holding: HoldingEconomy, isWinter: boolean): EconomyTickResult {
    // 1. Holding base income (Rule 68.1)
    const holdingIncomeSD = HOLDING_INCOME_PER_DAY[holding.holdingTier] ?? 0;

    // 2. Fortification income (Rule 68.2)
    const fortificationIncomeSD = FORTIFICATION_INCOME_PER_DAY[holding.fortificationTier] ?? 0;

    // 3. Resource patches (Rule 68.3) with seasonal penalty
    let resourceIncomeSD = 0;
    for (const patch of holding.resourcePatches) {
      const typeKey = (patch.type || '').toLowerCase().replace(/\s+/g, '_');
      const tierMap = RESOURCE_PATCH_SD_PER_DAY[typeKey];
      let dailyYield = tierMap ? (tierMap[patch.tier] ?? 0) : 0;

      // Winter 50% penalty on agricultural patches only
      if (isWinter && typeKey === 'grain_field') {
        dailyYield *= 0.5;
      }

      resourceIncomeSD += dailyYield;
    }

    // 4. Trade income
    const tradeIncomeSD = holding.tradeIncomePerDay;

    // 5. Food surplus (Rule 68.1) - also halved in winter for agricultural components
    let holdingFSU = HOLDING_FSU_PER_DAY[holding.holdingTier] ?? 0;
    if (isWinter) {
      holdingFSU *= 0.5;
    }

    const totalIncomeSD = holdingIncomeSD + fortificationIncomeSD + resourceIncomeSD + tradeIncomeSD;

    return {
      holdingIncomeSD,
      fortificationIncomeSD,
      resourceIncomeSD,
      tradeIncomeSD,
      totalIncomeSD,
      holdingFSU,
      seasonalPenaltyApplied: isWinter,
    };
  }

  /**
   * Calculates total production for a 7-day week tick.
   */
  public static calculateWeeklyProduction(holding: HoldingEconomy, isWinter: boolean): EconomyTickResult {
    const daily = ProductionService.calculateDailyProduction(holding, isWinter);
    return {
      holdingIncomeSD: daily.holdingIncomeSD * 7,
      fortificationIncomeSD: daily.fortificationIncomeSD * 7,
      resourceIncomeSD: daily.resourceIncomeSD * 7,
      tradeIncomeSD: daily.tradeIncomeSD * 7,
      totalIncomeSD: daily.totalIncomeSD * 7,
      holdingFSU: daily.holdingFSU * 7,
      seasonalPenaltyApplied: daily.seasonalPenaltyApplied,
    };
  }

  /**
   * Calculates total production for a full month (30 ticks/days).
   */
  public static calculateMonthlyProduction(holding: HoldingEconomy, isWinter: boolean): EconomyTickResult {
    const daily = ProductionService.calculateDailyProduction(holding, isWinter);
    return {
      holdingIncomeSD: daily.holdingIncomeSD * 30,
      fortificationIncomeSD: daily.fortificationIncomeSD * 30,
      resourceIncomeSD: daily.resourceIncomeSD * 30,
      tradeIncomeSD: daily.tradeIncomeSD * 30,
      totalIncomeSD: daily.totalIncomeSD * 30,
      holdingFSU: daily.holdingFSU * 30,
      seasonalPenaltyApplied: daily.seasonalPenaltyApplied,
    };
  }

  /**
   * Returns the weekly holding upkeep in SD for a given holding type.
   */
  public static getHoldingUpkeepPerWeek(holdingType: string): number {
    return HOLDING_UPKEEP_PER_WEEK[holdingType] ?? 0;
  }

  /**
   * Rounds weekly production totals to integers/decimals to avoid floating-point issues.
   */
  public static roundWeeklyProduction(totalSd: number, totalFsu: number): { roundedSd: number; roundedFsu: number } {
    return {
      roundedSd: Math.round(totalSd),
      roundedFsu: Math.round(totalFsu * 100) / 100
    };
  }
}

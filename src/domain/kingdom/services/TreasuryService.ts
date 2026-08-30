/** Minimum treasury threshold before Royal Tithe applies (Rule M18.3.C) */
export const ROYAL_TITHE_THRESHOLD = 2000;

/** Annual Royal Tithe tax rate on excess treasury (8% per year) */
export const ROYAL_TITHE_RATE = 0.08;

export interface ExpenseOutcome {
  expensesDeducted: number;
  unpaidExpenses: number;
  defaulted: boolean;
}

/**
 * TreasuryService
 * 
 * Reusable domain service for auditing finance states, checking capacity,
 * handling non-military weekly expense deductions, royal tithes, and default outcomes.
 * 
 * @rule holdings.tiers
 * @rule economy.weekly
 * @rule royal.tithe
 */
export class TreasuryService {
  /**
   * Calculates annual Royal Tithe / Wealth Friction (8%) on excess treasury > 2,000 SD.
   * If silverdew <= 2000, tithe is 0.
   */
  public static calculateRoyalTithe(silverdew: number): { titheAmount: number; remainingSilverdew: number } {
    if (silverdew <= ROYAL_TITHE_THRESHOLD) {
      return { titheAmount: 0, remainingSilverdew: silverdew };
    }
    const excess = silverdew - ROYAL_TITHE_THRESHOLD;
    const titheAmount = Math.floor(excess * ROYAL_TITHE_RATE);
    const remainingSilverdew = silverdew - titheAmount;
    return { titheAmount, remainingSilverdew };
  }

  /**
   * Deducts non-military expenses from a holding's treasury.
   * Emits structural details of the deduction.
   */
  public static deductExpenses(
    holdingState: { treasurySd: number },
    weeklyExpenses: number
  ): ExpenseOutcome {
    const expenses = Math.round(weeklyExpenses);
    if (expenses <= 0) {
      return { expensesDeducted: 0, unpaidExpenses: 0, defaulted: false };
    }

    if (holdingState.treasurySd >= expenses) {
      holdingState.treasurySd -= expenses;
      return { expensesDeducted: expenses, unpaidExpenses: 0, defaulted: false };
    } else {
      const expensesDeducted = holdingState.treasurySd;
      const unpaidExpenses = expenses - expensesDeducted;
      holdingState.treasurySd = 0;
      return { expensesDeducted, unpaidExpenses, defaulted: true };
    }
  }
}

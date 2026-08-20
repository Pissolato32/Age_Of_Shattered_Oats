export interface ExpenseOutcome {
  expensesDeducted: number;
  unpaidExpenses: number;
  defaulted: boolean;
}

/**
 * TreasuryService
 * 
 * Reusable domain service for auditing finance states, checking capacity,
 * and handling non-military weekly expense deductions and default outcomes.
 * 
 * @rule holdings.tiers
 * @rule economy.weekly
 */
export class TreasuryService {
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

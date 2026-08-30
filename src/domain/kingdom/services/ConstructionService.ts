export interface ConstructionRefundResult {
  refundSd: number;
  refundTimber: number;
  refundStone: number;
}

export interface PRNGProvider {
  nextInt(min: number, max: number): number;
}

export type ResourcePatchQuality = 'Common' | 'High-Grade' | 'Superb';

/**
 * ConstructionService
 * 
 * Reusable pure domain service for construction refund calculations
 * and resolving patch quality outcomes upon construction completion.
 * 
 * @rule holdings.buildings
 * @rule holdings.patches
 */
export class ConstructionService {
  /**
   * Calculates the 50% resource refund for a cancelled construction project.
   */
  public static calculateRefund(costSd: number, costTimber: number, costStone: number): ConstructionRefundResult {
    return {
      refundSd: Math.floor((costSd || 0) * 0.5),
      refundTimber: Math.floor((costTimber || 0) * 0.5),
      refundStone: Math.floor((costStone || 0) * 0.5),
    };
  }

  /**
   * Resolves the quality of a resource patch upon completion based on a 1d6 roll using an injected PRNG.
   * Rule G.3: 1-3 = Common, 4-5 = High-Grade, 6 = Superb.
   */
  public static resolvePatchQuality(prng: PRNGProvider): ResourcePatchQuality {
    const roll = prng.nextInt(1, 6);
    if (roll === 4 || roll === 5) {
      return 'High-Grade';
    } else if (roll === 6) {
      return 'Superb';
    }
    return 'Common';
  }

  /**
   * Instance method wrapper for backward compatibility with legacy OOP call sites.
   */
  public calculateRefund(costSd: number, costTimber: number, costStone: number): ConstructionRefundResult {
    return ConstructionService.calculateRefund(costSd, costTimber, costStone);
  }

  /**
   * Instance method wrapper for backward compatibility with legacy OOP call sites.
   */
  public resolvePatchQuality(prng: PRNGProvider): ResourcePatchQuality {
    return ConstructionService.resolvePatchQuality(prng);
  }
}

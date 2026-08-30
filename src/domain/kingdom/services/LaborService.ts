/**
 * LaborService
 * 
 * Reusable domain service for calculating civilian labor capacity,
 * labor allocation from resource patches, and validation of available workforce.
 * 
 * @rule holdings.patches
 * @rule holdings.buildings
 */
export class LaborService {
  /**
   * Calculates the total labor pool of a holding (40% of civilian population).
   */
  public static calculateLaborPool(population: number): number {
    return Math.floor(population * 0.40);
  }

  /**
   * Calculates the total labor currently allocated to resource patches.
   */
  public static calculateAllocatedLabor(patches: { laborAllocated?: number; laborRequired?: number }[]): number {
    return patches.reduce((sum, p) => sum + (p.laborAllocated || p.laborRequired || 0), 0);
  }

  /**
   * Calculates the unallocated labor capacity remaining in the holding.
   */
  public static calculateAvailableLabor(population: number, patches: { laborAllocated?: number; laborRequired?: number }[]): number {
    const totalPool = LaborService.calculateLaborPool(population);
    const allocated = LaborService.calculateAllocatedLabor(patches);
    return Math.max(0, totalPool - allocated);
  }

  /**
   * Validates if the holding has enough unallocated labor for a required amount.
   * Throws an error if requirements are not met.
   */
  public static validateLaborAvailability(
    population: number,
    patches: { laborAllocated?: number }[],
    requiredLabor: number
  ): void {
    const available = LaborService.calculateAvailableLabor(population, patches);
    if (available < requiredLabor) {
      throw new Error(
        `Insufficient labor capacity: Requires ${requiredLabor} labor. Available: ${available} (Total Pool: ${LaborService.calculateLaborPool(population)}, Allocated: ${LaborService.calculateAllocatedLabor(patches)})`
      );
    }
  }
}

/**
 * BreedingService
 * 
 * Reusable domain service for calculating breeding success rates,
 * applying regional penalties, and capital breeding penalties.
 * 
 * @rule military.breeding
 */
export class BreedingService {
  /**
   * Calculates the final breeding success rate for a mount type based on spec, region, and holding tier.
   */
  public static calculateSuccessRate(
    baseSuccessRate: number,
    primaryRegion: string | undefined,
    mountId: string,
    location: string,
    holdingTier: number
  ): number {
    let successRate = baseSuccessRate;

    const regionName = BreedingService.normalizeRegionName(location);

    if (primaryRegion && 
        primaryRegion !== 'Any settled region' && 
        primaryRegion !== 'Any (bred in war)' && 
        primaryRegion !== 'Great Lords, Capitals') {
      const allowed = primaryRegion.split(',').map((s: string) => s.trim().toLowerCase());
      if (!allowed.includes(regionName) && !allowed.some(a => regionName.includes(a))) {
        // Apply non-native breeding success penalty (-25% success chance)
        successRate = Math.max(0.10, successRate - 0.25);
      }
    }

    if (mountId === 'destrier' && holdingTier < 5) {
      // Capital breed penalty if bred in smaller holdings (-20% success chance)
      successRate = Math.max(0.10, successRate - 0.20);
    }

    // Round successRate to 2 decimal places
    return Math.round(successRate * 100) / 100;
  }

  /**
   * Normalizes region names for regional suitability checking.
   */
  public static normalizeRegionName(location: string): string {
    const r = (location || '').toLowerCase().trim();
    if (r.includes('montanha') || r.includes('mountain') || r === 'valenfort') return 'southern mountains';
    if (r.includes('rio') || r.includes('river')) return 'western rivers';
    if (r.includes('estepe') || r.includes('steppe')) return 'nomad steppe';
    if (r.includes('planalto') || r.includes('plain')) return 'central plains';
    return r;
  }

  // Instance method wrappers for legacy OOP compatibility
  public calculateSuccessRate(
    baseSuccessRate: number,
    primaryRegion: string | undefined,
    mountId: string,
    location: string,
    holdingTier: number
  ): number {
    return BreedingService.calculateSuccessRate(baseSuccessRate, primaryRegion, mountId, location, holdingTier);
  }

  public normalizeRegionName(location: string): string {
    return BreedingService.normalizeRegionName(location);
  }
}

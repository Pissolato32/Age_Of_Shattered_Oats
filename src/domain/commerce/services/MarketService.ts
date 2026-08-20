export const MONTH_SEASONS = [
  "Inverno",    // Month 1 (Frostwane)
  "Inverno",    // Month 2 (Deepfrost)
  "Primavera",  // Month 3 (Thawrise)
  "Primavera",  // Month 4 (Greening)
  "Verão",      // Month 5 (Highsun_1)
  "Verão",      // Month 6 (Highsun_2)
  "Outono",     // Month 7 (Harvestfall_1)
  "Outono",     // Month 8 (Harvestfall_2)
  "Outono",     // Month 9 (Ashfall_1)
  "Outono",     // Month 10 (Ashfall_2)
  "Inverno",    // Month 11 (Longdark_1)
  "Inverno"     // Month 12 (Longdark_2)
];

export const REGIONAL_DEMAND_MODIFIERS: Record<string, Record<string, number>> = {
  northern_snowlands: { grain: 1.0, timber: 0.75, iron: 0.50, medicine: 1.0, furs: -0.25, silver: -0.20 },
  nomad_steppe_north: { grain: 1.5, iron: 1.0, timber: 1.0, weapons: 2.0, horses: -0.25, leather: -0.20 },
  nomad_steppe_south: { grain: 1.0, iron: 0.75, wine: 0.50, horses: -0.20, leather: -0.15, wool: -0.10 },
  western_rivers_north: { grain: 0.5, iron: 0.5, timber: 0.25, furs: 0.5, fish: -0.20, salt: -0.15 },
  western_rivers_south: { grain: 0.25, iron: 0.25, wine: 0.75, fish: -0.15, salt: -0.10 },
  eastern_forests_north: { grain: 1.0, iron: 0.75, salt: 0.50, medicine: 0.75, furs: -0.25, timber: -0.20, herbs: -0.15 },
  eastern_forests_south: { grain: 0.5, iron: 0.5, wine: 0.50, timber: -0.15, herbs: -0.10 },
  central_plains: { iron: 0.5, stone: 0.25, furs: 0.5, grain: -0.20, wool: -0.10 },
  southern_mountains: { grain: 1.5, timber: 1.0, furs: 0.75, wine: 0.75, iron: -0.20, stone: -0.20, silver: -0.15 }
};

export interface MarketPriceResult {
  basePrice: number;
  finalPrice: number;
  demandMultiplier: number;
  seasonalModifier: number;
  saturationModifier: number;
}

/**
 * MarketService
 * 
 * Pure domain service for calculating trade commodity prices,
 * demand modifiers, seasonal modifiers, and market saturation levels.
 * 
 * @rule economy.weekly
 * @rule items.materials
 */
export class MarketService {
  /**
   * Calculates the current price of a commodity/material in a market.
   */
  public calculatePrice(
    basePrice: number,
    materialId: string,
    regionId: string,
    monthNumber: number,
    stock = 0,
    marketCapacity = 150
  ): MarketPriceResult {
    let cleanRegionId = regionId.toLowerCase().replace(/\s+/g, '_');
    if (!REGIONAL_DEMAND_MODIFIERS[cleanRegionId]) {
      if (cleanRegionId === 'nomad_steppe') cleanRegionId = 'nomad_steppe_north';
      else if (cleanRegionId === 'western_rivers') cleanRegionId = 'western_rivers_north';
      else if (cleanRegionId === 'eastern_forests') cleanRegionId = 'eastern_forests_north';
    }

    const regionalDemands = REGIONAL_DEMAND_MODIFIERS[cleanRegionId] || {};
    const safeMonthIndex = Math.max(0, Math.min(11, (monthNumber - 1 + 12) % 12));
    const seasonRaw = MONTH_SEASONS[safeMonthIndex] || '';
    const season = seasonRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 1. Regional demand multiplier from codex
    const demandMod = regionalDemands[materialId] || 0;
    const demandMultiplier = 1 + demandMod;

    // 2. Seasonal modifiers
    let seasonalModifier = 0;
    if (season === 'inverno') {
      if (['grain', 'fish', 'vegetables'].includes(materialId)) {
        seasonalModifier = 0.5; // +50% winter scarcity for staples
      } else if (['furs', 'wool'].includes(materialId)) {
        seasonalModifier = 0.25; // +25% winter demand for warm materials
      }
    } else if (season === 'verao' || season === 'primavera') {
      if (['grain', 'fish', 'vegetables'].includes(materialId)) {
        seasonalModifier = -0.2; // -20% spring/summer crop abundance
      }
    }

    // 3. Saturation modifiers
    const ratio = stock / marketCapacity;
    let saturationModifier = 1.0;

    if (ratio <= 0.25) {
      saturationModifier = 1.1; // Scarcity bonus
    } else if (ratio <= 0.50) {
      saturationModifier = 1.0; // Normal
    } else if (ratio <= 0.75) {
      saturationModifier = 0.8;
    } else if (ratio <= 1.00) {
      saturationModifier = 0.6;
    } else {
      saturationModifier = 0.4; // Market glut
    }

    // Complete formula: Final Price = Base Price x (Demand Multiplier + Seasonal) x Saturation Multiplier
    let finalPrice = basePrice * (demandMultiplier + seasonalModifier) * saturationModifier;
    // Round to 2 decimal places and ensure minimum price is 0.1 SD
    finalPrice = Math.max(0.1, Math.round(finalPrice * 100) / 100);

    return {
      basePrice,
      finalPrice,
      demandMultiplier,
      seasonalModifier,
      saturationModifier,
    };
  }
}

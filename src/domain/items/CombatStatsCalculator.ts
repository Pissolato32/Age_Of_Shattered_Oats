import { Character } from '../../types';
import { ARMOR_SPECS, SHIELD_SPECS, MOUNT_SPECS, ArmorItemSpec, ShieldItemSpec, MountItemSpec } from '../../data';

export interface CombatStatsResult {
  ac: number;
  initiativeBonus: number;
}

/**
 * CombatStatsCalculator dynamically calculates derived combat stats based on equipment.
 * 
 * @rule items.armor
 * @rule items.shields
 * @rule military.mounts
 */
export class CombatStatsCalculator {
  /**
   * Calculates dynamic Armor Class.
   * AC = Armor AC (default 2 for cloth/unarmored) + Shield AC Mod (default 0)
   */
  public static calculateAC(
    char: { stats: Partial<Character['stats']> },
    armorCatalog: Record<string, ArmorItemSpec> = ARMOR_SPECS,
    shieldCatalog: Record<string, ShieldItemSpec> = SHIELD_SPECS
  ): number {
    let baseAC = 2; // Cloth / unarmored default
    const armorId = char.stats?.armor?.toLowerCase();
    if (armorId && armorCatalog[armorId]) {
      baseAC = armorCatalog[armorId].armorClass;
    }

    let shieldACMod = 0;
    const shieldId = char.stats?.shield?.toLowerCase();
    if (shieldId && shieldCatalog[shieldId]) {
      shieldACMod = shieldCatalog[shieldId].armorClassMod;
    }

    return baseAC + shieldACMod;
  }

  /**
   * Calculates dynamic Initiative.
   * Initiative = Base Initiative (default 0) + Armor Initiative Mod (default +1 for cloth)
   *            + Shield Initiative Mod (default 0) + Mount Initiative Mod (default 0)
   *            - Mount Injury Penalty (-1 if injured)
   */
  public static calculateInitiative(
    char: { stats: Partial<Character['stats']> },
    armorCatalog: Record<string, ArmorItemSpec> = ARMOR_SPECS,
    shieldCatalog: Record<string, ShieldItemSpec> = SHIELD_SPECS,
    mountCatalog: Record<string, MountItemSpec> = MOUNT_SPECS
  ): number {
    let initiative = typeof char.stats?.baseInitiative === 'number' ? char.stats.baseInitiative : 0;

    const armorId = char.stats?.armor?.toLowerCase();
    if (armorId && armorCatalog[armorId]) {
      initiative += armorCatalog[armorId].initiativeMod;
    } else {
      // In PDF rules, no armor (cloth) gives +1 initiative bonus
      initiative += 1;
    }

    const shieldId = char.stats?.shield?.toLowerCase();
    if (shieldId && shieldCatalog[shieldId]) {
      initiative += shieldCatalog[shieldId].initiativeMod;
    }

    const mountId = char.stats?.mount?.toLowerCase();
    if (mountId && mountCatalog[mountId]) {
      initiative += mountCatalog[mountId].initiativeMod;
      if (char.stats?.mountInjured === true) {
        initiative -= 1; // Injury penalty
      }
    } else if (mountId && typeof char.stats?.mountInitiativeMod === 'number') {
      initiative += char.stats.mountInitiativeMod;
      if (char.stats?.mountInjured === true) {
        initiative -= 1;
      }
    }

    return initiative;
  }

  /**
   * Calculates both dynamic AC and Initiative for a character.
   */
  public static calculateStats(char: { stats: Partial<Character['stats']> }): CombatStatsResult {
    return {
      ac: CombatStatsCalculator.calculateAC(char),
      initiativeBonus: CombatStatsCalculator.calculateInitiative(char)
    };
  }
}

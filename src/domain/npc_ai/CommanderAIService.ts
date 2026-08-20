export type CombatTactic = 'Charge' | 'Attack' | 'Defend' | 'Traps' | 'Rearguard' | 'Retreat';

export interface CombatContext {
  hpPercent: number;
  morale: number;
  isOutnumbered: boolean;
  isHalfStrength: boolean;
  isAllyRetreating: boolean;
  terrainAdvantage: boolean;
  fearTriggered: boolean;
}

export interface CommanderProfile {
  temperament: 'Aggressive' | 'Disciplined' | 'Cunning' | 'Loyal' | 'Proud' | 'Wary';
  priority: 'Glory' | 'Survival' | 'Victory' | 'Orders';
  fear: 'Fire' | 'Cavalry' | 'Encirclement' | 'Loss' | 'Darkness';
}

export class CommanderAIService {
  /**
   * Resolves the tactical decision command for an NPC commander in combat.
   */
  public selectCombatTactic(context: CombatContext, profile: CommanderProfile): CombatTactic {
    // 1. Fear and Morale Triggers (Critical Check)
    if (context.morale <= 25) {
      if (profile.temperament === 'Proud') {
        // Proud leaders resist retreating until absolutely critical
        return context.morale <= 10 ? 'Retreat' : 'Defend';
      }
      return 'Retreat';
    }

    if (context.fearTriggered) {
      if (profile.fear === 'Encirclement' && context.isOutnumbered) {
        return 'Retreat';
      }
      if (profile.fear === 'Loss' && context.isAllyRetreating) {
        return 'Retreat';
      }
      // General panic reaction
      if (context.morale <= 40) {
        return 'Retreat';
      }
    }

    // 2. Critical situational defaults
    if (context.isHalfStrength && context.isAllyRetreating && profile.temperament !== 'Proud') {
      return 'Retreat';
    }

    // 3. Temperament-based strategies
    switch (profile.temperament) {
      case 'Aggressive':
        if (context.isOutnumbered && !context.terrainAdvantage) {
          return 'Attack'; // Attack instead of pure charge
        }
        return 'Charge';

      case 'Disciplined':
        if (profile.priority === 'Orders') {
          return 'Defend'; // Holds defensive formation matching plan
        }
        return 'Defend';

      case 'Cunning':
        if (context.terrainAdvantage) {
          return 'Traps';
        }
        return 'Attack';

      case 'Loyal':
        if (context.isAllyRetreating) {
          return 'Retreat';
        }
        return 'Attack'; // Mirrors general offensive stance

      case 'Proud':
        if (context.isOutnumbered) {
          return 'Charge'; // Proudly charges ahead regardless of odds
        }
        return 'Attack';

      case 'Wary':
        if (context.isOutnumbered || context.isHalfStrength) {
          return 'Rearguard';
        }
        return 'Defend';

      default:
        return 'Defend';
    }
  }
}

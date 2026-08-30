import { EventOpportunity } from './EventOpportunityEngine';

export interface RecentEventSummary {
  readonly eventType: string;
  readonly turnRegistered: number;
  readonly locationId?: string;
}

export const DEFAULT_EVENT_COOLDOWNS: Readonly<Record<string, number>> = {
  WILD_ANIMAL_ENCOUNTER: 12,
  TRAVEL_ROAD_ACCIDENT: 4,
  TRAVEL_WEATHER_DELAY: 3,
  BUILD_WORKPLACE_INJURY: 6,
  BUILD_MATERIAL_SHORTAGE: 8,
  TRADE_OPPORTUNISTIC_MERCHANT: 4,
  DIPLOMACY_TENSION_INCIDENT: 6,
  FRONTIER_TRACKS_DISCOVERED: 8,
  FAMINE_UNREST_RUMOR: 4,
  ATMOSPHERIC_FLAVOR_RAVEN: 3,
  ATMOSPHERIC_FLAVOR_COLD_WIND: 3
};

/**
 * CooldownPolicy
 * 
 * Pure domain policy responsible for evaluating and enforcing cooldown windows
 * and anti-spam constraints on candidate EventOpportunities before selection.
 */
export class CooldownPolicy {
  /**
   * Calculates the remaining cooldown turns for an eventType given the currentTurn
   * and the list of recent events.
   */
  public static getRemainingCooldown(
    eventType: string,
    currentTurn: number,
    recentEvents: readonly RecentEventSummary[] = [],
    customCooldowns?: Readonly<Record<string, number>>
  ): number {
    const configuredCooldown = customCooldowns?.[eventType] ?? DEFAULT_EVENT_COOLDOWNS[eventType] ?? 0;
    if (configuredCooldown <= 0) {
      return 0;
    }

    // Encontrar a última ocorrência do eventType
    let lastTurn = -1;
    for (const ev of recentEvents) {
      if (ev.eventType === eventType && ev.turnRegistered > lastTurn) {
        lastTurn = ev.turnRegistered;
      }
    }

    if (lastTurn < 0) {
      return 0;
    }

    const turnsSince = currentTurn - lastTurn;
    const remaining = configuredCooldown - turnsSince;
    return Math.max(0, remaining);
  }

  /**
   * Filters an array of EventOpportunity candidates, removing any opportunity
   * currently in cooldown.
   */
  public static filterAvailableOpportunities(
    opportunities: readonly EventOpportunity[],
    currentTurn: number,
    recentEvents: readonly RecentEventSummary[] = [],
    customCooldowns?: Readonly<Record<string, number>>
  ): EventOpportunity[] {
    return opportunities
      .filter(opp => opp.eligible && opp.weight > 0)
      .filter(opp => {
        const remaining = this.getRemainingCooldown(opp.eventType, currentTurn, recentEvents, customCooldowns);
        return remaining <= 0;
      });
  }
}

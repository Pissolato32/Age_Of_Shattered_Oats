/**
 * MEM-002 — WorldFactDeriver
 *
 * Deterministically derives WorldFacts from CampaignState.
 * WorldFacts are read-only snapshots — never written directly, always derived.
 */

import type {
  WorldFact,
  WorldCategory,
  StateValue,
} from './contracts';

let factIdCounter = 0;

function generateFactId(category: string, subjectId: string): string {
  return `fact_${category}_${subjectId}_${++factIdCounter}`;
}

/**
 * Reset the fact ID counter (for testing).
 */
export function resetFactIdCounter(): void {
  factIdCounter = 0;
}

/**
 * Derive WorldFacts from a CampaignState snapshot.
 * This is a pure function — given the same state, it returns the same facts.
 */
export function deriveWorldFacts(state: {
  character?: {
    name?: string;
    house?: string;
    men?: number;
    supplies?: number;
    food?: number;
    silverdew?: number;
    reputation?: number;
  };
  worldLedger?: {
    nobleHouses?: Array<{
      id: string;
      name: string;
      opinion: number;
      isAlly?: boolean;
      isEnemy?: boolean;
    }>;
    territories?: Array<{
      id: string;
      name: string;
      controlledBy?: string;
      hasFortification?: boolean;
    }>;
    currentDate?: {
      year: number;
      month: number;
      week: number;
    };
  };
  weeklyLedger?: {
    food: number;
    silverdew: number;
  };
  worldSecrets?: Array<{
    id: string;
    title: string;
    revealed?: boolean;
  }>;
}, currentTurn: number): readonly WorldFact[] {
  const facts: WorldFact[] = [];

  // Character facts
  if (state.character) {
    if (state.character.name) {
      facts.push(createFact('CHARACTER', 'player', 'name', state.character.name, currentTurn));
    }
    if (state.character.house) {
      facts.push(createFact('CHARACTER', 'player', 'house', state.character.house, currentTurn));
    }
    if (state.character.men !== undefined) {
      facts.push(createFact('ARMY', 'player', 'men_count', state.character.men, currentTurn));
    }
    if (state.character.supplies !== undefined) {
      facts.push(createFact('RESOURCE', 'player', 'supplies', state.character.supplies, currentTurn));
    }
    if (state.character.food !== undefined) {
      facts.push(createFact('RESOURCE', 'player', 'food', state.character.food, currentTurn));
    }
    if (state.character.silverdew !== undefined) {
      facts.push(createFact('ECONOMIC', 'player', 'silverdew', state.character.silverdew, currentTurn));
    }
    if (state.character.reputation !== undefined) {
      facts.push(createFact('SOCIAL', 'player', 'reputation', state.character.reputation, currentTurn));
    }
  }

  // Noble houses
  if (state.worldLedger?.nobleHouses) {
    for (const house of state.worldLedger.nobleHouses) {
      facts.push(createFact('FACTION', house.id, 'name', house.name, currentTurn));
      facts.push(createFact('RELATIONSHIP', `player_${house.id}`, 'opinion', house.opinion, currentTurn));
      if (house.isAlly !== undefined) {
        facts.push(createFact('RELATIONSHIP', `player_${house.id}`, 'is_ally', house.isAlly, currentTurn));
      }
      if (house.isEnemy !== undefined) {
        facts.push(createFact('RELATIONSHIP', `player_${house.id}`, 'is_enemy', house.isEnemy, currentTurn));
      }
    }
  }

  // Territories
  if (state.worldLedger?.territories) {
    for (const territory of state.worldLedger.territories) {
      facts.push(createFact('LOCATION', territory.id, 'name', territory.name, currentTurn));
      if (territory.controlledBy) {
        facts.push(createFact('LOCATION', territory.id, 'controlled_by', territory.controlledBy, currentTurn));
      }
      if (territory.hasFortification !== undefined) {
        facts.push(createFact('STRUCTURE', territory.id, 'has_fortification', territory.hasFortification, currentTurn));
      }
    }
  }

  // Date
  if (state.worldLedger?.currentDate) {
    const { year, month, week } = state.worldLedger.currentDate;
    facts.push(createFact('POLITICAL', 'world', 'current_year', year, currentTurn));
    facts.push(createFact('POLITICAL', 'world', 'current_month', month, currentTurn));
    facts.push(createFact('POLITICAL', 'world', 'current_week', week, currentTurn));
  }

  // Weekly resources
  if (state.weeklyLedger) {
    facts.push(createFact('RESOURCE', 'world', 'weekly_food', state.weeklyLedger.food, currentTurn));
    facts.push(createFact('ECONOMIC', 'world', 'weekly_silverdew', state.weeklyLedger.silverdew, currentTurn));
  }

  return facts;
}

function createFact(
  category: WorldCategory,
  subjectId: string,
  predicate: string,
  value: StateValue,
  currentTurn: number,
): WorldFact {
  return {
    factId: generateFactId(category, subjectId),
    category,
    subjectId,
    predicate,
    value,
    source: 'ENGINE',
    certainty: 'CONFIRMED',
    validFromTurn: currentTurn,
  };
}

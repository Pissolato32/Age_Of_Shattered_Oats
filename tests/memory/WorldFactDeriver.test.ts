/**
 * MEM-002 — WorldFactDeriver Tests
 */

import { describe, it, expect } from 'vitest';
import { deriveWorldFacts, resetFactIdCounter } from '../../src/memory/WorldFactDeriver';

describe('WorldFactDeriver', () => {
  it('should derive character facts', () => {
    resetFactIdCounter();

    const state = {
      character: {
        name: 'Aldric',
        house: 'Stormborn',
        men: 100,
        supplies: 500,
        food: 200,
        silverdew: 1000,
        reputation: 7,
      },
    };

    const facts = deriveWorldFacts(state, 1);

    expect(facts.length).toBeGreaterThanOrEqual(7);

    const nameFact = facts.find(f => f.predicate === 'name');
    expect(nameFact).toBeDefined();
    expect(nameFact!.category).toBe('CHARACTER');
    expect(nameFact!.value).toBe('Aldric');
    expect(nameFact!.source).toBe('ENGINE');
    expect(nameFact!.certainty).toBe('CONFIRMED');

    const menFact = facts.find(f => f.predicate === 'men_count');
    expect(menFact).toBeDefined();
    expect(menFact!.category).toBe('ARMY');
    expect(menFact!.value).toBe(100);
  });

  it('should derive noble house facts', () => {
    resetFactIdCounter();

    const state = {
      worldLedger: {
        nobleHouses: [
          { id: 'house_1', name: 'Stormborn', opinion: 5, isAlly: true, isEnemy: false },
          { id: 'house_2', name: 'Ironhold', opinion: -3, isAlly: false, isEnemy: true },
        ],
      },
    };

    const facts = deriveWorldFacts(state, 1);

    const opinionFact = facts.find(f => f.predicate === 'opinion' && f.subjectId === 'player_house_1');
    expect(opinionFact).toBeDefined();
    expect(opinionFact!.category).toBe('RELATIONSHIP');
    expect(opinionFact!.value).toBe(5);

    const allyFact = facts.find(f => f.predicate === 'is_ally' && f.subjectId === 'player_house_1');
    expect(allyFact).toBeDefined();
    expect(allyFact!.value).toBe(true);
  });

  it('should derive territory facts', () => {
    resetFactIdCounter();

    const state = {
      worldLedger: {
        territories: [
          { id: 'terr_1', name: 'Iron Keep', controlledBy: 'house_1', hasFortification: true },
        ],
      },
    };

    const facts = deriveWorldFacts(state, 1);

    const nameFact = facts.find(f => f.predicate === 'name' && f.subjectId === 'terr_1');
    expect(nameFact).toBeDefined();
    expect(nameFact!.category).toBe('LOCATION');
    expect(nameFact!.value).toBe('Iron Keep');

    const controlFact = facts.find(f => f.predicate === 'controlled_by' && f.subjectId === 'terr_1');
    expect(controlFact).toBeDefined();
    expect(controlFact!.value).toBe('house_1');
  });

  it('should derive date facts', () => {
    resetFactIdCounter();

    const state = {
      worldLedger: {
        currentDate: { year: 1247, month: 3, week: 2 },
      },
    };

    const facts = deriveWorldFacts(state, 1);

    const yearFact = facts.find(f => f.predicate === 'current_year');
    expect(yearFact).toBeDefined();
    expect(yearFact!.category).toBe('POLITICAL');
    expect(yearFact!.value).toBe(1247);
  });

  it('should derive weekly resource facts', () => {
    resetFactIdCounter();

    const state = {
      weeklyLedger: { food: 150, silverdew: 800 },
    };

    const facts = deriveWorldFacts(state, 1);

    const foodFact = facts.find(f => f.predicate === 'weekly_food');
    expect(foodFact).toBeDefined();
    expect(foodFact!.category).toBe('RESOURCE');
    expect(foodFact!.value).toBe(150);
  });

  it('should produce deterministic facts from same state', () => {
    const state = {
      character: { name: 'Aldric', house: 'Stormborn' },
    };

    const facts1 = deriveWorldFacts(state, 1);
    resetFactIdCounter();
    const facts2 = deriveWorldFacts(state, 1);

    // Same structure (IDs may differ due to counter)
    expect(facts1.length).toBe(facts2.length);
    expect(facts1.map(f => f.predicate)).toEqual(facts2.map(f => f.predicate));
    expect(facts1.map(f => f.value)).toEqual(facts2.map(f => f.value));
  });

  it('should handle empty state', () => {
    resetFactIdCounter();
    const facts = deriveWorldFacts({}, 1);
    expect(facts).toHaveLength(0);
  });

  it('should include validFromTurn', () => {
    resetFactIdCounter();

    const state = {
      character: { name: 'Aldric' },
    };

    const facts = deriveWorldFacts(state, 5);
    expect(facts[0].validFromTurn).toBe(5);
  });
});

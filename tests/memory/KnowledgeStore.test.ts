/**
 * MEM-002 — KnowledgeStore Tests
 */

import { describe, it, expect } from 'vitest';
import { KnowledgeStore, createKnowledgeStoreFromRecords } from '../../src/memory/KnowledgeStore';

describe('KnowledgeStore', () => {
  it('should add knowledge records', () => {
    const store = new KnowledgeStore();

    const record = store.add({
      agentId: 'player',
      factId: 'fact_1',
      value: 'test_value',
      source: 'DIRECT_OBSERVATION',
      certainty: 'CONFIRMED',
      obtainedTurn: 1,
      lastVerifiedTurn: 1,
      visibility: 'PUBLIC',
    });

    expect(record.id).toBeDefined();
    expect(record.agentId).toBe('player');
    expect(record.factId).toBe('fact_1');
    expect(record.value).toBe('test_value');
    expect(store.size()).toBe(1);
  });

  it('should retrieve by agent', () => {
    const store = new KnowledgeStore();

    store.add({ agentId: 'player', factId: 'a', value: 1, source: 'DIRECT_OBSERVATION', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PUBLIC' });
    store.add({ agentId: 'npc_1', factId: 'b', value: 2, source: 'ENGINE_REPORT', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PRIVATE' });
    store.add({ agentId: 'player', factId: 'c', value: 3, source: 'DIRECT_OBSERVATION', certainty: 'UNCERTAIN', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PUBLIC' });

    const playerKnowledge = store.getByAgent('player');
    expect(playerKnowledge).toHaveLength(2);
  });

  it('should retrieve by fact', () => {
    const store = new KnowledgeStore();

    store.add({ agentId: 'player', factId: 'fact_1', value: 'a', source: 'DIRECT_OBSERVATION', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PUBLIC' });
    store.add({ agentId: 'npc_1', factId: 'fact_1', value: 'b', source: 'ENGINE_REPORT', certainty: 'UNCERTAIN', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PRIVATE' });
    store.add({ agentId: 'player', factId: 'fact_2', value: 'c', source: 'DIRECT_OBSERVATION', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PUBLIC' });

    const fact1Knowledge = store.getByFact('fact_1');
    expect(fact1Knowledge).toHaveLength(2);
  });

  it('should get current knowledge', () => {
    const store = new KnowledgeStore();

    const original = store.add({
      agentId: 'player',
      factId: 'fact_1',
      value: 'old_value',
      source: 'DIRECT_OBSERVATION',
      certainty: 'CONFIRMED',
      obtainedTurn: 1,
      lastVerifiedTurn: 1,
      visibility: 'PUBLIC',
    });

    store.supersedes({
      agentId: 'player',
      factId: 'fact_1',
      value: 'new_value',
      source: 'ENGINE_REPORT',
      certainty: 'CONFIRMED',
      obtainedTurn: 2,
      lastVerifiedTurn: 2,
      visibility: 'PUBLIC',
    }, original.id);

    const current = store.getCorrente('player', 'fact_1');
    expect(current).toBeDefined();
    expect(current!.value).toBe('new_value');
    expect(current!.supersedes).toBe(original.id);
  });

  it('should supersede records', () => {
    const store = new KnowledgeStore();

    const original = store.add({
      agentId: 'player',
      factId: 'fact_1',
      value: 'old_value',
      source: 'DIRECT_OBSERVATION',
      certainty: 'CONFIRMED',
      obtainedTurn: 1,
      lastVerifiedTurn: 1,
      visibility: 'PUBLIC',
    });

    const superseded = store.supersedes({
      agentId: 'player',
      factId: 'fact_1',
      value: 'new_value',
      source: 'ENGINE_REPORT',
      certainty: 'UNCERTAIN',
      obtainedTurn: 2,
      lastVerifiedTurn: 2,
      visibility: 'PRIVATE',
    }, original.id);

    expect(superseded.supersedes).toBe(original.id);
    expect(superseded.value).toBe('new_value');
    expect(store.size()).toBe(2);
  });

  it('should throw when superseding non-existent record', () => {
    const store = new KnowledgeStore();

    expect(() => store.supersedes({
      agentId: 'player',
      factId: 'fact_1',
      value: 'test',
      source: 'DIRECT_OBSERVATION',
      certainty: 'CONFIRMED',
      obtainedTurn: 1,
      lastVerifiedTurn: 1,
      visibility: 'PUBLIC',
    }, 'non_existent_id')).toThrow('Knowledge record non_existent_id not found');
  });

  it('should throw when superseding with mismatched agent/fact', () => {
    const store = new KnowledgeStore();

    const original = store.add({
      agentId: 'player',
      factId: 'fact_1',
      value: 'old_value',
      source: 'DIRECT_OBSERVATION',
      certainty: 'CONFIRMED',
      obtainedTurn: 1,
      lastVerifiedTurn: 1,
      visibility: 'PUBLIC',
    });

    expect(() => store.supersedes({
      agentId: 'npc_1',
      factId: 'fact_2',
      value: 'test',
      source: 'DIRECT_OBSERVATION',
      certainty: 'CONFIRMED',
      obtainedTurn: 1,
      lastVerifiedTurn: 1,
      visibility: 'PUBLIC',
    }, original.id)).toThrow('matching agentId and factId');
  });

  it('should build chain of supersessions', () => {
    const store = new KnowledgeStore();

    const v1 = store.add({
      agentId: 'player',
      factId: 'fact_1',
      value: 'v1',
      source: 'DIRECT_OBSERVATION',
      certainty: 'CONFIRMED',
      obtainedTurn: 1,
      lastVerifiedTurn: 1,
      visibility: 'PUBLIC',
    });

    const v2 = store.supersedes({
      agentId: 'player',
      factId: 'fact_1',
      value: 'v2',
      source: 'ENGINE_REPORT',
      certainty: 'UNCERTAIN',
      obtainedTurn: 2,
      lastVerifiedTurn: 2,
      visibility: 'PUBLIC',
    }, v1.id);

    const v3 = store.supersedes({
      agentId: 'player',
      factId: 'fact_1',
      value: 'v3',
      source: 'NPC_REPORT',
      certainty: 'INFERRED',
      obtainedTurn: 3,
      lastVerifiedTurn: 3,
      visibility: 'PRIVATE',
    }, v2.id);

    const chain = store.getChain('fact_1', 'player');
    expect(chain).toHaveLength(3);
    expect(chain[0].value).toBe('v1');
    expect(chain[1].value).toBe('v2');
    expect(chain[2].value).toBe('v3');
  });

  it('should create from existing records', () => {
    const original = new KnowledgeStore();
    original.add({ agentId: 'player', factId: 'a', value: 1, source: 'DIRECT_OBSERVATION', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PUBLIC' });
    original.add({ agentId: 'npc_1', factId: 'b', value: 2, source: 'ENGINE_REPORT', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PRIVATE' });

    const records = original.toArray();
    const restored = createKnowledgeStoreFromRecords(records);

    expect(restored.size()).toBe(2);
  });
});

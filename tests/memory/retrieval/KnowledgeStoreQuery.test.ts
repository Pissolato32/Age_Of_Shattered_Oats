/**
 * MEM-004 — KnowledgeStore Query Tests
 */

import { describe, it, expect } from 'vitest';
import { KnowledgeStore } from '../../../src/memory/KnowledgeStore';

describe('KnowledgeStore queries', () => {
  it('should query by agent and subject', () => {
    const store = new KnowledgeStore();
    store.add({ agentId: 'player', factId: 'fact_1', value: 'a', source: 'DIRECT_OBSERVATION', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PUBLIC' });
    store.add({ agentId: 'player', factId: 'fact_2', value: 'b', source: 'DIRECT_OBSERVATION', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PUBLIC' });
    store.add({ agentId: 'npc_1', factId: 'fact_1', value: 'c', source: 'ENGINE_REPORT', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PRIVATE' });

    const results = store.queryByAgentAndSubject('player', 'fact_1');
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('a');
  });

  it('should query by temporal scope - CURRENT_STATE', () => {
    const store = new KnowledgeStore();
    const v1 = store.add({ agentId: 'player', factId: 'fact_1', value: 'old', source: 'DIRECT_OBSERVATION', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PUBLIC' });
    store.supersedes({ agentId: 'player', factId: 'fact_1', value: 'new', source: 'ENGINE_REPORT', certainty: 'CONFIRMED', obtainedTurn: 2, lastVerifiedTurn: 2, visibility: 'PUBLIC' }, v1.id);

    const results = store.queryByTemporalScope({ mode: 'CURRENT_STATE' });
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('new');
  });

  it('should query by temporal scope - HISTORICAL_POINT', () => {
    const store = new KnowledgeStore();
    store.add({ agentId: 'player', factId: 'fact_1', value: 'old', source: 'DIRECT_OBSERVATION', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PUBLIC' });
    store.add({ agentId: 'player', factId: 'fact_1', value: 'new', source: 'ENGINE_REPORT', certainty: 'CONFIRMED', obtainedTurn: 10, lastVerifiedTurn: 10, visibility: 'PUBLIC' });

    const results = store.queryByTemporalScope({ mode: 'HISTORICAL_POINT', targetTurn: 5 });
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('old');
  });

  it('should query by temporal scope - TEMPORAL_EVOLUTION', () => {
    const store = new KnowledgeStore();
    const v1 = store.add({ agentId: 'player', factId: 'fact_1', value: 'old', source: 'DIRECT_OBSERVATION', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PUBLIC' });
    store.supersedes({ agentId: 'player', factId: 'fact_1', value: 'new', source: 'ENGINE_REPORT', certainty: 'CONFIRMED', obtainedTurn: 2, lastVerifiedTurn: 2, visibility: 'PUBLIC' }, v1.id);

    const results = store.queryByTemporalScope({ mode: 'TEMPORAL_EVOLUTION' });
    expect(results).toHaveLength(2);
  });

  it('should apply temporal filter to queryByAgentAndSubject', () => {
    const store = new KnowledgeStore();
    store.add({ agentId: 'player', factId: 'fact_1', value: 'old', source: 'DIRECT_OBSERVATION', certainty: 'CONFIRMED', obtainedTurn: 1, lastVerifiedTurn: 1, visibility: 'PUBLIC' });
    store.add({ agentId: 'player', factId: 'fact_1', value: 'new', source: 'ENGINE_REPORT', certainty: 'CONFIRMED', obtainedTurn: 10, lastVerifiedTurn: 10, visibility: 'PUBLIC' });

    const results = store.queryByAgentAndSubject('player', 'fact_1', { mode: 'HISTORICAL_POINT', targetTurn: 5 });
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('old');
  });
});

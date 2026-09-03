/**
 * CODEX-001 — Codex Retrieval Integration Tests
 *
 * Framework: node:test + tsx (project standard).
 * Tests searchCodex() score behavior and NarrativeCycle enrichment.
 */

import assert from 'node:assert/strict';
import { searchCodex } from '../../src/lib/codexRetriever';
import { runNarrativeCycle } from '../../src/lib/narrativeCycle';
import { MockNarrativeLLM } from '../../src/lib/mockNarrativeLLM';
import {
  createSliceState,
  PLAYER_OBSERVER
} from '../fixtures/narrativeSlice.fixtures';

const CODEX_RELEVANCE_THRESHOLD = 40; // must match narrativeCycle.ts constant

// ---------------------------------------------------------------------------
// Section 1 — searchCodex() score behavior (verified against codex_index.json)
// ---------------------------------------------------------------------------

// T1: Mechanical query returns results above threshold
{
  const results = searchCodex('recrutamento infantaria', { limit: 3 });
  assert.ok(results.length >= 1, 'Mechanical query must return at least 1 result');
  assert.ok(
    results[0].score >= CODEX_RELEVANCE_THRESHOLD,
    `Top result score (${results[0].score}) must be >= ${CODEX_RELEVANCE_THRESHOLD}`
  );
  if (results.length >= 2) {
    assert.ok(
      results[0].score >= results[1].score,
      'Results must be sorted by score descending'
    );
  }
  console.log(`[CODEX-001-T1] "recrutamento infantaria" -> score=${results[0].score} >= 40 OK`);
}

// T2: Simple social query scores below threshold (audit: max=27)
{
  const results = searchCodex('vou caminhar ate o salao', { limit: 3 });
  const aboveThreshold = results.filter(r => r.score >= CODEX_RELEVANCE_THRESHOLD);
  assert.equal(
    aboveThreshold.length,
    0,
    `Social query must produce 0 results above threshold. Got scores: ${results.map(r => r.score).join(',')}`
  );
  console.log(`[CODEX-001-T2] "vou caminhar ate o salao" -> 0 results above threshold OK`);
}

// T3: Invalid query returns empty array
{
  const results = searchCodex('xyz123naoexiste', { limit: 3 });
  assert.equal(results.length, 0, 'Invalid query must return []');
  console.log('[CODEX-001-T3] "xyz123naoexiste" -> [] OK');
}

// T4: Combat query is mechanical and relevant
{
  const results = searchCodex('combate batalha', { limit: 3 });
  assert.ok(results.length >= 1, 'Combat query must return at least 1 result');
  assert.ok(
    results[0].score >= CODEX_RELEVANCE_THRESHOLD,
    `Combat query top score (${results[0].score}) must be >= ${CODEX_RELEVANCE_THRESHOLD}`
  );
  console.log(`[CODEX-001-T4] "combate batalha" -> score=${results[0].score} >= 40 OK`);
}

// T5: Result fields match CodexSearchResult contract (exactRuleMatch is optional)
{
  const results = searchCodex('recrutamento infantaria', { limit: 1 });
  assert.ok(results.length >= 1);
  const r = results[0];
  assert.ok(typeof r.node.id === 'string');
  assert.ok(typeof r.node.section === 'string');
  assert.ok(typeof r.node.title === 'string');
  assert.ok(typeof r.node.content === 'string' && r.node.content.length > 0);
  assert.ok(typeof r.score === 'number');
  assert.ok(Array.isArray(r.matchedTerms));
  assert.ok(
    r.exactRuleMatch === undefined || typeof r.exactRuleMatch === 'boolean',
    'exactRuleMatch must be boolean or undefined'
  );
  console.log('[CODEX-001-T5] Field types verified OK');
}

// ---------------------------------------------------------------------------
// Section 2 — NarrativeCycle integration
// ---------------------------------------------------------------------------

const mock = new MockNarrativeLLM();

// T6: Mechanical input enriches NarrativeContext with codexKnowledge
// Input "Quero recrutar 10 soldados." verified to score 56 against codex_index.json
{
  const state = createSliceState();
  const result = await runNarrativeCycle({
    playerInput: 'Quero recrutar 10 soldados.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mock,
  });

  assert.ok(
    result.context.codexKnowledge !== undefined,
    'codexKnowledge should be defined for recruitment input (verified score=56)'
  );
  assert.ok(
    (result.context.codexKnowledge?.length ?? 0) >= 1,
    'codexKnowledge must have at least 1 entry'
  );
  const fact = result.context.codexKnowledge![0];
  assert.ok(typeof fact.ruleId === 'string', 'ruleId must be string');
  assert.ok(typeof fact.content === 'string' && fact.content.length > 0, 'content must be non-empty string');
  assert.ok(typeof fact.relevanceScore === 'number' && fact.relevanceScore >= CODEX_RELEVANCE_THRESHOLD);
  console.log(`[CODEX-001-T6] Mechanical input enriches context with ${result.context.codexKnowledge!.length} codex entries OK`);
}

// T7: Social input does NOT add codexKnowledge above threshold
{
  const state = createSliceState();
  const result = await runNarrativeCycle({
    playerInput: 'Bom dia a todos.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mock,
  });

  const hasCodexAboveThreshold = (result.context.codexKnowledge?.length ?? 0) > 0;
  assert.ok(
    !hasCodexAboveThreshold,
    `Social input must not produce codexKnowledge above threshold. Got: ${JSON.stringify(result.context.codexKnowledge)}`
  );
  console.log('[CODEX-001-T7] Social input -> no codexKnowledge above threshold OK');
}

// T8: Narrative is always produced, even when codexKnowledge is absent
{
  const state = createSliceState();
  const result = await runNarrativeCycle({
    playerInput: 'Bom dia a todos.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mock,
  });

  assert.ok(typeof result.narrative === 'string' && result.narrative.length > 0);
  console.log('[CODEX-001-T8] Narrative produced without codex context OK');
}

// T9: Engine state is unchanged after INFORMATION query (Engine prevails over Codex)
{
  const state = createSliceState();
  const initialUnitCount = state.army.units.reduce((sum, u) => sum + u.size, 0);

  const result = await runNarrativeCycle({
    playerInput: 'Quantos soldados temos disponíveis agora?',
    state,
    observer: PLAYER_OBSERVER,
    llm: mock,
  });

  // Engine state must not be mutated by the codex retrieval
  const finalUnitCount = result.resultState.army.units.reduce((sum, u) => sum + u.size, 0);
  assert.equal(
    finalUnitCount,
    initialUnitCount,
    `Army count must be unchanged: expected ${initialUnitCount}, got ${finalUnitCount}`
  );
  assert.equal(result.report.status, 'ACCEPTED');
  assert.ok(typeof result.narrative === 'string' && result.narrative.length > 0);
  console.log(`[CODEX-001-T9] Engine state (${initialUnitCount} troops) preserved; Engine prevails over Codex OK`);
}

console.log('\n=== CODEX-001: All 9 tests passed ===\n');

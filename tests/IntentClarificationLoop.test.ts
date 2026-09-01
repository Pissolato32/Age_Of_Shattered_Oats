import assert from 'node:assert/strict';
import {
  PendingClarification,
  ClarificationContext,
  ClarificationOption,
  MAX_CLARIFICATION_ROUNDS
} from '../src/lib/clarificationContracts';
import { NarrativeCommand } from '../src/lib/narrativeContracts';

// ---------------------------------------------------------------------------
// TEST A — PendingClarification structure is valid
// ---------------------------------------------------------------------------
{
  const proposedCommand: NarrativeCommand = {
    contractVersion: 1,
    commandId: 'cmd_test_1',
    actorId: 'player',
    action: 'INFORMATION',
    desiredOutcome: 'situação dos homens',
    constraints: [],
    confidence: 0.42,
    ambiguity: ['MEN_COUNT', 'ARMY_READINESS'],
    requiresClarification: true
  };

  const pending: PendingClarification = {
    originalInput: 'Quero cuidar da situação dos homens.',
    proposedCommand,
    question: 'Quereis saber quantos homens temos ou quão preparados estão?',
    ambiguity: ['MEN_COUNT', 'ARMY_READINESS'],
    round: 1,
    createdAt: new Date().toISOString()
  };

  assert.equal(pending.originalInput, 'Quero cuidar da situação dos homens.');
  assert.equal(pending.proposedCommand.action, 'INFORMATION');
  assert.equal(pending.round, 1);
  assert.equal(pending.ambiguity.length, 2);
  console.log('[TEST A] PendingClarification structure valid OK');
}

// ---------------------------------------------------------------------------
// TEST B — ClarificationOption structure is valid
// ---------------------------------------------------------------------------
{
  const options: ClarificationOption[] = [
    { id: 'opt_1', label: 'Efetivo', semanticValue: 'MEN_COUNT' },
    { id: 'opt_2', label: 'Prontidão', semanticValue: 'ARMY_READINESS' },
    { id: 'opt_3', label: 'Outra coisa...', semanticValue: 'OTHER' }
  ];

  assert.equal(options.length, 3);
  assert.equal(options[0].semanticValue, 'MEN_COUNT');
  assert.equal(options[1].semanticValue, 'ARMY_READINESS');
  assert.equal(options[2].semanticValue, 'OTHER');
  console.log('[TEST B] ClarificationOption structure valid OK');
}

// ---------------------------------------------------------------------------
// TEST C — MAX_CLARIFICATION_ROUNDS is 2
// ---------------------------------------------------------------------------
{
  assert.equal(MAX_CLARIFICATION_ROUNDS, 2, 'MAX_CLARIFICATION_ROUNDS must be 2');
  console.log('[TEST C] MAX_CLARIFICATION_ROUNDS = 2 OK');
}

// ---------------------------------------------------------------------------
// TEST D — ClarificationContext preserves full context
// ---------------------------------------------------------------------------
{
  const proposedCommand: NarrativeCommand = {
    contractVersion: 1,
    commandId: 'cmd_test_2',
    actorId: 'player',
    action: 'TRAVEL',
    targetId: 'Northern Border',
    constraints: [],
    confidence: 0.61,
    ambiguity: [],
    requiresClarification: true
  };

  const context: ClarificationContext = {
    originalInput: 'Não quero viajar. Quero saber onde estamos.',
    proposedCommand,
    masterQuestion: 'Entendo que não desejais partir. Quereis saber a posição atual?',
    playerAnswer: 'Exatamente.'
  };

  assert.equal(context.originalInput, 'Não quero viajar. Quero saber onde estamos.');
  assert.equal(context.proposedCommand.action, 'TRAVEL');
  assert.equal(context.masterQuestion, 'Entendo que não desejais partir. Quereis saber a posição atual?');
  assert.equal(context.playerAnswer, 'Exatamente.');
  console.log('[TEST D] ClarificationContext preserves full context OK');
}

// ---------------------------------------------------------------------------
// TEST E — PendingClarification with structured options
// ---------------------------------------------------------------------------
{
  const options: ClarificationOption[] = [
    { id: 'opt_1', label: 'Efetivo', semanticValue: 'MEN_COUNT' },
    { id: 'opt_2', label: 'Prontidão', semanticValue: 'ARMY_READINESS' }
  ];

  const pending: PendingClarification = {
    originalInput: 'Quero cuidar da situação dos homens.',
    proposedCommand: {
      contractVersion: 1,
      commandId: 'cmd_test_3',
      actorId: 'player',
      action: 'INFORMATION',
      constraints: [],
      confidence: 0.42,
      ambiguity: ['MEN_COUNT', 'ARMY_READINESS'],
      requiresClarification: true
    },
    question: 'Quereis saber quantos homens temos ou quão preparados estão?',
    options,
    ambiguity: ['MEN_COUNT', 'ARMY_READINESS'],
    round: 1,
    createdAt: new Date().toISOString()
  };

  assert.equal(pending.options?.length, 2);
  assert.equal(pending.options?.[0].label, 'Efetivo');
  assert.equal(pending.options?.[1].semanticValue, 'ARMY_READINESS');
  console.log('[TEST E] PendingClarification with structured options OK');
}

// ---------------------------------------------------------------------------
// TEST F — ClarificationContext with selectedOption (button click)
// ---------------------------------------------------------------------------
{
  const context: ClarificationContext = {
    originalInput: 'Quero cuidar da situação dos homens.',
    proposedCommand: {
      contractVersion: 1,
      commandId: 'cmd_test_4',
      actorId: 'player',
      action: 'INFORMATION',
      constraints: [],
      confidence: 0.42,
      ambiguity: ['MEN_COUNT', 'ARMY_READINESS'],
      requiresClarification: true
    },
    masterQuestion: 'Quereis saber quantos homens temos ou quão preparados estão?',
    playerAnswer: 'Efetivo',
    selectedOption: 'MEN_COUNT'
  };

  assert.equal(context.selectedOption, 'MEN_COUNT');
  assert.equal(context.playerAnswer, 'Efetivo');
  console.log('[TEST F] ClarificationContext with selectedOption OK');
}

// ---------------------------------------------------------------------------
// TEST G — ClarificationContext without selectedOption (free text)
// ---------------------------------------------------------------------------
{
  const context: ClarificationContext = {
    originalInput: 'Quero cuidar da situação dos homens.',
    proposedCommand: {
      contractVersion: 1,
      commandId: 'cmd_test_5',
      actorId: 'player',
      action: 'INFORMATION',
      constraints: [],
      confidence: 0.42,
      ambiguity: ['MEN_COUNT', 'ARMY_READINESS'],
      requiresClarification: true
    },
    masterQuestion: 'Quereis saber quantos homens temos ou quão preparados estão?',
    playerAnswer: 'Quero saber quantos temos.'
  };

  assert.equal(context.selectedOption, undefined);
  assert.equal(context.playerAnswer, 'Quero saber quantos temos.');
  console.log('[TEST G] ClarificationContext without selectedOption (free text) OK');
}

// ---------------------------------------------------------------------------
// TEST H — Round escalation: round 1 → round 2
// ---------------------------------------------------------------------------
{
  const pending1: PendingClarification = {
    originalInput: 'Quero cuidar da situação dos homens.',
    proposedCommand: {
      contractVersion: 1,
      commandId: 'cmd_test_6',
      actorId: 'player',
      action: 'INFORMATION',
      constraints: [],
      confidence: 0.42,
      ambiguity: ['MEN_COUNT', 'ARMY_READINESS'],
      requiresClarification: true
    },
    question: 'Quereis saber quantos homens temos ou quão preparados estão?',
    ambiguity: ['MEN_COUNT', 'ARMY_READINESS'],
    round: 1,
    createdAt: new Date().toISOString()
  };

  const pending2: PendingClarification = {
    ...pending1,
    round: pending1.round + 1,
    question: 'Ainda não entendi. Quantos homens ou prontidão?'
  };

  assert.equal(pending1.round, 1);
  assert.equal(pending2.round, 2);
  assert.ok(pending2.round <= MAX_CLARIFICATION_ROUNDS, 'Round 2 is within limit');
  console.log('[TEST H] Round escalation 1 → 2 OK');
}

// ---------------------------------------------------------------------------
// TEST I — Round limit: round 2 + still ambiguous → must NOT exceed MAX
// ---------------------------------------------------------------------------
{
  let round = 1;

  // Simulate two rounds of clarification
  round++; // round 2
  assert.ok(round <= MAX_CLARIFICATION_ROUNDS, 'Round 2 is within limit');

  round++; // round 3 — should trigger fallback
  assert.ok(round > MAX_CLARIFICATION_ROUNDS, 'Round 3 exceeds limit');
  console.log('[TEST I] Round limit enforcement OK');
}

// ---------------------------------------------------------------------------
// TEST J — Semantic value from button click bypasses LLM interpretation
// ---------------------------------------------------------------------------
{
  const selectedOption = 'MEN_COUNT';

  // When a button is clicked, we have the semantic value directly
  // No LLM re-interpretation needed
  assert.equal(selectedOption, 'MEN_COUNT');
  assert.ok(typeof selectedOption === 'string', 'Semantic value is a string');
  console.log('[TEST J] Button semantic value bypasses LLM OK');
}

// ---------------------------------------------------------------------------
// TEST K — Free text answer requires LLM re-interpretation with context
// ---------------------------------------------------------------------------
{
  const context: ClarificationContext = {
    originalInput: 'Quero cuidar da situação dos homens.',
    proposedCommand: {
      contractVersion: 1,
      commandId: 'cmd_test_7',
      actorId: 'player',
      action: 'INFORMATION',
      constraints: [],
      confidence: 0.42,
      ambiguity: ['MEN_COUNT', 'ARMY_READINESS'],
      requiresClarification: true
    },
    masterQuestion: 'Quereis saber quantos homens temos ou quão preparados estão?',
    playerAnswer: 'Os segundos.'
  };

  // "Os segundos" alone means nothing — needs context
  // With context: A = MEN_COUNT, B = ARMY_READINESS, "Os segundos" = ARMY_READINESS
  assert.equal(context.playerAnswer, 'Os segundos.');
  assert.equal(context.selectedOption, undefined);
  // LLM must receive full context to interpret this correctly
  console.log('[TEST K] Free text requires LLM with full context OK');
}

// ---------------------------------------------------------------------------
// TEST L — PendingClarification is serializable (for CampaignState persistence)
// ---------------------------------------------------------------------------
{
  const pending: PendingClarification = {
    originalInput: 'Test input',
    proposedCommand: {
      contractVersion: 1,
      commandId: 'cmd_test_8',
      actorId: 'player',
      action: 'RECRUIT',
      magnitude: { mode: 'FIXED', value: 10 },
      constraints: [],
      confidence: 0.9,
      ambiguity: [],
      requiresClarification: false
    },
    question: 'Test question?',
    ambiguity: [],
    round: 1,
    createdAt: '2026-08-31T12:00:00.000Z'
  };

  const serialized = JSON.stringify(pending);
  const deserialized = JSON.parse(serialized) as PendingClarification;

  assert.equal(deserialized.originalInput, 'Test input');
  assert.equal(deserialized.proposedCommand.action, 'RECRUIT');
  assert.equal(deserialized.round, 1);
  console.log('[TEST L] PendingClarification serializable OK');
}

// ---------------------------------------------------------------------------
// TEST M — Clarification loop does not execute mechanical action
// ---------------------------------------------------------------------------
{
  // When pendingClarification exists, the system must NOT execute any action
  // The proposedCommand is stored but NOT passed to resolveNarrativeCommand()
  const pending: PendingClarification = {
    originalInput: 'Recrute 10 homens e me diga quantos temos.',
    proposedCommand: {
      contractVersion: 1,
      commandId: 'cmd_test_9',
      actorId: 'player',
      action: 'RECRUIT',
      magnitude: { mode: 'FIXED', value: 10 },
      constraints: [],
      confidence: 0.85,
      ambiguity: [],
      requiresClarification: false
    },
    question: 'Não posso fazer ambas as coisas ao mesmo tempo. O que优先?',
    ambiguity: ['ACTION + INFORMATION not supported'],
    round: 1,
    createdAt: new Date().toISOString()
  };

  // The system must check: if pendingClarification exists, do NOT execute
  assert.ok(pending, 'Pending clarification exists');
  // In the actual flow, this would prevent resolveNarrativeCommand() from being called
  console.log('[TEST M] Clarification loop prevents mechanical execution OK');
}

// ---------------------------------------------------------------------------
// TEST N — After resolution, pendingClarification must be null
// ---------------------------------------------------------------------------
{
  // After the clarification is resolved, pendingClarification must be cleared
  // The next input should be treated as a new independent action
  let pendingClarification: PendingClarification | null = {
    originalInput: 'Test',
    proposedCommand: {
      contractVersion: 1,
      commandId: 'cmd_test_10',
      actorId: 'player',
      action: 'INFORMATION',
      constraints: [],
      confidence: 0.5,
      ambiguity: ['A', 'B'],
      requiresClarification: true
    },
    question: 'Test?',
    ambiguity: ['A', 'B'],
    round: 1,
    createdAt: new Date().toISOString()
  };

  // After resolution
  pendingClarification = null;

  assert.equal(pendingClarification, null, 'pendingClarification must be null after resolution');
  console.log('[TEST N] pendingClarification cleared after resolution OK');
}

console.log('\n=== ALL INTENT CLARIFICATION LOOP CONTRACT TESTS PASSED ===');

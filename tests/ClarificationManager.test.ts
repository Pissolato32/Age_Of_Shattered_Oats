import assert from 'node:assert/strict';
import { createInitialState } from '../src/engine';
import { CampaignState } from '../src/types';
import { NarrativeCommand } from '../src/lib/narrativeContracts';
import {
  hasPendingClarification,
  getPendingClarification,
  buildClarificationContext,
  createPendingClarification,
  canAskAnotherQuestion,
  createNextRoundClarification,
  clearPendingClarification,
  setPendingClarification,
  formatClarificationPrompt
} from '../src/lib/clarificationManager';
import { PendingClarification } from '../src/lib/clarificationContracts';

function createState(withPending: boolean = false): CampaignState {
  const state = createInitialState('Noble Ruler', 'Central Plains');
  if (withPending) {
    state.sessionLog.pendingClarification = {
      originalInput: 'Quero cuidar da situação dos homens.',
      proposedCommand: {
        contractVersion: 1,
        commandId: 'cmd_test_1',
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
  }
  return state;
}

// ---------------------------------------------------------------------------
// TEST 1 — hasPendingClarification returns false when no pending
// ---------------------------------------------------------------------------
{
  const state = createState(false);
  assert.equal(hasPendingClarification(state), false);
  console.log('[TEST 1] hasPendingClarification = false when no pending OK');
}

// ---------------------------------------------------------------------------
// TEST 2 — hasPendingClarification returns true when pending exists
// ---------------------------------------------------------------------------
{
  const state = createState(true);
  assert.equal(hasPendingClarification(state), true);
  console.log('[TEST 2] hasPendingClarification = true when pending exists OK');
}

// ---------------------------------------------------------------------------
// TEST 3 — getPendingClarification returns null when no pending
// ---------------------------------------------------------------------------
{
  const state = createState(false);
  assert.equal(getPendingClarification(state), null);
  console.log('[TEST 3] getPendingClarification = null when no pending OK');
}

// ---------------------------------------------------------------------------
// TEST 4 — getPendingClarification returns pending when exists
// ---------------------------------------------------------------------------
{
  const state = createState(true);
  const pending = getPendingClarification(state);
  assert.ok(pending !== null);
  assert.equal(pending!.originalInput, 'Quero cuidar da situação dos homens.');
  assert.equal(pending!.round, 1);
  console.log('[TEST 4] getPendingClarification returns pending OK');
}

// ---------------------------------------------------------------------------
// TEST 5 — buildClarificationContext creates correct context
// ---------------------------------------------------------------------------
{
  const state = createState(true);
  const pending = getPendingClarification(state)!;
  const context = buildClarificationContext(pending, 'Quero saber quantos temos.');

  assert.equal(context.originalInput, 'Quero cuidar da situação dos homens.');
  assert.equal(context.proposedCommand.action, 'INFORMATION');
  assert.equal(context.masterQuestion, 'Quereis saber quantos homens temos ou quão preparados estão?');
  assert.equal(context.playerAnswer, 'Quero saber quantos temos.');
  assert.equal(context.selectedOption, undefined);
  console.log('[TEST 5] buildClarificationContext OK');
}

// ---------------------------------------------------------------------------
// TEST 6 — buildClarificationContext with selectedOption
// ---------------------------------------------------------------------------
{
  const state = createState(true);
  const pending = getPendingClarification(state)!;
  const context = buildClarificationContext(pending, 'Efetivo', 'MEN_COUNT');

  assert.equal(context.selectedOption, 'MEN_COUNT');
  assert.equal(context.playerAnswer, 'Efetivo');
  console.log('[TEST 6] buildClarificationContext with selectedOption OK');
}

// ---------------------------------------------------------------------------
// TEST 7 — createPendingClarification creates pending from ambiguous command
// ---------------------------------------------------------------------------
{
  const command: NarrativeCommand = {
    contractVersion: 1,
    commandId: 'cmd_test_2',
    actorId: 'player',
    action: 'INFORMATION',
    constraints: [],
    confidence: 0.42,
    ambiguity: ['MEN_COUNT', 'ARMY_READINESS'],
    requiresClarification: true
  };

  const pending = createPendingClarification(
    'Quero cuidar da situação dos homens.',
    command,
    'Quereis saber quantos homens temos ou quão preparados estão?'
  );

  assert.ok(pending !== null);
  assert.equal(pending!.originalInput, 'Quero cuidar da situação dos homens.');
  assert.equal(pending!.proposedCommand.action, 'INFORMATION');
  assert.equal(pending!.round, 1);
  console.log('[TEST 7] createPendingClarification OK');
}

// ---------------------------------------------------------------------------
// TEST 8 — createPendingClarification returns null for non-ambiguous command
// ---------------------------------------------------------------------------
{
  const command: NarrativeCommand = {
    contractVersion: 1,
    commandId: 'cmd_test_3',
    actorId: 'player',
    action: 'RECRUIT',
    magnitude: { mode: 'FIXED', value: 10 },
    constraints: [],
    confidence: 0.9,
    ambiguity: [],
    requiresClarification: false
  };

  const pending = createPendingClarification(
    'Recrutar 10 soldados.',
    command,
    'Qual é a sua intenção?'
  );

  assert.equal(pending, null);
  console.log('[TEST 8] createPendingClarification = null for non-ambiguous OK');
}

// ---------------------------------------------------------------------------
// TEST 9 — canAskAnotherQuestion returns true when round < MAX
// ---------------------------------------------------------------------------
{
  const pending: PendingClarification = {
    originalInput: 'Test',
    proposedCommand: {
      contractVersion: 1,
      commandId: 'cmd_test_4',
      actorId: 'player',
      action: 'INFORMATION',
      constraints: [],
      confidence: 0.5,
      ambiguity: ['A'],
      requiresClarification: true
    },
    question: 'Test?',
    ambiguity: ['A'],
    round: 1,
    createdAt: new Date().toISOString()
  };

  assert.equal(canAskAnotherQuestion(pending), true);
  console.log('[TEST 9] canAskAnotherQuestion = true when round 1 OK');
}

// ---------------------------------------------------------------------------
// TEST 10 — canAskAnotherQuestion returns false when round = MAX
// ---------------------------------------------------------------------------
{
  const pending: PendingClarification = {
    originalInput: 'Test',
    proposedCommand: {
      contractVersion: 1,
      commandId: 'cmd_test_5',
      actorId: 'player',
      action: 'INFORMATION',
      constraints: [],
      confidence: 0.5,
      ambiguity: ['A'],
      requiresClarification: true
    },
    question: 'Test?',
    ambiguity: ['A'],
    round: 2,
    createdAt: new Date().toISOString()
  };

  assert.equal(canAskAnotherQuestion(pending), false);
  console.log('[TEST 10] canAskAnotherQuestion = false when round 2 OK');
}

// ---------------------------------------------------------------------------
// TEST 11 — createNextRoundClarification increments round
// ---------------------------------------------------------------------------
{
  const current: PendingClarification = {
    originalInput: 'Test',
    proposedCommand: {
      contractVersion: 1,
      commandId: 'cmd_test_6',
      actorId: 'player',
      action: 'INFORMATION',
      constraints: [],
      confidence: 0.5,
      ambiguity: ['A'],
      requiresClarification: true
    },
    question: 'Test round 1?',
    ambiguity: ['A'],
    round: 1,
    createdAt: new Date().toISOString()
  };

  const next = createNextRoundClarification(current, 'Test round 2?');

  assert.ok(next !== null);
  assert.equal(next!.round, 2);
  assert.equal(next!.question, 'Test round 2?');
  console.log('[TEST 11] createNextRoundClarification increments round OK');
}

// ---------------------------------------------------------------------------
// TEST 12 — createNextRoundClarification returns null at MAX_ROUNDS
// ---------------------------------------------------------------------------
{
  const current: PendingClarification = {
    originalInput: 'Test',
    proposedCommand: {
      contractVersion: 1,
      commandId: 'cmd_test_7',
      actorId: 'player',
      action: 'INFORMATION',
      constraints: [],
      confidence: 0.5,
      ambiguity: ['A'],
      requiresClarification: true
    },
    question: 'Test round 2?',
    ambiguity: ['A'],
    round: 2,
    createdAt: new Date().toISOString()
  };

  const next = createNextRoundClarification(current, 'Test round 3?');

  assert.equal(next, null);
  console.log('[TEST 12] createNextRoundClarification = null at MAX_ROUNDS OK');
}

// ---------------------------------------------------------------------------
// TEST 13 — clearPendingClarification removes pending from state
// ---------------------------------------------------------------------------
{
  const state = createState(true);
  assert.equal(hasPendingClarification(state), true);

  const cleared = clearPendingClarification(state);
  assert.equal(hasPendingClarification(cleared), false);
  assert.equal(cleared.sessionLog.pendingClarification, undefined);
  console.log('[TEST 13] clearPendingClarification removes pending OK');
}

// ---------------------------------------------------------------------------
// TEST 14 — setPendingClarification adds pending to state
// ---------------------------------------------------------------------------
{
  const state = createState(false);
  assert.equal(hasPendingClarification(state), false);

  const pending: PendingClarification = {
    originalInput: 'Test',
    proposedCommand: {
      contractVersion: 1,
      commandId: 'cmd_test_8',
      actorId: 'player',
      action: 'TRAVEL',
      constraints: [],
      confidence: 0.7,
      ambiguity: [],
      requiresClarification: true
    },
    question: 'Para onde?',
    ambiguity: [],
    round: 1,
    createdAt: new Date().toISOString()
  };

  const withPending = setPendingClarification(state, pending);
  assert.equal(hasPendingClarification(withPending), true);
  assert.equal(withPending.sessionLog.pendingClarification!.question, 'Para onde?');
  console.log('[TEST 14] setPendingClarification adds pending OK');
}

// ---------------------------------------------------------------------------
// TEST 15 — formatClarificationPrompt creates correct prompt
// ---------------------------------------------------------------------------
{
  const context = {
    originalInput: 'Quero cuidar da situação dos homens.',
    proposedCommand: {
      contractVersion: 1 as const,
      commandId: 'cmd_test_9',
      actorId: 'player',
      action: 'INFORMATION' as const,
      constraints: [] as readonly string[],
      confidence: 0.42,
      ambiguity: ['MEN_COUNT', 'ARMY_READINESS'] as readonly string[],
      requiresClarification: true
    },
    masterQuestion: 'Quereis saber quantos homens temos ou quão preparados estão?',
    playerAnswer: 'Quero saber quantos temos.'
  };

  const prompt = formatClarificationPrompt(context);

  assert.ok(prompt.includes('ORIGINAL DO JOGADOR'));
  assert.ok(prompt.includes('Quero cuidar da situação dos homens.'));
  assert.ok(prompt.includes('INTENÇÃO PROPOSTA: INFORMATION'));
  assert.ok(prompt.includes('AMBIGUIDADES: MEN_COUNT, ARMY_READINESS'));
  assert.ok(prompt.includes('PERGUNTA DO MESTRE'));
  assert.ok(prompt.includes('RESPOSTA DO JOGADOR'));
  assert.ok(prompt.includes('Quero saber quantos temos.'));
  assert.ok(prompt.includes('RETORNE APENAS JSON'));
  console.log('[TEST 15] formatClarificationPrompt OK');
}

// ---------------------------------------------------------------------------
// TEST 16 — formatClarificationPrompt with selectedOption
// ---------------------------------------------------------------------------
{
  const context = {
    originalInput: 'Quero cuidar da situação dos homens.',
    proposedCommand: {
      contractVersion: 1 as const,
      commandId: 'cmd_test_10',
      actorId: 'player',
      action: 'INFORMATION' as const,
      constraints: [] as readonly string[],
      confidence: 0.42,
      ambiguity: ['MEN_COUNT', 'ARMY_READINESS'] as readonly string[],
      requiresClarification: true
    },
    masterQuestion: 'Quereis saber quantos homens temos ou quão preparados estão?',
    playerAnswer: 'Efetivo',
    selectedOption: 'MEN_COUNT'
  };

  const prompt = formatClarificationPrompt(context);

  assert.ok(prompt.includes('OPÇÃO SELECIONADA: MEN_COUNT'));
  console.log('[TEST 16] formatClarificationPrompt with selectedOption OK');
}

// ---------------------------------------------------------------------------
// TEST 17 — State mutation safety: original state unchanged
// ---------------------------------------------------------------------------
{
  const state = createState(true);
  const originalPending = state.sessionLog.pendingClarification;

  const cleared = clearPendingClarification(state);

  // Original state should be unchanged
  assert.ok(state.sessionLog.pendingClarification === originalPending);
  assert.equal(hasPendingClarification(state), true);
  // New state should be cleared
  assert.equal(hasPendingClarification(cleared), false);
  console.log('[TEST 17] State mutation safety OK');
}

console.log('\n=== ALL CLARIFICATION MANAGER TESTS PASSED ===');

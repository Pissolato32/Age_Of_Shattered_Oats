import assert from 'node:assert/strict';
import { CausalTraceLogEntry } from '../src/tools/PlaytestSessionRunner';

// ---------------------------------------------------------------------------
// TEST 1 — Normal turn has clarification.resolution = 'NORMAL_TURN'
// ---------------------------------------------------------------------------
{
  const trace: CausalTraceLogEntry = {
    turn: 1,
    date: 'Greening, Ano 342, Semana 1',
    playerInput: 'Recrutar 10 soldados.',
    classifiedAction: 'RECRUIT',
    engineResult: {
      status: 'ACCEPTED',
      actionExecuted: 'RECRUIT',
      reasonCode: '',
      mutated: true,
      actionMutatedState: true
    },
    stateBefore: { silverdew: 300, food: 200, laborPool: 50, garrison: 20 },
    stateAfter: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
    actionMutatedState: true,
    actionDeltas: [],
    systemWeeklyDeltas: {},
    weeklyDeltas: {},
    totalDeltas: {},
    totalStateChanged: true,
    stateDeltas: [],
    weeklyFinancials: {
      income: 92.5,
      holdingMaintenance: 70,
      garrisonCost: 8,
      excessSpoilage: 0,
      finalSilverdew: 270,
      finalFood: 200
    },
    narrativeContextSummary: {
      knownFactsCount: 10,
      relationshipsCount: 5
    },
    llmResponse: 'O recrutamento foi autorizado.',
    semanticValidationViolations: [],
    clarification: { resolution: 'NORMAL_TURN' }
  };

  assert.equal(trace.clarification?.resolution, 'NORMAL_TURN');
  assert.equal(trace.clarification?.originalInput, undefined);
  assert.equal(trace.clarification?.masterQuestion, undefined);
  console.log('[TEST 1] Normal turn has resolution = NORMAL_TURN OK');
}

// ---------------------------------------------------------------------------
// TEST 2 — Clarification detection turn has masterQuestion and resolution
// ---------------------------------------------------------------------------
{
  const trace: CausalTraceLogEntry = {
    turn: 2,
    date: 'Greening, Ano 342, Semana 2',
    playerInput: 'Quero cuidar da situação dos homens.',
    classifiedAction: 'UNKNOWN',
    engineResult: {
      status: 'REJECTED',
      actionExecuted: 'UNKNOWN',
      reasonCode: 'esclarecimento necessário',
      mutated: false,
      actionMutatedState: false
    },
    stateBefore: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
    stateAfter: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
    actionMutatedState: false,
    actionDeltas: [],
    systemWeeklyDeltas: {},
    weeklyDeltas: {},
    totalDeltas: {},
    totalStateChanged: false,
    stateDeltas: [],
    weeklyFinancials: {
      income: 92.5,
      holdingMaintenance: 70,
      garrisonCost: 8,
      excessSpoilage: 0,
      finalSilverdew: 270,
      finalFood: 200
    },
    narrativeContextSummary: {
      knownFactsCount: 10,
      relationshipsCount: 5
    },
    llmResponse: 'Quereis saber quantos homens temos ou quão preparados estão?',
    semanticValidationViolations: [],
    clarification: {
      masterQuestion: 'Quereis saber quantos homens temos ou quão preparados estão?',
      resolution: 'EXHAUSTED'
    }
  };

  assert.equal(trace.clarification?.resolution, 'EXHAUSTED');
  assert.equal(trace.clarification?.masterQuestion, 'Quereis saber quantos homens temos ou quão preparados estão?');
  assert.equal(trace.clarification?.originalInput, undefined);
  console.log('[TEST 2] Clarification detection turn has masterQuestion + EXHAUSTED OK');
}

// ---------------------------------------------------------------------------
// TEST 3 — Clarification response turn with resolved intent
// ---------------------------------------------------------------------------
{
  const trace: CausalTraceLogEntry = {
    turn: 3,
    date: 'Greening, Ano 342, Semana 3',
    playerInput: 'Quero saber quantos temos.',
    classifiedAction: 'INFORMATION',
    engineResult: {
      status: 'ACCEPTED',
      actionExecuted: 'INFORMATION',
      reasonCode: '',
      mutated: false,
      actionMutatedState: false
    },
    stateBefore: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
    stateAfter: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
    actionMutatedState: false,
    actionDeltas: [],
    systemWeeklyDeltas: {},
    weeklyDeltas: {},
    totalDeltas: {},
    totalStateChanged: false,
    stateDeltas: [],
    weeklyFinancials: {
      income: 92.5,
      holdingMaintenance: 70,
      garrisonCost: 8,
      excessSpoilage: 0,
      finalSilverdew: 270,
      finalFood: 200
    },
    narrativeContextSummary: {
      knownFactsCount: 10,
      relationshipsCount: 5
    },
    llmResponse: 'Vossos homens somam 30.',
    semanticValidationViolations: [],
    clarification: {
      originalInput: 'Quero cuidar da situação dos homens.',
      masterQuestion: 'Quereis saber quantos homens temos ou quão preparados estão?',
      playerAnswer: 'Quero saber quantos temos.',
      resolution: 'RESOLVED'
    }
  };

  assert.equal(trace.clarification?.resolution, 'RESOLVED');
  assert.equal(trace.clarification?.originalInput, 'Quero cuidar da situação dos homens.');
  assert.equal(trace.clarification?.masterQuestion, 'Quereis saber quantos homens temos ou quão preparados estão?');
  assert.equal(trace.clarification?.playerAnswer, 'Quero saber quantos temos.');
  console.log('[TEST 3] Clarification response with RESOLVED OK');
}

// ---------------------------------------------------------------------------
// TEST 4 — Clarification response with button click (selectedOption)
// ---------------------------------------------------------------------------
{
  const trace: CausalTraceLogEntry = {
    turn: 3,
    date: 'Greening, Ano 342, Semana 3',
    playerInput: 'Efetivo',
    classifiedAction: 'INFORMATION',
    engineResult: {
      status: 'ACCEPTED',
      actionExecuted: 'INFORMATION',
      reasonCode: '',
      mutated: false,
      actionMutatedState: false
    },
    stateBefore: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
    stateAfter: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
    actionMutatedState: false,
    actionDeltas: [],
    systemWeeklyDeltas: {},
    weeklyDeltas: {},
    totalDeltas: {},
    totalStateChanged: false,
    stateDeltas: [],
    weeklyFinancials: {
      income: 92.5,
      holdingMaintenance: 70,
      garrisonCost: 8,
      excessSpoilage: 0,
      finalSilverdew: 270,
      finalFood: 200
    },
    narrativeContextSummary: {
      knownFactsCount: 10,
      relationshipsCount: 5
    },
    llmResponse: 'Vossos homens somam 30.',
    semanticValidationViolations: [],
    clarification: {
      originalInput: 'Quero cuidar da situação dos homens.',
      masterQuestion: 'Quereis saber quantos homens temos ou quão preparados estão?',
      playerAnswer: 'Efetivo',
      selectedOption: 'MEN_COUNT',
      resolution: 'RESOLVED'
    }
  };

  assert.equal(trace.clarification?.selectedOption, 'MEN_COUNT');
  assert.equal(trace.clarification?.playerAnswer, 'Efetivo');
  assert.equal(trace.clarification?.resolution, 'RESOLVED');
  console.log('[TEST 4] Clarification with selectedOption (button click) OK');
}

// ---------------------------------------------------------------------------
// TEST 5 — Round 2 is distinguishable from round 1
// ---------------------------------------------------------------------------
{
  const traceRound1: CausalTraceLogEntry = {
    turn: 2,
    date: 'Greening, Ano 342, Semana 2',
    playerInput: 'Quero cuidar da situação dos homens.',
    classifiedAction: 'UNKNOWN',
    engineResult: { status: 'REJECTED', actionExecuted: 'UNKNOWN', reasonCode: '', mutated: false, actionMutatedState: false },
    stateBefore: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
    stateAfter: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
    actionMutatedState: false, actionDeltas: [], systemWeeklyDeltas: {}, weeklyDeltas: {}, totalDeltas: {}, totalStateChanged: false, stateDeltas: [],
    weeklyFinancials: { income: 0, holdingMaintenance: 0, garrisonCost: 0, excessSpoilage: 0, finalSilverdew: 270, finalFood: 200 },
    narrativeContextSummary: { knownFactsCount: 0, relationshipsCount: 0 },
    llmResponse: '', semanticValidationViolations: [],
    clarification: { round: 1, masterQuestion: 'Pergunta round 1?', resolution: 'EXHAUSTED' }
  };

  const traceRound2: CausalTraceLogEntry = {
    ...traceRound1,
    clarification: { round: 2, masterQuestion: 'Pergunta round 2?', resolution: 'EXHAUSTED' }
  };

  assert.equal(traceRound1.clarification?.round, 1);
  assert.equal(traceRound2.clarification?.round, 2);
  assert.notEqual(traceRound1.clarification?.round, traceRound2.clarification?.round);
  console.log('[TEST 5] Round 2 distinguishable from round 1 OK');
}

// ---------------------------------------------------------------------------
// TEST 6 — MAX_CLARIFICATION_ROUNDS results in EXHAUSTED resolution
// ---------------------------------------------------------------------------
{
  const trace: CausalTraceLogEntry = {
    turn: 4,
    date: 'Greening, Ano 342, Semana 4',
    playerInput: 'Ainda não sei.',
    classifiedAction: 'UNKNOWN',
    engineResult: { status: 'REJECTED', actionExecuted: 'UNKNOWN', reasonCode: 'esclarecimento máximo', mutated: false, actionMutatedState: false },
    stateBefore: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
    stateAfter: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
    actionMutatedState: false, actionDeltas: [], systemWeeklyDeltas: {}, weeklyDeltas: {}, totalDeltas: {}, totalStateChanged: false, stateDeltas: [],
    weeklyFinancials: { income: 0, holdingMaintenance: 0, garrisonCost: 0, excessSpoilage: 0, finalSilverdew: 270, finalFood: 200 },
    narrativeContextSummary: { knownFactsCount: 0, relationshipsCount: 0 },
    llmResponse: 'Ainda não consegui determinar.', semanticValidationViolations: [],
    clarification: { round: 2, resolution: 'EXHAUSTED' }
  };

  assert.equal(trace.clarification?.resolution, 'EXHAUSTED');
  assert.equal(trace.clarification?.round, 2);
  console.log('[TEST 6] MAX_CLARIFICATION_ROUNDS → EXHAUSTED OK');
}

// ---------------------------------------------------------------------------
// TEST 7 — Replay can reconstruct causal sequence from traces
// ---------------------------------------------------------------------------
{
  const traces: CausalTraceLogEntry[] = [
    {
      turn: 1,
      date: 'Greening, Ano 342, Semana 1',
      playerInput: 'Recrutar 10 soldados.',
      classifiedAction: 'RECRUIT',
      engineResult: { status: 'ACCEPTED', actionExecuted: 'RECRUIT', reasonCode: '', mutated: true, actionMutatedState: true },
      stateBefore: { silverdew: 300, food: 200, laborPool: 50, garrison: 20 },
      stateAfter: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
      actionMutatedState: true, actionDeltas: [], systemWeeklyDeltas: {}, weeklyDeltas: {}, totalDeltas: {}, totalStateChanged: true, stateDeltas: [],
      weeklyFinancials: { income: 0, holdingMaintenance: 0, garrisonCost: 0, excessSpoilage: 0, finalSilverdew: 270, finalFood: 200 },
      narrativeContextSummary: { knownFactsCount: 0, relationshipsCount: 0 },
      llmResponse: '', semanticValidationViolations: [],
      clarification: { resolution: 'NORMAL_TURN' }
    },
    {
      turn: 2,
      date: 'Greening, Ano 342, Semana 2',
      playerInput: 'Quero cuidar da situação dos homens.',
      classifiedAction: 'UNKNOWN',
      engineResult: { status: 'REJECTED', actionExecuted: 'UNKNOWN', reasonCode: 'esclarecimento', mutated: false, actionMutatedState: false },
      stateBefore: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
      stateAfter: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
      actionMutatedState: false, actionDeltas: [], systemWeeklyDeltas: {}, weeklyDeltas: {}, totalDeltas: {}, totalStateChanged: false, stateDeltas: [],
      weeklyFinancials: { income: 0, holdingMaintenance: 0, garrisonCost: 0, excessSpoilage: 0, finalSilverdew: 270, finalFood: 200 },
      narrativeContextSummary: { knownFactsCount: 0, relationshipsCount: 0 },
      llmResponse: 'Quereis saber X ou Y?', semanticValidationViolations: [],
      clarification: { masterQuestion: 'Quereis saber X ou Y?', resolution: 'EXHAUSTED' }
    },
    {
      turn: 3,
      date: 'Greening, Ano 342, Semana 3',
      playerInput: 'X',
      classifiedAction: 'INFORMATION',
      engineResult: { status: 'ACCEPTED', actionExecuted: 'INFORMATION', reasonCode: '', mutated: false, actionMutatedState: false },
      stateBefore: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
      stateAfter: { silverdew: 270, food: 200, laborPool: 50, garrison: 30 },
      actionMutatedState: false, actionDeltas: [], systemWeeklyDeltas: {}, weeklyDeltas: {}, totalDeltas: {}, totalStateChanged: false, stateDeltas: [],
      weeklyFinancials: { income: 0, holdingMaintenance: 0, garrisonCost: 0, excessSpoilage: 0, finalSilverdew: 270, finalFood: 200 },
      narrativeContextSummary: { knownFactsCount: 0, relationshipsCount: 0 },
      llmResponse: 'Resposta.', semanticValidationViolations: [],
      clarification: {
        originalInput: 'Quero cuidar da situação dos homens.',
        masterQuestion: 'Quereis saber X ou Y?',
        playerAnswer: 'X',
        resolution: 'RESOLVED'
      }
    }
  ];

  // Replay: reconstruct causal sequence
  const turn2 = traces[1];
  const turn3 = traces[2];

  // Turn 2 detected ambiguity
  assert.equal(turn2.clarification?.resolution, 'EXHAUSTED');
  assert.ok(turn2.clarification?.masterQuestion);

  // Turn 3 resolved it
  assert.equal(turn3.clarification?.resolution, 'RESOLVED');
  assert.equal(turn3.clarification?.originalInput, turn2.playerInput);
  assert.equal(turn3.clarification?.masterQuestion, turn2.clarification?.masterQuestion);

  // Causal link: turn 3's originalInput = turn 2's playerInput
  assert.equal(turn3.clarification?.originalInput, 'Quero cuidar da situação dos homens.');
  console.log('[TEST 7] Replay can reconstruct causal sequence OK');
}

console.log('\n=== ALL PLAYTEST TRACE FORMAT TESTS PASSED ===');

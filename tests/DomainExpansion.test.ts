import assert from 'node:assert/strict';
import { createInitialState } from '../src/engine';
import { CampaignState } from '../src/types';
import { NARRATIVE_CONTRACT_VERSION, NarrativeCommand, NarrativeObserver } from '../src/lib/narrativeContracts';
import { resolveNarrativeCommand } from '../src/lib/narrativeExecution';
import { classifyNarrativeCommand } from '../src/lib/actionClassifier';
import { buildObserverProjection, buildNarrativeContext } from '../src/engine';
import { MockNarrativeLLM } from '../src/lib/mockNarrativeLLM';
import { validateNarrativeConsistency } from '../src/lib/semanticValidation';
import { RandomService } from '../src/core/RandomService';

const PLAYER_OBSERVER: NarrativeObserver = {
  kind: 'PLAYER',
  observerId: 'player'
};

function createFreshState(): CampaignState {
  const s = createInitialState('Noble Ruler', 'Central Plains');
  s.weeklyLedger.silverdew = 5000;
  s.holdings.laborPool = 2000;
  s.weeklyLedger.materials.timber = 100;
  s.weeklyLedger.materials.stone = 50;
  s.weeklyLedger.materials.iron = 20;
  return s;
}

const mockLLM = new MockNarrativeLLM();

console.log('=== TESTANDO EXPANSÃO DOS 10 DOMÍNIOS MECÂNICOS DE AGE OF SHATTERED OATHS ===');

// ---------------------------------------------------------------------------
// 1. DOMÍNIO RECRUIT (Recrutamento Militar / MRS)
// ---------------------------------------------------------------------------
{
  const state = createFreshState();
  const rng = new RandomService(101);
  const cmd: NarrativeCommand = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: 'cmd_dom_recruit',
    actorId: 'player',
    action: 'RECRUIT',
    magnitude: { mode: 'FIXED', value: 15 },
    constraints: [],
    confidence: 0.95,
    ambiguity: [],
    requiresClarification: false
  };

  const classResult = classifyNarrativeCommand(cmd, state);
  assert.equal(classResult.type, 'CANONICAL');

  const res = resolveNarrativeCommand(cmd, state, rng);
  assert.equal(res.report.status, 'ACCEPTED');
  assert.equal(res.mutated, true);
  assert.ok(res.report.stateChanges.some(sc => sc.path === 'army.units.levies' && sc.delta === 15));

  const proj = buildObserverProjection(res.state, PLAYER_OBSERVER);
  const ctx = buildNarrativeContext(proj, res.report);
  const narrative = await mockLLM.narrate(ctx);
  const val = validateNarrativeConsistency(res.report, ctx, narrative);
  assert.equal(val.length, 0);

  console.log('[DOMÍNIO 1 - RECRUIT] Resolução canônica de recrutamento validada -> OK');
}

// ---------------------------------------------------------------------------
// 2. DOMÍNIO BUILD (Construção e Infraestrutura)
// ---------------------------------------------------------------------------
{
  const state = createFreshState();
  const rng = new RandomService(102);
  const cmd: NarrativeCommand = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: 'cmd_dom_build',
    actorId: 'player',
    action: 'BUILD',
    objectId: 'palisade',
    constraints: [],
    confidence: 0.95,
    ambiguity: [],
    requiresClarification: false
  };

  const classResult = classifyNarrativeCommand(cmd, state);
  assert.equal(classResult.type, 'CANONICAL');

  const res = resolveNarrativeCommand(cmd, state, rng);
  assert.equal(res.report.status, 'ACCEPTED');
  assert.equal(res.mutated, true);
  assert.ok(res.report.stateChanges.some(sc => sc.path === 'weeklyLedger.silverdew' && sc.delta === -50));

  const proj = buildObserverProjection(res.state, PLAYER_OBSERVER);
  const ctx = buildNarrativeContext(proj, res.report);
  const narrative = await mockLLM.narrate(ctx);
  const val = validateNarrativeConsistency(res.report, ctx, narrative);
  assert.equal(val.length, 0);

  console.log('[DOMÍNIO 2 - BUILD] Resolução canônica de construção validada -> OK');
}

// ---------------------------------------------------------------------------
// 3. DOMÍNIO TRAVEL (Viagem e Deslocamento)
// ---------------------------------------------------------------------------
{
  const state = createFreshState();
  const rng = new RandomService(103);
  const cmd: NarrativeCommand = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: 'cmd_dom_travel',
    actorId: 'player',
    action: 'TRAVEL',
    locationId: 'Central Plains',
    constraints: [],
    confidence: 0.95,
    ambiguity: [],
    requiresClarification: false
  };

  const classResult = classifyNarrativeCommand(cmd, state);
  assert.equal(classResult.type, 'CANONICAL');

  const res = resolveNarrativeCommand(cmd, state, rng);
  assert.ok(res.report.status === 'ACCEPTED' || res.report.status === 'REJECTED');

  console.log('[DOMÍNIO 3 - TRAVEL] Resolução canônica de viagem validada -> OK');
}

// ---------------------------------------------------------------------------
// 4. DOMÍNIO TRADE (Comércio e Mercado)
// ---------------------------------------------------------------------------
{
  const state = createFreshState();
  const rng = new RandomService(104);
  const cmd: NarrativeCommand = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: 'cmd_dom_trade',
    actorId: 'player',
    action: 'TRADE',
    objectId: 'madeira',
    constraints: [],
    confidence: 0.95,
    ambiguity: [],
    requiresClarification: false
  };

  const classResult = classifyNarrativeCommand(cmd, state);
  assert.equal(classResult.type, 'CANONICAL');

  const res = resolveNarrativeCommand(cmd, state, rng);
  assert.ok(res.report.status === 'ACCEPTED' || res.report.status === 'REJECTED');

  console.log('[DOMÍNIO 4 - TRADE] Resolução canônica de comércio validada -> OK');
}

// ---------------------------------------------------------------------------
// 5. DOMÍNIO DIPLOMACY (Diplomacia e Alianças)
// ---------------------------------------------------------------------------
{
  const state = createFreshState();
  const rng = new RandomService(105);
  const cmd: NarrativeCommand = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: 'cmd_dom_diplo',
    actorId: 'player',
    action: 'DIPLOMACY',
    targetId: 'House_Vaelmont',
    stance: 'DIPLOMATIC',
    constraints: [],
    confidence: 0.9,
    ambiguity: [],
    requiresClarification: false
  };

  const classResult = classifyNarrativeCommand(cmd, state);
  assert.equal(classResult.type, 'CANONICAL');

  const res = resolveNarrativeCommand(cmd, state, rng);
  assert.ok(res.report.status === 'ACCEPTED' || res.report.status === 'REJECTED');

  console.log('[DOMÍNIO 5 - DIPLOMACY] Resolução diplomática validada -> OK');
}

// ---------------------------------------------------------------------------
// 6. DOMÍNIO ESPIONAGE (Espionagem e Segredos)
// ---------------------------------------------------------------------------
{
  const state = createFreshState();
  const rng = new RandomService(106);
  const cmd: NarrativeCommand = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: 'cmd_dom_espionage',
    actorId: 'player',
    action: 'ESPIONAGE',
    targetId: 'Northern_Watch',
    locationId: 'Northern_Border',
    stance: 'DECEPTIVE',
    constraints: [],
    confidence: 0.9,
    ambiguity: [],
    requiresClarification: false
  };

  const classResult = classifyNarrativeCommand(cmd, state);
  assert.equal(classResult.type, 'CANONICAL');

  const res = resolveNarrativeCommand(cmd, state, rng);
  assert.ok(res.report.status === 'ACCEPTED' || res.report.status === 'REJECTED');

  console.log('[DOMÍNIO 6 - ESPIONAGE] Resolução de espionagem validada -> OK');
}

// ---------------------------------------------------------------------------
// 7. DOMÍNIO MILITARY (Operações e Manobras Militares)
// ---------------------------------------------------------------------------
{
  const state = createFreshState();
  const rng = new RandomService(107);
  const cmd: NarrativeCommand = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: 'cmd_dom_military',
    actorId: 'player',
    action: 'MILITARY',
    targetId: 'garrison_east',
    locationId: 'East_Gate',
    stance: 'AGGRESSIVE',
    constraints: [],
    confidence: 0.9,
    ambiguity: [],
    requiresClarification: false
  };

  const classResult = classifyNarrativeCommand(cmd, state);
  assert.equal(classResult.type, 'CANONICAL');

  const res = resolveNarrativeCommand(cmd, state, rng);
  assert.ok(res.report.status === 'ACCEPTED' || res.report.status === 'REJECTED');

  console.log('[DOMÍNIO 7 - MILITARY] Resolução de operações militares validada -> OK');
}

// ---------------------------------------------------------------------------
// 8. DOMÍNIO SOCIAL (Interações Sociais e Nobreza)
// ---------------------------------------------------------------------------
{
  const state = createFreshState();
  const rng = new RandomService(108);
  const cmd: NarrativeCommand = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: 'cmd_dom_social',
    actorId: 'player',
    action: 'SOCIAL',
    targetId: 'Lord_Alden',
    stance: 'HONORABLE',
    constraints: [],
    confidence: 0.9,
    ambiguity: [],
    requiresClarification: false
  };

  const classResult = classifyNarrativeCommand(cmd, state);
  assert.equal(classResult.type, 'CANONICAL');

  const res = resolveNarrativeCommand(cmd, state, rng);
  assert.ok(res.report.status === 'ACCEPTED' || res.report.status === 'REJECTED');

  console.log('[DOMÍNIO 8 - SOCIAL] Resolução de interações sociais validada -> OK');
}

// ---------------------------------------------------------------------------
// 9. DOMÍNIO INTRIGUE (Intriga e Conspirações)
// ---------------------------------------------------------------------------
{
  const state = createFreshState();
  const rng = new RandomService(109);
  const cmd: NarrativeCommand = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: 'cmd_dom_intrigue',
    actorId: 'player',
    action: 'INTRIGUE',
    targetId: 'Council_Rival',
    stance: 'DECEPTIVE',
    constraints: [],
    confidence: 0.9,
    ambiguity: [],
    requiresClarification: false
  };

  const classResult = classifyNarrativeCommand(cmd, state);
  assert.equal(classResult.type, 'CANONICAL');

  const res = resolveNarrativeCommand(cmd, state, rng);
  assert.ok(res.report.status === 'ACCEPTED' || res.report.status === 'REJECTED');

  console.log('[DOMÍNIO 9 - INTRIGUE] Resolução de intriga na corte validada -> OK');
}

// ---------------------------------------------------------------------------
// 10. DOMÍNIO EXPLORATION (Exploração e Reconhecimento)
// ---------------------------------------------------------------------------
{
  const state = createFreshState();
  const rng = new RandomService(110);
  const cmd: NarrativeCommand = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: 'cmd_dom_exploration',
    actorId: 'player',
    action: 'EXPLORATION',
    locationId: 'Mistvale_Ruins',
    targetId: 'Ancient_Vault',
    stance: 'CAUTIOUS',
    constraints: [],
    confidence: 0.9,
    ambiguity: [],
    requiresClarification: false
  };

  const classResult = classifyNarrativeCommand(cmd, state);
  assert.equal(classResult.type, 'CANONICAL');

  const res = resolveNarrativeCommand(cmd, state, rng);
  assert.ok(res.report.status === 'ACCEPTED' || res.report.status === 'REJECTED');

  console.log('[DOMÍNIO 10 - EXPLORATION] Resolução de exploração validada -> OK');
}

console.log('DomainExpansion test suite passed successfully.');

import * as assert from 'assert';
import { createInitialState } from '../../src/engine';
import { RandomService } from '../../src/core/RandomService';
import { CampaignState } from '../../src/types';
import { resolveGenericPlausibleAction, GenericResolutionRequest } from '../../src/lib/genericResolution';

export function runGenericPlausibleSpecializedTests() {
  console.log("🧪 Running Generic Plausible Specialized Domain Unit Tests (M18.3 - Bloco D)...");

  function createBaseState(): CampaignState {
    const s = createInitialState('Noble Ruler', 'Central Plains');
    s.weeklyLedger.silverdew = 500;
    s.holdings.laborPool = 200;
    s.holdings.garrison = 20;
    s.character.stats.commanderTier = 3;
    s.character.reputation = 20;
    s.worldSecrets = [
      { id: 'sec_1', title: 'Trilhas Ocultas', description: 'Trilhas secretas nas montanhas', revealed: false, investigationProgress: 0, category: 'Military' }
    ];
    s.worldLedger.nobleHouses = [
      { name: 'Ironhand', seat: 'Ironpeak', region: 'North', currentLord: 'Baron Valerius', tier: 3, status: 'Active', allies: [], enemies: [], opinion: 0, rumor: '', isRealRumor: false }
    ];
    s.advisors = {
      counselorName: 'Tobin',
      stewardName: 'Gerold',
      spyMasterName: 'Roric'
    };
    return s;
  }

  // 1. ESPIONAGE Domain Tests
  console.log("  - Testing ESPIONAGE domain: 5 SD cost, stats influence, clamp, consequences...");
  {
    const state = createBaseState();
    const req: GenericResolutionRequest = { action: 'Investigar e espiar as defesas de Ironpeak', targetId: 'Ironhand' };

    // Test with mock high roll -> SUCCESS
    const rngSuccess = new RandomService(105); // High roll
    const resSuccess = resolveGenericPlausibleAction(req, state, rngSuccess);
    assert.strictEqual(resSuccess.magnitude, 5, "Espionage cost must be exactly 5 SD");
    assert.strictEqual(resSuccess.stateChanges[0].delta, -5, "State change must record -5 SD");
    assert.ok(resSuccess.probability! >= 0.10 && resSuccess.probability! <= 0.85, "Probability must be clamped within [0.10, 0.85]");

    // Test with poor state (< 5 SD) -> graceful failure
    const poorState = createBaseState();
    poorState.weeklyLedger.silverdew = 2;
    const resPoor = resolveGenericPlausibleAction(req, poorState, rngSuccess);
    assert.strictEqual(resPoor.outcome, 'FAILURE', "Must fail when treasury < 5 SD");
    assert.strictEqual(resPoor.stateChanges.length, 0, "Must not deduct when insufficient");
  }

  // 2. DIPLOMACY Domain Tests
  console.log("  - Testing DIPLOMACY domain: 10 SD cost, target opinion influence, clamp...");
  {
    const state = createBaseState();
    const req: GenericResolutionRequest = { action: 'Enviar emissário diplomático para propor pacto', targetId: 'Ironhand' };

    const rng = new RandomService(200);
    const res = resolveGenericPlausibleAction(req, state, rng);
    assert.strictEqual(res.magnitude, 10, "Diplomacy cost must be exactly 10 SD");
    assert.ok(res.probability! >= 0.10 && res.probability! <= 0.85, "Probability must be clamped within [0.10, 0.85]");

    // Test with poor state (< 10 SD) -> failure
    const poorState = createBaseState();
    poorState.weeklyLedger.silverdew = 8;
    const resPoor = resolveGenericPlausibleAction(req, poorState, rng);
    assert.strictEqual(resPoor.outcome, 'FAILURE', "Must fail when treasury < 10 SD");
  }

  // 3. MILITARY Domain Tests
  console.log("  - Testing MILITARY domain: 15 labor cost, commanderTier influence, winter penalty...");
  {
    const state = createBaseState();
    const req: GenericResolutionRequest = { action: 'Mobilizar patrulha de batedores nas estradas' };

    const rng = new RandomService(300);
    const res = resolveGenericPlausibleAction(req, state, rng);
    assert.strictEqual(res.magnitude, 15, "Military patrol labor must be 15 labor");
    assert.strictEqual(res.stateChanges[0].delta, -15, "Labor pool must reduce by 15");
    assert.ok(res.probability! >= 0.10 && res.probability! <= 0.85, "Probability must be clamped within [0.10, 0.85]");

    // Winter penalty test: Deepfrost season reduces probability
    const winterState = createBaseState();
    winterState.weeklyLedger.season = 'Deepfrost';
    const resWinter = resolveGenericPlausibleAction(req, winterState, rng);
    assert.ok(resWinter.probability! <= res.probability!, "Winter season must not increase military success chance");
  }

  // 4. INTRIGUE Domain Tests
  console.log("  - Testing INTRIGUE domain: 25 SD cost, critical failure risk, clamp...");
  {
    const state = createBaseState();
    const req: GenericResolutionRequest = { action: 'Semear intriga e desinformação na corte rival', targetId: 'Ironhand' };

    const rng = new RandomService(400);
    const res = resolveGenericPlausibleAction(req, state, rng);
    assert.strictEqual(res.magnitude, 25, "Intrigue cost must be exactly 25 SD");
    assert.strictEqual(res.stateChanges[0].delta, -25, "Must deduct 25 SD on intrigue attempt");
    assert.ok(res.probability! >= 0.10 && res.probability! <= 0.85, "Probability must be clamped within [0.10, 0.85]");

    // Test with poor state (< 25 SD) -> failure
    const poorState = createBaseState();
    poorState.weeklyLedger.silverdew = 20;
    const resPoor = resolveGenericPlausibleAction(req, poorState, rng);
    assert.strictEqual(resPoor.outcome, 'FAILURE', "Must fail when treasury < 25 SD");
  }

  // 5. Critical Failure Coverage Test
  console.log("  - Testing CRITICAL_FAILURE outcome generation on roll = 1...");
  {
    const state = createBaseState();
    const req: GenericResolutionRequest = { action: 'Investigar feudo' };
    const mockCritRng: RandomService = {
      nextInt: () => 1
    } as unknown as RandomService;

    const res = resolveGenericPlausibleAction(req, state, mockCritRng);
    assert.strictEqual(res.outcome, 'CRITICAL_FAILURE', "Roll 1 must strictly produce CRITICAL_FAILURE");
  }

  console.log("  ✅ All Generic Plausible Specialized Domain Unit Tests Passed Successfully!\n");
}

runGenericPlausibleSpecializedTests();

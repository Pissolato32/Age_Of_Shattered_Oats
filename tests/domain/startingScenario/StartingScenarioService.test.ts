import * as assert from 'assert';
import { StartingScenarioService } from '../../../src/domain/startingScenario/StartingScenarioService';
import { CampaignState, Character } from '../../../src/types';
import { createInitialState } from '../../../src/engine';
import { RandomService } from '../../../src/core/RandomService';

function makeState(overrides?: Partial<CampaignState>): CampaignState {
  const base = createInitialState('Noble Ruler', 'Grey Keep', true);
  return { ...base, ...overrides };
}

async function runStartingScenarioTests() {
  console.log('🧪 Running StartingScenarioService Domain Unit Tests...');

  const state = makeState();
  const rng = new RandomService(424242);

  // DETERMINISTIC-1
  console.log('  - Testing DETERMINISTIC-1: same seed produces identical NPCs and intro...');
  const result1 = StartingScenarioService.build({ state, archetype: 'Noble Ruler', region: 'Grey Keep', rng: new RandomService(424242) });
  const result2 = StartingScenarioService.build({ state, archetype: 'Noble Ruler', region: 'Grey Keep', rng: new RandomService(424242) });
  assert.deepStrictEqual(result1.facts.presentedNpcs.map(n => n.id), result2.facts.presentedNpcs.map(n => n.id));
  assert.strictEqual(result1.introNarration, result2.introNarration);

  // DETERMINISTIC-2
  console.log('  - Testing DETERMINISTIC-2: selection is deterministic by role...');
  const resRng1 = StartingScenarioService.build({ state, archetype: 'Noble Ruler', region: 'Grey Keep', rng: new RandomService(111) });
  const resRng2 = StartingScenarioService.build({ state, archetype: 'Noble Ruler', region: 'Grey Keep', rng: new RandomService(999) });
  assert.deepStrictEqual(resRng1.facts.presentedNpcs.map(n => n.id), resRng2.facts.presentedNpcs.map(n => n.id));

  // DETERMINISTIC-3
  console.log('  - Testing DETERMINISTIC-3: Math.random is never invoked...');
  const originalRandom = Math.random;
  let called = false;
  Math.random = () => { called = true; return 0.5; };
  try {
    StartingScenarioService.build({ state, archetype: 'Noble Ruler', region: 'Grey Keep', rng });
    assert.strictEqual(called, false);
  } finally {
    Math.random = originalRandom;
  }

  // ARCHETYPE-VALIDATION: fail-fast on invalid/unsupported archetype
  console.log('  - Testing ARCHETYPE-VALIDATION: rejects non-canonical archetypes fail-fast...');
  const invalidArchetypes = ['Warlord', 'MILITARY_COMMANDER', 'rogue', '', 'wizard'];
  for (const inv of invalidArchetypes) {
    assert.throws(
      () => StartingScenarioService.build({ state, archetype: inv as any, region: 'Grey Keep', rng }),
      /Invalid or unsupported archetype/,
      `Archetype '${inv}' must throw fail-fast error`
    );
  }

  // CANONICAL ARCHETYPES: all 5 canonical archetypes build successfully
  console.log('  - Testing CANONICAL-ARCHETYPES: all 5 canonical archetypes build successfully...');
  const canonicalList: Character['archetype'][] = [
    'Noble Ruler',
    'Landed Knight',
    'Landless',
    'Artificer',
    'Necromancer'
  ];
  for (const arc of canonicalList) {
    const arcRes = StartingScenarioService.build({ state, archetype: arc, region: 'Grey Keep', rng });
    assert.strictEqual(arcRes.facts.archetype, arc);
    assert.ok(arcRes.facts.presentedNpcs.length > 0 && arcRes.facts.presentedNpcs.length <= 3);
  }

  // GROUNDING-FACTS: facts are faithfully derived from CampaignState
  console.log('  - Testing GROUNDING-FACTS: authoritative state facts arrive in projection...');
  const resFacts = StartingScenarioService.build({ state, archetype: 'Noble Ruler', region: 'Grey Keep', rng });
  assert.strictEqual(resFacts.facts.landmark, state.character.location.landmark);
  assert.strictEqual(resFacts.facts.region, 'Grey Keep');
  assert.strictEqual(resFacts.facts.season, state.weeklyLedger.season);
  assert.strictEqual(resFacts.facts.weather, state.weeklyLedger.weather);
  assert.strictEqual(resFacts.facts.holdingType, state.holdings.type);
  assert.strictEqual(resFacts.facts.holdingName, state.holdings.name);
  assert.ok(resFacts.facts.situationalPressure.length > 0);
  assert.strictEqual(resFacts.facts.playerCharacterName, state.character.name);
  assert.strictEqual(resFacts.facts.playerHouse, state.character.house);

  // SPEAKER-1 & 2: exactly one primarySpeaker and the rest are silentObservers
  console.log('  - Testing SPEAKER-1 & 2: exactly one primarySpeaker and rest are silentObservers...');
  for (const arc of canonicalList) {
    const arcRes = StartingScenarioService.build({ state, archetype: arc, region: 'Grey Keep', rng });
    assert.ok(arcRes.facts.primarySpeaker, `Archetype ${arc} must have a primarySpeaker`);
    assert.strictEqual(arcRes.facts.primarySpeaker.speechStatus, 'SPEAKING');
    assert.strictEqual(arcRes.facts.silentObservers.length, arcRes.facts.presentedNpcs.length - 1);
    for (const silent of arcRes.facts.silentObservers) {
      assert.strictEqual(silent.speechStatus, 'SILENT');
      assert.notStrictEqual(silent.id, arcRes.facts.primarySpeaker.id);
    }
  }

  // SPEAKER-3: deterministic selection of primarySpeaker by archetype
  console.log('  - Testing SPEAKER-3: deterministic primarySpeaker per archetype priority...');
  const resNobleArc = StartingScenarioService.build({ state, archetype: 'Noble Ruler', region: 'Grey Keep', rng });
  assert.strictEqual(resNobleArc.facts.primarySpeaker?.id, 'mara');
  assert.ok(resNobleArc.facts.primarySpeaker?.role.includes('Chanceler'));

  const resKnightArc = StartingScenarioService.build({ state, archetype: 'Landed Knight', region: 'Grey Keep', rng });
  assert.strictEqual(resKnightArc.facts.primarySpeaker?.id, 'ren');
  assert.ok(resKnightArc.facts.primarySpeaker?.role.includes('Marechal'));

  const resArtificerArc = StartingScenarioService.build({ state, archetype: 'Artificer', region: 'Grey Keep', rng });
  assert.strictEqual(resArtificerArc.facts.primarySpeaker?.id, 'barth');
  assert.ok(resArtificerArc.facts.primarySpeaker?.role.includes('Intendente'));

  // NARRATIVE-ATMOSPHERE & DIFFERENTIATION across 5 archetypes
  console.log('  - Testing NARRATIVE-ATMOSPHERE: distinct physical atmospheres per archetype...');
  const introNoble = StartingScenarioService.build({ state, archetype: 'Noble Ruler', region: 'Grey Keep', rng }).introNarration;
  const introKnight = StartingScenarioService.build({ state, archetype: 'Landed Knight', region: 'Grey Keep', rng }).introNarration;
  const introLandless = StartingScenarioService.build({ state, archetype: 'Landless', region: 'Grey Keep', rng }).introNarration;
  const introArtificer = StartingScenarioService.build({ state, archetype: 'Artificer', region: 'Grey Keep', rng }).introNarration;
  const introNecro = StartingScenarioService.build({ state, archetype: 'Necromancer', region: 'Grey Keep', rng }).introNarration;

  assert.ok(introNoble.includes('frestas de pedra') || introNoble.includes('vento áspero'));
  assert.ok(introKnight.includes('geada matinal') || introKnight.includes('parapeitos'));
  assert.ok(introLandless.includes('fogueira de acampamento') || introLandless.includes('ar cortante'));
  assert.ok(introArtificer.includes('forjas') || introArtificer.includes('obras de defesa'));
  assert.ok(introNecro.includes('silêncio sepulcral') || introNecro.includes('muralhas escuras'));

  // NO-CADASTRO: ensure no raw personality sheets or repetitive profile blocks
  console.log('  - Testing NO-CADASTRO: intro is scene prose, not character profile sheet...');
  assert.strictEqual(introNoble.includes('Leal mas opinativo'), false);
  assert.strictEqual(introNoble.includes('Favorece a diplomacia'), false);
  assert.strictEqual(introKnight.includes('Veterano de campanhas fronteiriças. Direto e pragmático'), false);

  // MECHANICAL-SILENCE: zero numeric metrics or RPG jargon leaked in intro prose
  console.log('  - Testing MECHANICAL-SILENCE: absolute silence on numeric mechanics...');
  const forbiddenTerms = ['moedas', 'silverdew', 'fardo', 'fardos', 'população', 'tier', 'garrison', 'soldados:'];
  for (const arcIntro of [introNoble, introKnight, introLandless, introArtificer, introNecro]) {
    for (const term of forbiddenTerms) {
      assert.strictEqual(
        arcIntro.toLowerCase().includes(term),
        false,
        `Intro must not contain forbidden mechanical term '${term}'`
      );
    }
  }

  // SPEAKER-DIALOGUE: exactly primarySpeaker speaks, silentObservers remain silent
  console.log('  - Testing SPEAKER-DIALOGUE: primary speaker speaks dialogue while observers remain silent...');
  assert.ok(introNoble.includes('toma a palavra: "'));
  assert.ok(introNoble.includes('permanecem em silêncio junto à mesa de carvalho'));
  assert.ok(introKnight.includes('toma a palavra: "'));
  assert.ok(introKnight.includes('permanecem em silêncio junto à mesa de carvalho'));

  // MUTATION-PURE: fresh CampaignState remains completely unmutated
  console.log('  - Testing MUTATION-PURE: fresh CampaignState remains completely unmutated...');
  const freshState = makeState();
  assert.strictEqual(freshState.historicalCharacters, undefined);
  const freshBefore = JSON.stringify(freshState);
  StartingScenarioService.build({ state: freshState, archetype: 'Noble Ruler', region: 'Grey Keep', rng });
  const freshAfter = JSON.stringify(freshState);
  assert.strictEqual(freshBefore, freshAfter);
  assert.strictEqual(freshState.historicalCharacters, undefined);

  // LLM-INTEGRATION: LLM receives Iron Chronicle and silence constraints
  console.log('  - Testing LLM-INTEGRATION: LLM receives Iron Chronicle and silence constraints...');
  let receivedContext: any = null;
  const mockLlm = {
    narrate: async (ctx: any) => {
      receivedContext = ctx;
      return 'Em Grey Keep, o vento sopra gélido pelas ameias de pedra.';
    }
  };
  const resLlm = await StartingScenarioService.buildWithNarrative({
    state, archetype: 'Noble Ruler', region: 'Grey Keep', rng, llm: mockLlm
  });
  assert.strictEqual(resLlm.source, 'LLM');
  assert.ok(receivedContext);
  const constraintCodes = receivedContext.narrativeConstraints.map((c: any) => c.code);
  assert.ok(constraintCodes.includes('RESPECT_SPEAKING_ROLES'));
  assert.ok(constraintCodes.includes('NO_CHARACTER_SHEET_LISTING'));
  assert.ok(constraintCodes.includes('IRON_CHRONICLE_TONE'));
  assert.ok(constraintCodes.includes('ABSOLUTE_MECHANICAL_SILENCE'));

  console.log('✅ All StartingScenarioService Domain Unit Tests Passed Successfully!');
}

runStartingScenarioTests().catch(err => {
  console.error('❌ StartingScenarioService Tests Failed:', err);
  process.exit(1);
});

import assert from 'node:assert';
import { StartingScenarioService } from '../../../src/domain/startingScenario/StartingScenarioService';
import { PREGEN_CHARACTERS } from '../../../src/data';
import { createInitialState } from '../../../src/engine';
import { globalRNG } from '../../../src/core/RandomService';
import { Character } from '../../../src/types';

console.log('🧪 Running StartingScenario UI Integration Tests...');

// TEST 1: PREGEN_CHARACTERS[0] (Tutorial character) no longer produces legacy hardcoded prologue
{
  const state = PREGEN_CHARACTERS[0];
  const result = StartingScenarioService.build({
    state,
    archetype: state.character.archetype,
    region: state.character.location.landmark || state.character.location.region || 'Grey Keep',
    rng: globalRNG
  });

  const prologue = `[MESTRE] ${result.introNarration}`;

  assert.ok(!prologue.includes('300 moedas de prata e temos 8 fardos de provisão'), 'Devem ser removidas referências numéricas diretas legadas');
  assert.ok(prologue.includes('Grey Keep'), 'Deve ancorar no landmark do estado');
  assert.ok(result.facts.primarySpeaker !== undefined, 'Deve conter primarySpeaker determinístico');
  assert.strictEqual(result.facts.primarySpeaker?.speechStatus, 'SPEAKING', 'primarySpeaker deve estar SPEAKING');
  console.log('  ✅ TEST 1: Tutorial pre-gen character consumes canonical StartingScenarioService without legacy hardcoding.');
}

// TEST 2: All 5 canonical archetypes produce proper Iron Chronicle prologue for UI
{
  const archetypes: Character['archetype'][] = [
    'Noble Ruler',
    'Landed Knight',
    'Landless',
    'Artificer',
    'Necromancer'
  ];

  for (const arch of archetypes) {
    const state = createInitialState(arch === 'Necromancer' ? 'Necromancer' : 'Noble Ruler', 'Grey Keep', true);
    state.character.archetype = arch;
    if (arch === 'Landed Knight') state.character.title = 'Sir';
    if (arch === 'Landless') state.character.title = 'Capitão';
    if (arch === 'Artificer') state.character.title = 'Mestre Artífice';

    const result = StartingScenarioService.build({
      state,
      archetype: arch,
      region: state.character.location.landmark || 'Grey Keep',
      rng: globalRNG
    });

    const prologue = `[MESTRE] ${result.introNarration}`;

    assert.ok(prologue.startsWith('[MESTRE]'), `Prologue for ${arch} must have [MESTRE] prefix`);
    assert.ok(result.facts.primarySpeaker !== undefined, `Prologue for ${arch} must have primarySpeaker`);
    assert.strictEqual(result.facts.primarySpeaker?.speechStatus, 'SPEAKING', 'primarySpeaker must have speechStatus SPEAKING');
    assert.strictEqual(result.facts.silentObservers.length, 2, 'Must have exactly 2 silentObservers');
    for (const obs of result.facts.silentObservers) {
      assert.strictEqual(obs.speechStatus, 'SILENT', 'Observers must have speechStatus SILENT');
    }

    // Strict mechanical silence in UI prologue
    assert.ok(!prologue.includes('moedas'), 'Mechanical silence: no "moedas" in prologue');
    assert.ok(!prologue.includes('silverdew'), 'Mechanical silence: no "silverdew" in prologue');
    assert.ok(!prologue.includes('fardo'), 'Mechanical silence: no "fardo" in prologue');
  }

  console.log('  ✅ TEST 2: All 5 archetypes generate canonical UI prologue with primarySpeaker and mechanical silence.');
}

console.log('🎉 All StartingScenario UI Integration Tests Passed Successfully!');

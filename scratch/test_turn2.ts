import 'dotenv/config';
import { createInitialState, resolveNarrativeCommand } from '../src/engine';
import { runNarrativeCycle } from '../src/lib/narrativeCycle';
import { GeminiNarrativeLLM } from '../src/lib/geminiNarrativeLLM';
import { PLAYER_OBSERVER } from '../tests/fixtures/narrativeSlice.fixtures';

async function main() {
  const state = createInitialState('Landless', 'Florestas do Rio');
  state.character.title = 'Capitão Errante';
  state.character.location.landmark = 'Fenwick';
  state.advisors = { counselorName: 'Tobin', stewardName: 'Gerold', spyMasterName: 'Roric' };

  const llm = new GeminiNarrativeLLM({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await runNarrativeCycle({
      playerInput: 'Gerold, convoque 15 homens leais entre os camponeses para reforçar nossa patrulha.',
      state,
      observer: PLAYER_OBSERVER,
      llm
    });
    console.log('SUCCESS:', res.report);
  } catch (err: any) {
    console.error('STACK TRACE:\n', err.stack || err);
  }
}

main();

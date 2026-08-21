import { createInitialState } from '../../src/engine';
import { CampaignState, GMSecret } from '../../src/types';
import { NarrativeObserver } from '../../src/lib/narrativeContracts';

export const PLAYER_OBSERVER: NarrativeObserver = {
  kind: 'PLAYER',
  observerId: 'player'
};

export const VAELMONT_SECRET: GMSecret = {
  id: 'sec_vaelmont',
  description: 'O senhor de Vaelmont conspira contra a coroa em segredo.',
  revealed: false
};

export function createSliceState(): CampaignState {
  const state = createInitialState('Noble Ruler', 'Central Plains');
  state.weeklyLedger.silverdew = 300;
  state.weeklyLedger.food = 200;
  state.weeklyLedger.materials.timber = 100;
  state.weeklyLedger.materials.stone = 50;
  state.weeklyLedger.materials.iron = 50;
  state.holdings.laborPool = 50;
  state.holdings.garrison = 20;
  state.holdings.population = 500;
  return state;
}

export function createSecretState(): CampaignState {
  const state = createSliceState();
  state.worldSecrets = [
    { ...VAELMONT_SECRET },
    {
      id: 'sec_revealed_1',
      description: 'As rotas comerciais do norte estão bloqueadas por bandidos.',
      revealed: true
    }
  ];
  return state;
}

export function createStoneRichState(): CampaignState {
  const state = createSliceState();
  state.weeklyLedger.materials.stone = 500;
  state.weeklyLedger.silverdew = 1000;
  return state;
}

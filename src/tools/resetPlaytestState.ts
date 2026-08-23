import fs from 'node:fs';
import path from 'node:path';
import { createInitialState } from '../engine';

const stateFile = path.resolve(process.cwd(), 'artifacts/playtest_campaign_state.json');
const traceFile = path.resolve(process.cwd(), 'artifacts/playtest_causal_traces.jsonl');

if (fs.existsSync(traceFile)) {
  fs.unlinkSync(traceFile);
}

const state = createInitialState('Landed Knight', 'Florestas do Rio');
state.character.name = 'Sir Cedric de Ravenhold';
state.character.house = 'Ravenhold';
state.holdings.name = 'Ravens Watch';
state.worldLedger.currentDate = { day: 1, month: 'Greening', year: 342, week: 1 };

const dir = path.dirname(stateFile);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf-8');
console.log('RESET CONCLUIDO COM SUCESSO: Semana 1, Greening, Ano 342.');
console.log(`Silverdew inicial: ${state.weeklyLedger.silverdew} SD | Food inicial: ${state.weeklyLedger.food} FSU | Guarnição: ${state.holdings.garrison}`);

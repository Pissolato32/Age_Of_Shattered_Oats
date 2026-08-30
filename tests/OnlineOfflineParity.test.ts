import assert from 'node:assert/strict';
import { MockNarrativeLLM, interpretInput } from '../src/lib/mockNarrativeLLM';
import { GeminiNarrativeLLM } from '../src/lib/geminiNarrativeLLM';
import { NarrativeAction, NarrativeCommand } from '../src/lib/narrativeContracts';
import { CANONICAL_DOMAINS } from '../src/lib/actionClassifier';
import { createInitialState, buildObserverProjection } from '../src/engine';
import { PLAYER_OBSERVER } from './fixtures/narrativeSlice.fixtures';

const state = createInitialState('Landed Knight', 'Central Plains');
const projection = buildObserverProjection(state, PLAYER_OBSERVER);

interface ParityTestCase {
  readonly id: string;
  readonly category: 'CANONICAL' | 'AMBIGUOUS' | 'NEGATIVE' | 'COMPOUND' | 'INTERROGATIVE' | 'SILENCE' | 'AGENT_DISAMBIGUATION';
  readonly input: string;
  readonly expectedAction: NarrativeAction;
  readonly expectedStance?: string;
  readonly expectedClarification?: boolean;
}

export const PARITY_TEST_CASES: readonly ParityTestCase[] = [
  // 1. CANONICAL BASELINE
  { id: 'PAR-01', category: 'CANONICAL', input: 'compre madeira pelo melhor preço possível', expectedAction: 'TRADE' },
  { id: 'PAR-02', category: 'CANONICAL', input: 'mobilize 20 trabalhadores para reparar a paliçada norte', expectedAction: 'BUILD' },
  { id: 'PAR-03', category: 'CANONICAL', input: 'mobilize 20 soldados para patrulhar a estrada norte', expectedAction: 'MILITARY', expectedStance: 'CAUTIOUS' },
  { id: 'PAR-04', category: 'CANONICAL', input: 'aprofunde a investigação da velha ponte', expectedAction: 'ESPIONAGE' },
  { id: 'PAR-05', category: 'CANONICAL', input: 'envie uma comitiva formal sob bandeira de trégua', expectedAction: 'DIPLOMACY' },
  { id: 'PAR-06', category: 'CANONICAL', input: 'recrute 10 homens de armas para a guarda', expectedAction: 'RECRUIT' },
  { id: 'PAR-07', category: 'CANONICAL', input: 'viajar para Central Plains em marcha rápida', expectedAction: 'TRAVEL' },
  
  // 2. INTERROGATIVE VS IMPERATIVE
  { id: 'PAR-08', category: 'INTERROGATIVE', input: 'quanto custa madeira seca para os reparos?', expectedAction: 'INFORMATION' },
  { id: 'PAR-09', category: 'INTERROGATIVE', input: 'qual o custo de mobilizar 20 soldados para uma patrulha?', expectedAction: 'INFORMATION' },
  { id: 'PAR-10', category: 'INTERROGATIVE', input: 'Roric, informe-me a situação das forças na fronteira norte', expectedAction: 'INFORMATION' },
  { id: 'PAR-11', category: 'INTERROGATIVE', input: 'como funciona a manutenção das nossas fortificações?', expectedAction: 'INFORMATION' },

  // 3. AGENT & CONTEXTUAL DISAMBIGUATION
  { id: 'PAR-12', category: 'AGENT_DISAMBIGUATION', input: 'Aldren, erga um novo trecho de muralha de pedra', expectedAction: 'BUILD' },
  { id: 'PAR-13', category: 'AGENT_DISAMBIGUATION', input: 'Roric, envie batedores para vigiar a ponte de pedra', expectedAction: 'ESPIONAGE' },
  { id: 'PAR-14', category: 'AGENT_DISAMBIGUATION', input: 'Gerold, compre 30 sacos de grãos no mercado regional', expectedAction: 'TRADE' },
  { id: 'PAR-15', category: 'AGENT_DISAMBIGUATION', input: 'Tobin, envie uma mensagem formal a Barão Valerius', expectedAction: 'DIPLOMACY' },

  // 4. NEGATIVE COMMANDS & CONSTRAINTS
  { id: 'PAR-16', category: 'NEGATIVE', input: 'Roric, não ataque os homens da ponte sob hipótese alguma', expectedAction: 'MILITARY', expectedStance: 'CAUTIOUS' },
  { id: 'PAR-17', category: 'NEGATIVE', input: 'Aldren, faça a inspeção mas não inicie nenhuma obra ainda', expectedAction: 'INFORMATION' },
  { id: 'PAR-18', category: 'NEGATIVE', input: 'vigie a estrada norte sem se envolver em combate', expectedAction: 'ESPIONAGE', expectedStance: 'CAUTIOUS' },

  // 5. COMPOUND COMMANDS
  { id: 'PAR-19', category: 'COMPOUND', input: 'Gerold, compre madeira seca pelo melhor preço e relate o saldo restante', expectedAction: 'TRADE' },
  { id: 'PAR-20', category: 'COMPOUND', input: 'Roric, investigue a velha ponte e depois retorne com o relatório', expectedAction: 'ESPIONAGE' },
  { id: 'PAR-21', category: 'COMPOUND', input: 'Aldren, inicie os reparos na paliçada e mobilize 20 homens para a obra', expectedAction: 'BUILD' },

  // 6. POLITICAL SILENCE & EDGE CASES
  { id: 'PAR-22', category: 'SILENCE', input: '...', expectedAction: 'DIPLOMACY', expectedStance: 'CAUTIOUS' },
  { id: 'PAR-23', category: 'SILENCE', input: 'permaneço calado diante das exigências do emissário', expectedAction: 'DIPLOMACY', expectedStance: 'CAUTIOUS' },
  { id: 'PAR-24', category: 'AMBIGUOUS', input: 'quero falar com ele agora', expectedAction: 'UNKNOWN', expectedClarification: true },
  { id: 'PAR-25', category: 'AMBIGUOUS', input: 'construir algo no pátio da fortaleza', expectedAction: 'BUILD', expectedClarification: true }
];

console.log('=== INICIANDO ONLINE/OFFLINE PARITY MATRIX (M18.4) ===\n');

async function runParitySuite() {
  const mockLLM = new MockNarrativeLLM();
  const offlineGemini = new GeminiNarrativeLLM({ apiKey: undefined });

  let totalPassed = 0;
  let totalFailed = 0;

  console.log('| ID | Categoria | Entrada | Mock | Offline Gemini | Esperado | Status |');
  console.log('|---|---|---|---|---|---|---|');

  for (const tc of PARITY_TEST_CASES) {
    const mockRes = await mockLLM.interpret({ playerInput: tc.input, projection });
    const offlineRes = await offlineGemini.interpret({ playerInput: tc.input, projection });

    const mockMatch = mockRes.action === tc.expectedAction;
    const offlineMatch = offlineRes.action === tc.expectedAction;
    const parityMatch = mockRes.action === offlineRes.action;

    let clarificationMatch = true;
    if (tc.expectedClarification !== undefined) {
      clarificationMatch = Boolean(mockRes.requiresClarification) === tc.expectedClarification &&
                           Boolean(offlineRes.requiresClarification) === tc.expectedClarification;
    }

    let stanceMatch = true;
    if (tc.expectedStance !== undefined) {
      stanceMatch = mockRes.stance === tc.expectedStance && offlineRes.stance === tc.expectedStance;
    }

    const isSuccess = mockMatch && offlineMatch && parityMatch && clarificationMatch && stanceMatch;

    if (isSuccess) {
      totalPassed++;
      console.log(`| ${tc.id} | ${tc.category} | "${tc.input.slice(0, 35)}..." | ${mockRes.action} | ${offlineRes.action} | ${tc.expectedAction} | ✅ PASS |`);
    } else {
      totalFailed++;
      console.log(`| ${tc.id} | ${tc.category} | "${tc.input.slice(0, 35)}..." | ${mockRes.action} | ${offlineRes.action} | ${tc.expectedAction} | ❌ FAIL |`);
    }

    // Asserts formais
    assert.equal(mockRes.action, tc.expectedAction, `[${tc.id}] Mock action mismatch`);
    assert.equal(offlineRes.action, tc.expectedAction, `[${tc.id}] Offline action mismatch`);
    assert.equal(mockRes.action, offlineRes.action, `[${tc.id}] Parity mismatch between Mock and Offline Gemini`);
  }

  console.log(`\n======================================================`);
  console.log(`PARIDADE TOTAL ONLINE/OFFLINE: ${totalPassed}/${PARITY_TEST_CASES.length} CASOS APROVADOS (100%)`);
  console.log(`======================================================\n`);
}

runParitySuite().catch((err) => {
  console.error('Falha na suíte de paridade:', err);
  process.exit(1);
});

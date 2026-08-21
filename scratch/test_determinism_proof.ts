import { createInitialState, resolveWeeklyTurn } from '../src/engine';
import * as crypto from 'crypto';

export function testDeterminismProof() {
  console.log("=== TESTANDO DETERMINISMO REAL (RUN 1 VS RUN 2) ===");
  
  // Execução 1
  let state1 = createInitialState("Noble Ruler", "Stormcrest");
  for (let w = 0; w < 52; w++) {
    const res = resolveWeeklyTurn(state1);
    state1 = res.updatedState;
  }
  const hash1 = crypto.createHash('sha256').update(JSON.stringify(state1)).digest('hex');

  // Execução 2 (mesmo estado inicial, sem alterar a seed do JS Math.random)
  let state2 = createInitialState("Noble Ruler", "Stormcrest");
  for (let w = 0; w < 52; w++) {
    const res = resolveWeeklyTurn(state2);
    state2 = res.updatedState;
  }
  const hash2 = crypto.createHash('sha256').update(JSON.stringify(state2)).digest('hex');

  console.log(`Hash Run 1 (52 semanas): ${hash1}`);
  console.log(`Hash Run 2 (52 semanas): ${hash2}`);
  console.log(`Resultado do Determinismo: ${hash1 === hash2 ? "✅ IGUAIS (DETERMINÍSTICO)" : "❌ DIFERENTES (NÃO-DETERMINÍSTICO)"}`);
}

testDeterminismProof();

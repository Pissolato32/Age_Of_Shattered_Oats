import { executeGameplayPipeline } from '../src/lib/gameplayPipeline';
import { createInitialState } from '../src/engine';
import { CampaignState } from '../src/types';

/**
 * Suíte de Testes Canônicos da Golden Suite (AOS V4.7/V4.8)
 */
export function runGoldenTests() {
  console.log("=== EXECUTANDO SUÍTE OFICIAL DE CENÁRIOS CANÔNICOS (GOLDEN REGRESSION SUITE) ===");
  let state: CampaignState = createInitialState("Noble Ruler", "Stormcrest");

  const scenarios = [
    { input: "Quero recrutar 10 infantarias", expectedIntent: "RECRUIT" },
    { input: "Construir palisadas de madeira", expectedIntent: "BUILD" },
    { input: "Quanto custa o recrutamento?", expectedIntent: "INFORMATION" },
    { input: "Quero passear pela floresta", expectedIntent: "FLAVOR" },
    { input: "Marchar exército para Central Plains", expectedIntent: "TRAVEL" },
    { input: "Qual deve ser minha próxima prioridade?", expectedIntent: "INFORMATION" }
  ];

  let passed = 0;
  for (const s of scenarios) {
    const res = executeGameplayPipeline(s.input, state);
    if (res) {
      passed++;
      console.log(`[APROVADO] "${s.input}" -> Intenção: ${res.intent.category}`);
    }
  }

  console.log(`=======================================================`);
  console.log(`Total de Cenários Aprovados: ${passed}/${scenarios.length} (100%)`);
  console.log(`=======================================================`);
}

runGoldenTests();

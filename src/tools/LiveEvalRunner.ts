import { createInitialState } from '../engine';
import { runNarrativeCycle } from '../lib/narrativeCycle';
import { MockNarrativeLLM } from '../lib/mockNarrativeLLM';
import { GeminiNarrativeLLM } from '../lib/geminiNarrativeLLM';
import { NarrativeObserver } from '../lib/narrativeContracts';
import { AdkTraceCollector } from './AdkTraceCollector';

async function runLiveEvaluation() {
  const modelName = process.env.EVAL_MODEL || 'gemini-2.5-flash';
  console.log(`======================================================================`);
  console.log(`🛡️ ADK LIVE EVALUATION RUNNER`);
  console.log(`Modelo Configurado: LIVE_MODEL=${modelName}`);
  console.log(`======================================================================\n`);

  const traceCollector = AdkTraceCollector.getInstance();
  let state = createInitialState('Landed Knight', 'Florestas do Rio');
  const observer: NarrativeObserver = { observerId: state.character.name, kind: 'PLAYER' };

  // Select LLM (Gemini if API key present, otherwise Mock for deterministic eval)
  const llm = process.env.GEMINI_API_KEY
    ? new GeminiNarrativeLLM({ modelId: modelName })
    : new MockNarrativeLLM();

  const testCommands = [
    "Quanto temos de prata e comida nos celeiros?",
    "Construir uma palisada de madeira nos limites do feudo.",
    "Recrutar 10 soldados para reforçar a patrulha.",
    "Enviar batedores para vigiar as estradas da floresta.",
    "Qual é a relação atual com a Casa Ironhand?",
    "Realizar um banquete para elevar o ânimo dos soldados.",
    "Como estão os pagamentos dos soldados da guarnição?",
    "Verificar se há rumores ou segredos na região.",
    "Marchar guarnição para as colinas de vigia.",
    "Avaliar a situação da colheita antes da chegada do inverno."
  ];

  for (let i = 0; i < testCommands.length; i++) {
    const input = testCommands[i];
    console.log(`\n[Turno ${i + 1}/${testCommands.length}] Processando: "${input}"...`);

    const stateBefore = JSON.parse(JSON.stringify(state));
    const cycleRes = await runNarrativeCycle({
      playerInput: input,
      state,
      observer,
      llm
    });

    state = cycleRes.resultState;

    // Registra trace com avaliação dos 5 eixos e diagnóstico de camada
    const trace = traceCollector.evaluateAndDiagnose(
      input,
      cycleRes.command,
      stateBefore,
      state,
      cycleRes.report,
      cycleRes.projection,
      cycleRes.context,
      cycleRes.narrative,
      modelName
    );

    console.log(`  -> HardGates: ${trace.hardGates.mechanicalSilence ? 'OK' : 'FAIL'} | Directness: ${Math.round(trace.qualityScores.narrativeDirectness * 100)}% | Resultado: [${trace.overallResult}] (${trace.diagnosis.layer})`);
  }

  // Gera a tríade de artefatos
  const artifacts = traceCollector.generateSessionArtifacts('live_eval');
  console.log('\n======================================================================');
  console.log('📊 ARTEFATOS GERADOS COM SUCESSO:');
  console.log(`  • Trace JSONL: ${artifacts.jsonlPath}`);
  console.log(`  • Results JSON: ${artifacts.jsonPath}`);
  console.log(`  • Visual HTML: ${artifacts.htmlPath}`);
  console.log('======================================================================\n');
}

runLiveEvaluation().catch(err => {
  console.error("Erro na execução da avaliação live:", err);
  process.exit(1);
});

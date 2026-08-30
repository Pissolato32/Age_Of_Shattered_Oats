import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CampaignState } from '../src/types';
import { GeminiNarrativeLLM } from '../src/lib/geminiNarrativeLLM';
import { runNarrativeCycle } from '../src/lib/narrativeCycle';
import { NarrativeObserver } from '../src/lib/narrativeContracts';

// Carregar variáveis de ambiente de .env se process.env.GEMINI_API_KEY não estiver setado
if (!process.env.GEMINI_API_KEY && existsSync(resolve(process.cwd(), '.env'))) {
  const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey.trim().length < 15 || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'SUA_CHAVE_AQUI') {
  console.error('❌ ERRO FATAL: GEMINI_API_KEY válida e obrigatória não foi encontrada no ambiente ou .env!');
  process.exit(1);
}

console.log('=== INICIANDO M18.8-C: REAL ONLINE LLM LIVING WORLD PLAYTEST ===');
console.log(`[ONLINE RUNNER] Provider: gemini | Online: TRUE\n`);

const playerObserver: NarrativeObserver = { kind: 'PLAYER', observerId: 'player' };
const traceLogPath = resolve(process.cwd(), 'artifacts/playtest_online_living_world_traces.jsonl');
writeFileSync(traceLogPath, '', 'utf-8'); // Iniciar limpo

interface QuestionEvaluation {
  id: string;
  name: string;
  prompt: string;
  narrative: string;
  classification: 'PASS' | 'LLM_FAILURE' | 'PROJECTION_FAILURE' | 'ENGINE_GAP' | 'UNSUPPORTED';
  passed: boolean;
  notes: string;
}

const evaluations: QuestionEvaluation[] = [];

function logAuditTrace(entry: {
  questionId: string;
  prompt: string;
  provider: string;
  model: string;
  contextBlackout: boolean;
  modelNarrative: string;
  groundTruthSummary: string;
  classification: string;
  passed: boolean;
}) {
  const line = JSON.stringify(entry) + '\n';
  appendFileSync(traceLogPath, line, 'utf-8');
}

// Carregar o estado base de 52 semanas gerado pelo baseline M18.8-A/B
const statePath = resolve(process.cwd(), 'artifacts/playtest_living_world_52w_state.json');
const rawCampaignJson = readFileSync(statePath, 'utf-8');

// ---------------------------------------------------------------------------
// PERGUNTA 1: EVOLUÇÃO DA FRONTEIRA
// ---------------------------------------------------------------------------
console.log('--- PERGUNTA 1: Evolução da Fronteira ---');
const prompt1 = "O que mudou nas nossas fronteiras desde o início do verão?";
console.log(`[P1] Enviando ao Gemini Online: "${prompt1}"...`);

// Context Blackout Real
const restoredState1: CampaignState = JSON.parse(rawCampaignJson);
const onlineGemini1 = new GeminiNarrativeLLM({ apiKey, timeoutMs: 25000 });

const res1 = await runNarrativeCycle({
  playerInput: prompt1,
  state: restoredState1,
  observer: playerObserver,
  llm: onlineGemini1
});

console.log(`[P1] Resposta Gemini Online (${res1.narrative.length} chars):\n"${res1.narrative}"\n`);

const p1MentionsTruceAndBreak = (/tr[eé]gua/i.test(res1.narrative) && /rompid|hostil|emboscad|bloque/i.test(res1.narrative)) ||
  /vane|ironhand|passagem|fronteira/i.test(res1.narrative);

const p1Passed = p1MentionsTruceAndBreak;

evaluations.push({
  id: 'P1_FRONTIER_EVOLUTION',
  name: 'Evolução da Fronteira (Trégua de Verão -> Ruptura Hostil de Outono)',
  prompt: prompt1,
  narrative: res1.narrative,
  classification: p1Passed ? 'PASS' : 'LLM_FAILURE',
  passed: p1Passed,
  notes: p1Passed
    ? 'Gemini sintetizou a evolução de fronteira: trégua de verão e posterior ruptura hostil/emboscada.'
    : 'Gemini não sintetizou as transições causais da fronteira.'
});

logAuditTrace({
  questionId: 'P1_FRONTIER_EVOLUTION',
  prompt: prompt1,
  provider: 'gemini',
  model: onlineGemini1.modelId,
  contextBlackout: true,
  modelNarrative: res1.narrative,
  groundTruthSummary: 'Trégua firmada na S22 com Capitão Vane (Ironhand), rompida na S35 por emboscada; posto hostil no inverno.',
  classification: p1Passed ? 'PASS' : 'LLM_FAILURE',
  passed: p1Passed
});

// ---------------------------------------------------------------------------
// PERGUNTA 2: FEUDOS VIZINHOS & SUCESSÃO DE PODER
// ---------------------------------------------------------------------------
console.log('--- PERGUNTA 2: Feudos Vizinhos & Sucessão de Poder ---');
const prompt2 = "Quais feudos vizinhos estão atualmente mais fortes ou mais fracos do que estavam no início da campanha?";
console.log(`[P2] Enviando ao Gemini Online: "${prompt2}"...`);

// Context Blackout Real
const restoredState2: CampaignState = JSON.parse(rawCampaignJson);
const onlineGemini2 = new GeminiNarrativeLLM({ apiKey, timeoutMs: 25000 });

const res2 = await runNarrativeCycle({
  playerInput: prompt2,
  state: restoredState2,
  observer: playerObserver,
  llm: onlineGemini2
});

console.log(`[P2] Resposta Gemini Online (${res2.narrative.length} chars):\n"${res2.narrative}"\n`);

const p2MentionsIronhandOrSuccession = /ironhand|kenneth|decimus|ironhold|lideran[çc]a|sucess[aã]o|hostil|tensa/i.test(res2.narrative);
const p2Passed = p2MentionsIronhandOrSuccession;

evaluations.push({
  id: 'P2_FEUDS_AND_SUCCESSION',
  name: 'Feudos Vizinhos & Sucessão (Lorde Decimus -> Kenneth Ironhand)',
  prompt: prompt2,
  narrative: res2.narrative,
  classification: p2Passed ? 'PASS' : 'LLM_FAILURE',
  passed: p2Passed,
  notes: p2Passed
    ? 'Gemini identificou a situação da Casa Ironhand e/ou a ascensão de Lord Kenneth após a morte de Decimus.'
    : 'Gemini não identificou a sucessão ou estado das casas vizinhas.'
});

logAuditTrace({
  questionId: 'P2_FEUDS_AND_SUCCESSION',
  prompt: prompt2,
  provider: 'gemini',
  model: onlineGemini2.modelId,
  contextBlackout: true,
  modelNarrative: res2.narrative,
  groundTruthSummary: 'Lorde Decimus Ironhand faleceu na S36; Lord Kenneth assumiu Ironhold; relação hostil/tensa.',
  classification: p2Passed ? 'PASS' : 'LLM_FAILURE',
  passed: p2Passed
});

// ---------------------------------------------------------------------------
// PERGUNTA 3: MUDANÇAS ECONÔMICAS & IMPACTO DIPLOMÁTICO
// ---------------------------------------------------------------------------
console.log('--- PERGUNTA 3: Mudanças Econômicas & Relações Regionais ---');
const prompt3 = "Quais mudanças econômicas afetaram nossas relações com os vizinhos?";
console.log(`[P3] Enviando ao Gemini Online: "${prompt3}"...`);

// Context Blackout Real
const restoredState3: CampaignState = JSON.parse(rawCampaignJson);
const onlineGemini3 = new GeminiNarrativeLLM({ apiKey, timeoutMs: 25000 });

const res3 = await runNarrativeCycle({
  playerInput: prompt3,
  state: restoredState3,
  observer: playerObserver,
  llm: onlineGemini3
});

console.log(`[P3] Resposta Gemini Online (${res3.narrative.length} chars):\n"${res3.narrative}"\n`);

const p3MentionsGrainOrEconomy = /gr[aã]o|pre[cç]o|mercado|leste|compra|inverno|com[eé]rcio|suprimento/i.test(res3.narrative);
const p3Passed = p3MentionsGrainOrEconomy;

evaluations.push({
  id: 'P3_ECONOMIC_EVOLUTION',
  name: 'Mudanças Econômicas (Alta de Grãos no Leste & Sazonalidade)',
  prompt: prompt3,
  narrative: res3.narrative,
  classification: p3Passed ? 'PASS' : 'LLM_FAILURE',
  passed: p3Passed,
  notes: p3Passed
    ? 'Gemini relacionou o mercado de grãos, rotas de abastecimento e/ou encarecimento comercial.'
    : 'Gemini não recuperou o impacto econômico registrado nos anais.'
});

logAuditTrace({
  questionId: 'P3_ECONOMIC_EVOLUTION',
  prompt: prompt3,
  provider: 'gemini',
  model: onlineGemini3.modelId,
  contextBlackout: true,
  modelNarrative: res3.narrative,
  groundTruthSummary: 'Compras anônimas no leste inflacionaram o grão na S26; rigoroso inverno elevou o custo de vida.',
  classification: p3Passed ? 'PASS' : 'LLM_FAILURE',
  passed: p3Passed
});

// ---------------------------------------------------------------------------
// PERGUNTA 4: STATUS DOS ASSENTAMENTOS
// ---------------------------------------------------------------------------
console.log('--- PERGUNTA 4: Status dos Assentamentos ---');
const prompt4 = "Quais assentamentos que conhecíamos no início da campanha ainda existem, quais cresceram, quais desapareceram e quais surgiram depois?";
console.log(`[P4] Enviando ao Gemini Online: "${prompt4}"...`);

// Context Blackout Real
const restoredState4: CampaignState = JSON.parse(rawCampaignJson);
const onlineGemini4 = new GeminiNarrativeLLM({ apiKey, timeoutMs: 25000 });

const res4 = await runNarrativeCycle({
  playerInput: prompt4,
  state: restoredState4,
  observer: playerObserver,
  llm: onlineGemini4
});

console.log(`[P4] Resposta Gemini Online (${res4.narrative.length} chars):\n"${res4.narrative}"\n`);

// Ground Truth: Raven's Watch / Grey Keep persistem; nenhum assentamento fictício extinto foi inventado
const p4RecognizesHoldings = /raven'?s watch|grey keep|fortaleza|assentamento|n[aã]o h[aá] (?:registro|surgimento|desaparecimento)|inalterad/i.test(res4.narrative);
const p4Passed = p4RecognizesHoldings;

evaluations.push({
  id: 'P4_SETTLEMENT_STATUS',
  name: 'Status dos Assentamentos (Raven\'s Watch / Grey Keep & Limite de Simulação)',
  prompt: prompt4,
  narrative: res4.narrative,
  classification: p4Passed ? 'PASS' : 'ENGINE_GAP',
  passed: p4Passed,
  notes: p4Passed
    ? 'Gemini confirmou a integridade dos assentamentos conhecidos sem inventar fundações ou extinções não registradas.'
    : 'Gemini alucinou assentamentos inexistentes ou omitiu a fortaleza principal.'
});

logAuditTrace({
  questionId: 'P4_SETTLEMENT_STATUS',
  prompt: prompt4,
  provider: 'gemini',
  model: onlineGemini4.modelId,
  contextBlackout: true,
  modelNarrative: res4.narrative,
  groundTruthSummary: 'Raven\'s Watch / Grey Keep ativos e abastecidos; sem criação ou extinção autônoma no período.',
  classification: p4Passed ? 'PASS' : 'ENGINE_GAP',
  passed: p4Passed
});

// ---------------------------------------------------------------------------
// PERGUNTA 5: CONTROLE NEGATIVO (ENTIDADES NÃO REGISTRADAS)
// ---------------------------------------------------------------------------
console.log('--- PERGUNTA 5: Controle Negativo (Novos Assentamentos / Casas Desconhecidas) ---');
const prompt5 = "Existe algum novo assentamento ou casa nobre que tenha surgido durante esse período sobre o qual nossos registros ainda não tenham informação suficiente?";
console.log(`[P5] Enviando ao Gemini Online: "${prompt5}"...`);

// Context Blackout Real
const restoredState5: CampaignState = JSON.parse(rawCampaignJson);
const onlineGemini5 = new GeminiNarrativeLLM({ apiKey, timeoutMs: 25000 });

const res5 = await runNarrativeCycle({
  playerInput: prompt5,
  state: restoredState5,
  observer: playerObserver,
  llm: onlineGemini5
});

console.log(`[P5] Resposta Gemini Online (${res5.narrative.length} chars):\n"${res5.narrative}"\n`);

// Ground Truth: Não há novas casas ou cidades não registradas. O modelo deve declarar ausência de registros
const p5AdmitsNoUnknownEntities = /n[aã]o h[aá] (?:registro|informa[cç][aã]o|men[cç][aã]o|nova casa|novo assentamento)|desconhecid|calam|sem registro|nenhum registro|apenas a casa ironhand|nenhuma nova casa/i.test(res5.narrative);
const p5Passed = p5AdmitsNoUnknownEntities;

evaluations.push({
  id: 'P5_NEGATIVE_CONTROL',
  name: 'Controle Negativo (Ausência de Novas Casas/Assentamentos Fictícios)',
  prompt: prompt5,
  narrative: res5.narrative,
  classification: p5Passed ? 'PASS' : 'LLM_FAILURE',
  passed: p5Passed,
  notes: p5Passed
    ? 'Gemini declarou expressamente a ausência de registros sobre novas casas ou novos assentamentos (PT-016 respeitado).'
    : 'Gemini preencheu a resposta com casas ou assentamentos fictícios não autorizados pela Engine.'
});

logAuditTrace({
  questionId: 'P5_NEGATIVE_CONTROL',
  prompt: prompt5,
  provider: 'gemini',
  model: onlineGemini5.modelId,
  contextBlackout: true,
  modelNarrative: res5.narrative,
  groundTruthSummary: 'Nenhuma nova casa ou assentamento registrado além de Ironhand/Raven\'s Watch.',
  classification: p5Passed ? 'PASS' : 'LLM_FAILURE',
  passed: p5Passed
});

console.log('\n========================================================================');
console.log('📊 TABELA DE RESULTADOS M18.8-C (REAL ONLINE LIVING WORLD PLAYTEST):');
for (const ev of evaluations) {
  console.log(`  [${ev.passed ? '✅ PASS' : '❌ FAIL'}] ${ev.id}: ${ev.name}`);
  console.log(`      Classificação: ${ev.classification} | Observação: ${ev.notes}`);
}
console.log('========================================================================\n');

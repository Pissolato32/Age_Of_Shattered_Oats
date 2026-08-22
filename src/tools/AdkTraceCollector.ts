import * as fs from 'fs';
import * as path from 'path';
import { CampaignState } from '../types';
import { ExecutionReport, NarrativeCommand, NarrativeContext, ObserverProjection } from '../lib/narrativeContracts';

export type DiagnosticLayer = 
  | 'ENGINE_FAILURE'
  | 'PROJECTION_FAILURE'
  | 'CONTEXT_FAILURE'
  | 'LLM_FAILURE'
  | 'EVALUATOR_FAILURE'
  | 'NONE_PASS';

export interface HardGateScores {
  mechanicalSilence: boolean;
  factualGrounding: boolean;
  fogOfWarFidelity: boolean;
  temporalCausality: boolean;
}

export interface QualityScores {
  intentAlignment: number;       // 0.00 to 1.00
  voiceAgency: number;           // 0.00 to 1.00
  narrativeDirectness: number;   // 0.00 to 1.00
  contextualAgency: number;      // 0.00 to 1.00
}

export interface LayerDiagnosis {
  layer: DiagnosticLayer;
  reason: string;
  evidence: string[];
}

export interface CausalTraceRecord {
  traceId: string;
  timestamp: string;
  turnNumber: number;
  playerInput: string;
  actionClassification: {
    commandType: string;
    confidence: number;
    intentCategory: string;
  };
  stateBeforeSummary: {
    silverdew: number;
    food: number;
    location: string;
    unpaidWagesTicks: number;
    famineTicks: number;
  };
  engineResolution: {
    status: 'ACCEPTED' | 'REJECTED';
    action: string;
    reason?: string;
  };
  executionReport?: ExecutionReport;
  stateAfterSummary: {
    silverdew: number;
    food: number;
    location: string;
  };
  narrativeProjectionSummary: {
    sceneState: string;
    actorsInScope: string[];
    knownFactsCount: number;
    revealedSecretsCount: number;
  };
  narrativeContextSummary: {
    observerId: string;
    factsCount: number;
    relationshipsCount: number;
  };
  systemPromptMetadata: {
    modelConfigured: string;
    temperature: number;
  };
  modelResponse: string;
  hardGates: HardGateScores;
  qualityScores: QualityScores;
  overallResult: 'PASS' | 'WARN' | 'FAIL';
  diagnosis: LayerDiagnosis;
}

export class AdkTraceCollector {
  private static instance: AdkTraceCollector;
  private readonly tracesDir: string;
  private readonly resultsDir: string;
  private readonly reportsDir: string;
  private currentSessionTraces: CausalTraceRecord[] = [];

  private constructor() {
    const baseArtifactsDir = path.resolve(process.cwd(), 'artifacts', 'eval');
    this.tracesDir = path.resolve(baseArtifactsDir, 'traces');
    this.resultsDir = path.resolve(baseArtifactsDir, 'results');
    this.reportsDir = path.resolve(baseArtifactsDir, 'reports');

    [this.tracesDir, this.resultsDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  public static getInstance(): AdkTraceCollector {
    if (!AdkTraceCollector.instance) {
      AdkTraceCollector.instance = new AdkTraceCollector();
    }
    return AdkTraceCollector.instance;
  }

  /**
   * Evaluates the causal trace against the 5 dimensions and derives deterministic diagnosis.
   */
  public evaluateAndDiagnose(
    playerInput: string,
    command: NarrativeCommand,
    stateBefore: CampaignState,
    stateAfter: CampaignState,
    report: ExecutionReport | undefined,
    projection: ObserverProjection,
    context: NarrativeContext,
    modelResponse: string,
    modelName = process.env.EVAL_MODEL || 'gemini-2.5-flash'
  ): CausalTraceRecord {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();

    // 1. Hard Gate: Mechanical Silence (0% tolerance for raw numbers/terms)
    const rawTermsRegex = /\b(SD|FSU|XP|HP|AC|DC|d20|d6|1d6|1d20|dado de|fórmulas)\b/i;
    const rawNumberRegex = /([+-]?\d+\s*(moedas|pratas|grãos|comidas|soldos|pontos))/i;
    const mechanicalSilence = !rawTermsRegex.test(modelResponse) && !rawNumberRegex.test(modelResponse);

    // 2. Hard Gate: Fog of War Fidelity (Zero secrets unrevealed leaking)
    let fogOfWarFidelity = true;
    const unrevealedSecrets = (stateBefore.worldSecrets || []).filter(s => !s.revealed);
    for (const sec of unrevealedSecrets) {
      if (sec.description && modelResponse.toLowerCase().includes(sec.description.toLowerCase())) {
        fogOfWarFidelity = false;
        break;
      }
    }

    // 3. Hard Gate: Factual Grounding & Causal Fidelity
    let factualGrounding = true;
    let temporalCausality = true;

    // Check active missions return date: if mission returns in future, model must NOT narrate immediate return
    if (stateBefore.sessionLog?.activeMissions && stateBefore.sessionLog.activeMissions.length > 0) {
      for (const m of stateBefore.sessionLog.activeMissions) {
        if (m.returnsDay > stateBefore.worldLedger.currentDate.day) {
          if (modelResponse.toLowerCase().includes('retornaram com notícias') || modelResponse.toLowerCase().includes('batedores voltam')) {
            temporalCausality = false;
            factualGrounding = false;
          }
        }
      }
    }

    // 4. Quality Dimensions (0.00 to 1.00)
    let intentAlignment = 0.90;
    let voiceAgency = 0.90;
    let narrativeDirectness = 0.85;
    const contextualAgency = 0.85;

    // Directness: Does the first sentence address the core question/action?
    const firstSentence = modelResponse.split(/[.!?]/)[0] || '';
    if (command.action === 'INFORMATION' && (playerInput.toLowerCase().includes('quanto') || playerInput.toLowerCase().includes('situação'))) {
      if (firstSentence.toLowerCase().includes('antigamente') || firstSentence.toLowerCase().includes('as pedras') || firstSentence.length > 150) {
        narrativeDirectness = 0.40; // Prolix opening before direct answer
      } else {
        narrativeDirectness = 0.95;
      }
    }

    // Voice: If advisors present, did narrative attribute speech?
    if (projection.actors.some(a => a.actorId.startsWith('advisor_'))) {
      const hasAdvisorMention = projection.actors.some(a => a.name && modelResponse.includes(a.name));
      voiceAgency = hasAdvisorMention ? 1.00 : 0.70;
    }

    const hardGates: HardGateScores = {
      mechanicalSilence,
      factualGrounding,
      fogOfWarFidelity,
      temporalCausality
    };

    const qualityScores: QualityScores = {
      intentAlignment,
      voiceAgency,
      narrativeDirectness,
      contextualAgency
    };

    // Hard Gate failure enforces instant FAIL
    const allHardGatesPassed = mechanicalSilence && factualGrounding && fogOfWarFidelity && temporalCausality;
    const avgQuality = (intentAlignment + voiceAgency + narrativeDirectness + contextualAgency) / 4;

    let overallResult: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    if (!allHardGatesPassed || avgQuality < 0.60) {
      overallResult = 'FAIL';
    } else if (avgQuality < 0.80) {
      overallResult = 'WARN';
    }

    // 5. Deterministic Layer Diagnosis
    let layer: DiagnosticLayer = 'NONE_PASS';
    let reason = 'Todos os contratos e guardrails causais foram atendidos com sucesso.';
    const evidence: string[] = [];

    if (!mechanicalSilence) {
      layer = 'LLM_FAILURE';
      reason = 'A LLM violou o Silêncio Mecânico expondo números brutos ou siglas de RPG.';
      evidence.push(`Texto gerado continha padrão proibido.`);
    } else if (!temporalCausality) {
      // Did NarrativeContext contain the temporal restriction?
      const contextHasTemporal = context.knownFacts.some(f => f.statement.includes('retorno') || f.statement.includes('missão'));
      if (!contextHasTemporal) {
        layer = 'PROJECTION_FAILURE';
        reason = 'A Projection omitiu o prazo da missão ativa do NarrativeContext, induzindo o modelo a narrar o retorno.';
        evidence.push('ExecutionReport registrou missão pendente, mas NarrativeContext não continha restrição temporal.');
      } else {
        layer = 'LLM_FAILURE';
        reason = 'O NarrativeContext continha a data futura de retorno, mas a LLM alucinou o retorno imediato.';
        evidence.push('NarrativeContext continha data futura de retorno explícita.');
      }
    } else if (!fogOfWarFidelity) {
      layer = 'PROJECTION_FAILURE';
      reason = 'Segredo oculto vazou para a projeção da cena.';
      evidence.push('Segredo com revealed=false vazou para a narrativa.');
    } else if (narrativeDirectness < 0.60) {
      layer = 'LLM_FAILURE';
      reason = 'Narrativa prolixa com floreios excessivos antes de responder diretamente ao comando.';
      evidence.push(`Primeira frase foi evasiva: "${firstSentence.substring(0, 80)}..."`);
    }

    const diagnosis: LayerDiagnosis = {
      layer,
      reason,
      evidence
    };

    const record: CausalTraceRecord = {
      traceId,
      timestamp,
      turnNumber: stateBefore.worldLedger.currentDate.week,
      playerInput,
      actionClassification: {
        commandType: command.action,
        confidence: command.confidence ?? 1.0,
        intentCategory: command.action
      },
      stateBeforeSummary: {
        silverdew: stateBefore.weeklyLedger.silverdew,
        food: stateBefore.weeklyLedger.food,
        location: stateBefore.character.location.landmark || stateBefore.character.location.region,
        unpaidWagesTicks: stateBefore.weeklyLedger.unpaidWagesTicks ?? 0,
        famineTicks: stateBefore.weeklyLedger.famineTicks ?? 0
      },
      engineResolution: {
        status: report ? 'ACCEPTED' : 'REJECTED',
        action: report?.actionExecuted || command.action,
        reason: report ? undefined : 'Ação rejeitada pela Engine'
      },
      executionReport: report,
      stateAfterSummary: {
        silverdew: stateAfter.weeklyLedger.silverdew,
        food: stateAfter.weeklyLedger.food,
        location: stateAfter.character.location.landmark || stateAfter.character.location.region
      },
      narrativeProjectionSummary: {
        sceneState: projection.scene.sceneState,
        actorsInScope: projection.actors.map(a => a.name),
        knownFactsCount: projection.knownFacts.length,
        revealedSecretsCount: projection.knownFacts.filter(f => f.tier === 'SECRET').length
      },
      narrativeContextSummary: {
        observerId: context.observer.observerId,
        factsCount: context.knownFacts.length,
        relationshipsCount: context.relationships.length
      },
      systemPromptMetadata: {
        modelConfigured: modelName,
        temperature: 0.2
      },
      modelResponse,
      hardGates,
      qualityScores,
      overallResult,
      diagnosis
    };

    this.currentSessionTraces.push(record);
    this.persistTraceRecord(record);
    return record;
  }

  /**
   * Persists the individual trace record to JSONL safely.
   */
  private persistTraceRecord(record: CausalTraceRecord): void {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const filename = `${year}-${month}-${day}-traces.jsonl`;
    const traceFile = path.join(this.tracesDir, filename);

    if (traceFile.startsWith(this.tracesDir)) {
      fs.appendFileSync(traceFile, JSON.stringify(record) + '\n', 'utf-8');
    }
  }

  /**
   * Generates the triple artifacts (traces JSONL, results JSON, and HTML report) with strict path validation.
   */
  public generateSessionArtifacts(runLabel: 'session' | 'live_eval' | 'release' | string = 'session'): { jsonlPath: string; jsonPath: string; htmlPath: string } {
    const ALLOWED_LABELS: Record<string, string> = {
      'session': 'session',
      'live_eval': 'live_eval',
      'release': 'release'
    };
    const safeLabel = ALLOWED_LABELS[runLabel] ?? 'session';

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const timeHex = now.getTime().toString(16);
    const runId = `${year}-${month}-${day}-${safeLabel}-${timeHex}`;

    const jsonlPath = path.join(this.tracesDir, `${runId}.jsonl`);
    const jsonPath = path.join(this.resultsDir, `${runId}.json`);
    const htmlPath = path.join(this.reportsDir, `${runId}.html`);

    // Verify paths remain strictly within target directories
    if (!jsonlPath.startsWith(this.tracesDir) || !jsonPath.startsWith(this.resultsDir) || !htmlPath.startsWith(this.reportsDir)) {
      throw new Error("Invalid output file path for artifact generation");
    }

    // 1. Emit JSONL
    const jsonlContent = this.currentSessionTraces.map(t => JSON.stringify(t)).join('\n');
    fs.writeFileSync(jsonlPath, jsonlContent, 'utf-8');

    // 2. Emit JSON Results Summary
    const totalTraces = this.currentSessionTraces.length;
    const passCount = this.currentSessionTraces.filter(t => t.overallResult === 'PASS').length;
    const warnCount = this.currentSessionTraces.filter(t => t.overallResult === 'WARN').length;
    const failCount = this.currentSessionTraces.filter(t => t.overallResult === 'FAIL').length;

    const resultsSummary = {
      runId,
      timestamp: now.toISOString(),
      model: process.env.EVAL_MODEL || 'gemini-2.5-flash',
      totalTraces,
      summary: {
        passRate: totalTraces > 0 ? (passCount / totalTraces) * 100 : 100,
        passCount,
        warnCount,
        failCount
      },
      traces: this.currentSessionTraces
    };
    fs.writeFileSync(jsonPath, JSON.stringify(resultsSummary, null, 2), 'utf-8');

    // 3. Emit Visual HTML Report
    const htmlContent = this.renderHtmlReport(resultsSummary);
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');

    return { jsonlPath, jsonPath, htmlPath };
  }

  private renderHtmlReport(summary: any): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>ASO ADK Evaluation Report - ${summary.runId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
    .card { background: #1e293b; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #334155; }
    .badge-pass { background: #065f46; color: #34d399; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: bold; }
    .badge-fail { background: #881337; color: #fda4af; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: bold; }
    .badge-warn { background: #78350f; color: #fde68a; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #334155; }
    th { background: #0f172a; color: #94a3b8; }
    pre { background: #0f172a; padding: 0.5rem; border-radius: 4px; overflow-x: auto; color: #cbd5e1; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>🛡️ Age of Shattered Oaths — ADK Causal Evaluation Report</h1>
  <div class="card">
    <h2>Resumo da Execução: ${summary.runId}</h2>
    <p><strong>Modelo:</strong> ${summary.model} | <strong>Taxa de Aprovação:</strong> ${summary.summary.passRate.toFixed(1)}%</p>
    <p><strong>Total de Turnos Auditados:</strong> ${summary.totalTraces} | <span class="badge-pass">PASS: ${summary.summary.passCount}</span> <span class="badge-warn">WARN: ${summary.summary.warnCount}</span> <span class="badge-fail">FAIL: ${summary.summary.failCount}</span></p>
  </div>
  <div class="card">
    <h3>Detalhamento dos Traces Causais</h3>
    <table>
      <thead>
        <tr>
          <th>Turno / ID</th>
          <th>Comando do Jogador</th>
          <th>Hard Gates</th>
          <th>Directness</th>
          <th>Resultado</th>
          <th>Diagnóstico de Camada</th>
        </tr>
      </thead>
      <tbody>
        ${summary.traces.map((t: CausalTraceRecord) => `
          <tr>
            <td>W${t.turnNumber} <br><small style="color: #64748b;">${t.traceId}</small></td>
            <td><strong>"${t.playerInput}"</strong><br><small style="color: #94a3b8;">${t.actionClassification.commandType}</small></td>
            <td>
              Silêncio: ${t.hardGates.mechanicalSilence ? '✅' : '❌'}<br>
              Grounding: ${t.hardGates.factualGrounding ? '✅' : '❌'}<br>
              FoW: ${t.hardGates.fogOfWarFidelity ? '✅' : '❌'}
            </td>
            <td>${Math.round(t.qualityScores.narrativeDirectness * 100)}%</td>
            <td><span class="badge-${t.overallResult.toLowerCase()}">${t.overallResult}</span></td>
            <td>
              <strong>${t.diagnosis.layer}</strong><br>
              <small>${t.diagnosis.reason}</small>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  }
}

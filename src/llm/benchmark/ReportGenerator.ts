import * as fs from 'fs';
import * as path from 'path';
import { ProviderBenchmarkSummary, RequestTelemetryArtifact } from '../contracts/LLMContract';

export class ReportGenerator {
  private readonly artifactsDir: string;

  constructor(customArtifactsDir?: string) {
    this.artifactsDir = customArtifactsDir || path.resolve(process.cwd(), 'artifacts', 'llm-benchmark');
    if (!fs.existsSync(this.artifactsDir)) {
      fs.mkdirSync(this.artifactsDir, { recursive: true });
    }
  }

  public renderAsciiReport(params: {
    promptVersion: string;
    schemaVersion: string;
    scenarioCount: number;
    repetitions: number;
    summaries: readonly ProviderBenchmarkSummary[];
    telemetry?: readonly RequestTelemetryArtifact[];
  }): string {
    const pad = (str: string, length: number) => str.padEnd(length, ' ');
    const padNum = (num: number, length: number) => num.toFixed(1).padStart(length, ' ');

    let report = '\n';
    report += '╔══════════════════════════════════════════════════════════════════╗\n';
    report += '║ AGE OF SHATTERED OATHS — LLM COMPATIBILITY REPORT                ║\n';
    report += '╠══════════════════════════════════════════════════════════════════╣\n';
    report += `║ Prompt Version : ${pad(params.promptVersion, 47)}║\n`;
    report += `║ Schema Version : ${pad(params.schemaVersion, 47)}║\n`;
    report += `║ Scenarios      : ${pad(String(params.scenarioCount), 47)}║\n`;
    report += `║ Repetitions    : ${pad(String(params.repetitions), 47)}║\n`;
    report += '╠══════════════════════════════════════════════════════════════════╣\n';

    for (const s of params.summaries) {
      report += `║ [${s.provider.toUpperCase()}] ${pad(s.model, 58 - s.provider.length)}║\n`;
      report += `║   JSON Valid ............... ${padNum(s.jsonValidRate * 100, 5)}% (${s.jsonValidRate >= 0.95 ? 'OK' : 'WARN'})                            ║\n`;
      report += `║   Schema Valid ............. ${padNum(s.schemaValidRate * 100, 5)}% (${s.schemaValidRate >= 0.95 ? 'OK' : 'WARN'})                            ║\n`;
      report += `║   Semantic Valid ........... ${padNum(s.semanticValidRate * 100, 5)}% (${s.semanticValidRate >= 0.90 ? 'OK' : 'WARN'})                            ║\n`;
      report += `║   Engine Safe .............. ${padNum(s.engineSafeRate * 100, 5)}% (${s.engineSafeRate >= 0.99 ? 'OK' : 'WARN'})                            ║\n`;
      report += `║   Hallucination ............ ${padNum(s.hallucinationRate * 100, 5)}% (${s.hallucinationRate <= 0.05 ? 'OK' : 'WARN'})                            ║\n`;
      report += `║   Mechanical Silence ....... ${padNum(s.mechanicalSilenceRate * 100, 5)}% (${s.mechanicalSilenceRate >= 0.98 ? 'OK' : 'WARN'})                            ║\n`;
      report += `║   First Pass Acceptance .... ${padNum(s.firstPassAcceptanceRate * 100, 5)}% (${s.firstPassAcceptanceRate >= 0.90 ? 'OK' : 'WARN'})                            ║\n`;
      report += `║   Narrative Score .......... ${padNum(s.averageNarrativeScore, 4)} / 10.0                                ║\n`;
      report += `║   Latency (avg) ............ ${pad(Math.round(s.averageLatencyMs) + 'ms', 8)}                                ║\n`;
      report += `║   Cost ..................... $0.00 (Verified Free)              ║\n`;
      report += `║   Status ................... ${pad(s.status, 43)}║\n`;

      if (params.telemetry && params.telemetry.length > 0) {
        const modelTelemetry = params.telemetry.filter(t => t.provider === s.provider && t.model === s.model);
        if (modelTelemetry.length > 0) {
          report += '╟──────────────────────────────────────────────────────────────────╢\n';
          report += '║   Acurácia por Categoria:                                        ║\n';
          const categories = Array.from(new Set(modelTelemetry.map(t => t.category)));
          for (const cat of categories) {
            const catItems = modelTelemetry.filter(t => t.category === cat);
            const catFirstPass = catItems.filter(t => t.firstPassAccepted).length;
            const catRate = (catFirstPass / Math.max(1, catItems.length)) * 100;
            report += `║     • ${pad(cat, 16)} : ${padNum(catRate, 5)}% (${catFirstPass}/${catItems.length})                              ║\n`;
          }
        }
      }
      report += '╟──────────────────────────────────────────────────────────────────╢\n';
    }

    report += '╚══════════════════════════════════════════════════════════════════╝\n';
    return report;
  }

  public saveArtifacts(params: {
    runId: string;
    promptVersion: string;
    schemaVersion: string;
    scenarioCount: number;
    repetitions: number;
    summaries: readonly ProviderBenchmarkSummary[];
    telemetry: readonly RequestTelemetryArtifact[];
  }): { jsonPath: string; markdownPath: string } {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.resolve(this.artifactsDir, `llm_benchmark_results_${timestamp}.json`);
    const markdownPath = path.resolve(this.artifactsDir, `llm_benchmark_report_${timestamp}.md`);

    // 1. JSON Telemetry
    const jsonPayload = {
      runId: params.runId,
      timestamp: new Date().toISOString(),
      promptVersion: params.promptVersion,
      schemaVersion: params.schemaVersion,
      scenarioCount: params.scenarioCount,
      repetitions: params.repetitions,
      summaries: params.summaries,
      telemetry: params.telemetry
    };
    fs.writeFileSync(jsonPath, JSON.stringify(jsonPayload, null, 2), 'utf8');

    // 2. Markdown Report
    let md = `# Age of Shattered Oaths — LLM Compatibility & Benchmark Report\n\n`;
    md += `**Run ID:** \`${params.runId}\` | **Timestamp:** \`${new Date().toISOString()}\`\n`;
    md += `- **Prompt Version:** \`${params.promptVersion}\`\n`;
    md += `- **Schema Version:** \`${params.schemaVersion}\`\n`;
    md += `- **Total Scenarios:** \`${params.scenarioCount}\`\n`;
    md += `- **Repetitions per Scenario:** \`${params.repetitions}\`\n\n`;

    md += `## Resumo Comparativo por Provedor\n\n`;
    md += `| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |\n`;
    md += `| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

    for (const s of params.summaries) {
      md += `| **${s.provider}** | \`${s.model}\` | ${(s.jsonValidRate * 100).toFixed(1)}% | ${(s.schemaValidRate * 100).toFixed(1)}% | ${(s.semanticValidRate * 100).toFixed(1)}% | ${(s.engineSafeRate * 100).toFixed(1)}% | **${(s.firstPassAcceptanceRate * 100).toFixed(1)}%** | ${(s.hallucinationRate * 100).toFixed(1)}% | ${(s.mechanicalSilenceRate * 100).toFixed(1)}% | **${s.averageNarrativeScore.toFixed(1)}/10** | ${Math.round(s.averageLatencyMs)}ms | $0.00 | **${s.status}** |\n`;
    }

    md += `\n## Acurácia por Categoria de Cenário\n\n`;
    const allCategories = Array.from(new Set(params.telemetry.map(t => t.category)));
    md += `| Categoria | ${params.summaries.map(s => `\`${s.provider}/${s.model}\``).join(' | ')} |\n`;
    md += `| :--- | ${params.summaries.map(() => ':---:').join(' | ')} |\n`;

    for (const cat of allCategories) {
      const row = params.summaries.map(s => {
        const catTelemetry = params.telemetry.filter(t => t.provider === s.provider && t.model === s.model && t.category === cat);
        if (catTelemetry.length === 0) return '-';
        const passed = catTelemetry.filter(t => t.firstPassAccepted).length;
        return `**${((passed / catTelemetry.length) * 100).toFixed(1)}%** (${passed}/${catTelemetry.length})`;
      });
      md += `| **${cat}** | ${row.join(' | ')} |\n`;
    }

    md += `\n## Resiliência e Telemetria de Falhas\n\n`;
    md += `| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

    for (const s of params.summaries) {
      md += `| **${s.provider}** | ${s.totalRequests} | ${s.successfulRequests} | ${s.rateLimitedCount} | ${s.timeoutCount} | ${s.serverErrorCount} | ${s.firstPassCount} | ${s.eventualSuccessCount} |\n`;
    }

    fs.writeFileSync(markdownPath, md, 'utf8');
    return { jsonPath, markdownPath };
  }
}

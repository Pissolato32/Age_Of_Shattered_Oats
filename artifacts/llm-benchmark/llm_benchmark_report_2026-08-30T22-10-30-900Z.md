# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-08-30T22:10:25.549Z` | **Timestamp:** `2026-08-30T22:10:30.910Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `10`
- **Repetitions per Scenario:** `3`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **openrouter** | `deepseek/deepseek-r1:free` | 0.0% | 0.0% | 0.0% | 0.0% | **0.0%** | 100.0% | 0.0% | **0.0/10** | 0ms | $0.00 | **FAIL** |

## Acurácia por Categoria de Cenário

| Categoria | `openrouter/deepseek/deepseek-r1:free` |
| :--- | :---: |
| **military** | **0.0%** (0/30) |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **openrouter** | 30 | 0 | 0 | 0 | 30 | 0 | 0 |

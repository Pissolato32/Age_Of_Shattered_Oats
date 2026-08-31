# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-08-30T23:40:53.997Z` | **Timestamp:** `2026-08-30T23:45:28.171Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `10`
- **Repetitions per Scenario:** `3`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **openrouter** | `google/gemma-4-31b-it:free` | 100.0% | 100.0% | 76.7% | 100.0% | **76.7%** | 0.0% | 86.7% | **9.3/10** | 3752ms | $0.00 | **WARN** |

## Acurácia por Categoria de Cenário

| Categoria | `openrouter/google/gemma-4-31b-it:free` |
| :--- | :---: |
| **military** | **76.7%** (23/30) |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **openrouter** | 30 | 30 | 0 | 0 | 0 | 23 | 23 |

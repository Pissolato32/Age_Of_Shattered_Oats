# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-08-30T22:05:29.159Z` | **Timestamp:** `2026-08-30T22:10:16.553Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `10`
- **Repetitions per Scenario:** `3`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **gemini** | `gemini-flash-lite-latest` | 73.3% | 73.3% | 70.0% | 73.3% | **63.3%** | 18.2% | 63.6% | **7.5/10** | 5899ms | $0.00 | **FAIL** |

## Acurácia por Categoria de Cenário

| Categoria | `gemini/gemini-flash-lite-latest` |
| :--- | :---: |
| **military** | **63.3%** (19/30) |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **gemini** | 30 | 22 | 0 | 0 | 12 | 19 | 19 |

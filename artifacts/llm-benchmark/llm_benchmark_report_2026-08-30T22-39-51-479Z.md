# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-08-30T22:37:24.885Z` | **Timestamp:** `2026-08-30T22:39:51.480Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `10`
- **Repetitions per Scenario:** `3`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **gemini** | `gemini-flash-lite-latest` | 63.3% | 63.3% | 50.0% | 63.3% | **46.7%** | 15.8% | 52.6% | **7.2/10** | 2892ms | $0.00 | **FAIL** |

## Acurácia por Categoria de Cenário

| Categoria | `gemini/gemini-flash-lite-latest` |
| :--- | :---: |
| **military** | **46.7%** (14/30) |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **gemini** | 30 | 19 | 0 | 0 | 14 | 14 | 14 |

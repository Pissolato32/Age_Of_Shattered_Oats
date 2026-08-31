# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-08-31T01:53:36.508Z` | **Timestamp:** `2026-08-31T01:56:04.492Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `20`
- **Repetitions per Scenario:** `1`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **gemini** | `gemini-flash-lite-latest` | 105.9% | 105.9% | 100.0% | 90.0% | **76.5%** | 5.6% | 72.2% | **8.6/10** | 1282ms | $0.00 | **FAIL** |

## Acurácia por Categoria de Cenário

| Categoria | `gemini/gemini-flash-lite-latest` |
| :--- | :---: |
| **military** | **65.0%** (13/20) |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **gemini** | 20 | 18 | 0 | 0 | 3 | 13 | 13 |

# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-08-30T23:45:38.158Z` | **Timestamp:** `2026-08-30T23:49:14.486Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `10`
- **Repetitions per Scenario:** `3`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **gemini** | `gemini-flash-lite-latest` | 70.0% | 70.0% | 60.0% | 70.0% | **50.0%** | 9.5% | 71.4% | **8.3/10** | 2736ms | $0.00 | **FAIL** |

## Acurácia por Categoria de Cenário

| Categoria | `gemini/gemini-flash-lite-latest` |
| :--- | :---: |
| **military** | **50.0%** (15/30) |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **gemini** | 30 | 21 | 0 | 0 | 11 | 15 | 15 |

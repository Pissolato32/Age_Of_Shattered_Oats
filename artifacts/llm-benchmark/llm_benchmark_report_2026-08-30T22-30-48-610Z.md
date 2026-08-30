# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-08-30T22:11:04.036Z` | **Timestamp:** `2026-08-30T22:30:48.611Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `10`
- **Repetitions per Scenario:** `3`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **openrouter** | `google/gemma-4-31b-it:free` | 20.0% | 20.0% | 16.7% | 100.0% | **16.7%** | 0.0% | 10.0% | **4.2/10** | 22876ms | $0.00 | **FAIL** |

## Acurácia por Categoria de Cenário

| Categoria | `openrouter/google/gemma-4-31b-it:free` |
| :--- | :---: |
| **military** | **16.7%** (5/30) |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **openrouter** | 30 | 30 | 0 | 0 | 0 | 5 | 5 |

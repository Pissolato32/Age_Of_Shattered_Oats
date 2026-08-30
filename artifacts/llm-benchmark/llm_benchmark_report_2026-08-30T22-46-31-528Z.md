# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-08-30T22:43:06.981Z` | **Timestamp:** `2026-08-30T22:46:31.529Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `5`
- **Repetitions per Scenario:** `1`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **opencode** | `nemotron-3.5-lightning-free` | 20.0% | 20.0% | 0.0% | 100.0% | **20.0%** | 0.0% | 20.0% | **4.8/10** | 18329ms | $0.00 | **FAIL** |

## Acurácia por Categoria de Cenário

| Categoria | `opencode/nemotron-3.5-lightning-free` |
| :--- | :---: |
| **military** | **20.0%** (1/5) |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **opencode** | 5 | 5 | 0 | 0 | 0 | 1 | 1 |

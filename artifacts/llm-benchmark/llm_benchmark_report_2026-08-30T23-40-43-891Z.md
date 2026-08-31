# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-08-30T23:21:54.147Z` | **Timestamp:** `2026-08-30T23:40:43.892Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `10`
- **Repetitions per Scenario:** `3`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **opencode** | `nemotron-3.5-lightning-free` | 30.0% | 26.7% | 26.7% | 96.7% | **23.3%** | 3.4% | 6.9% | **3.8/10** | 17896ms | $0.00 | **FAIL** |

## Acurácia por Categoria de Cenário

| Categoria | `opencode/nemotron-3.5-lightning-free` |
| :--- | :---: |
| **military** | **23.3%** (7/30) |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **opencode** | 30 | 29 | 0 | 1 | 1 | 7 | 7 |

# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-09-03T12:50:13.937Z` | **Timestamp:** `2026-09-03T12:50:14.013Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `20`
- **Repetitions per Scenario:** `1`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **mock** | `mock-model` | 100.0% | 100.0% | 45.0% | 100.0% | **65.0%** | 0.0% | 100.0% | **10.0/10** | 5ms | $0.00 | **WARN** |

## Acurácia por Categoria de Cenário

| Categoria | `mock/mock-model` |
| :--- | :---: |
| **military** | **65.0%** (13/20) |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **mock** | 20 | 20 | 0 | 0 | 0 | 13 | 13 |

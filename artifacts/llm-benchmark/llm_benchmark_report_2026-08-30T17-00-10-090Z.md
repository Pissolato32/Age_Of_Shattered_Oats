# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-08-30T17:00:10.027Z` | **Timestamp:** `2026-08-30T17:00:10.091Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `20`
- **Repetitions per Scenario:** `1`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **mock** | `mock-model` | 100.0% | 100.0% | 45.0% | 100.0% | **60.0%** | 0.0% | 100.0% | **10.0/10** | 5ms | $0.00 | **WARN** |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **mock** | 20 | 20 | 0 | 0 | 0 | 12 | 12 |

---
*Relatório gerado automaticamente pelo LLM Compatibility Harness de Age of Shattered Oaths.*

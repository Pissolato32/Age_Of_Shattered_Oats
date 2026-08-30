# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-08-30T16:49:31.174Z` | **Timestamp:** `2026-08-30T16:49:31.232Z`
- **Prompt Version:** `v1.2.0-iron-chronicle`
- **Schema Version:** `v1.0.0-narrative-contract`
- **Total Scenarios:** `15`
- **Repetitions per Scenario:** `1`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **mock** | `mock-model` | 100.0% | 66.7% | 40.0% | 100.0% | **60.0%** | 0.0% | 100.0% | **10.0/10** | 5ms | $0.00 | **FAIL** |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **mock** | 15 | 15 | 0 | 0 | 0 | 9 | 9 |

---
*Relatório gerado automaticamente pelo LLM Compatibility Harness de Age of Shattered Oaths.*

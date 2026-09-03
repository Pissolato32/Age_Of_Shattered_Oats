# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-09-02T12:17:08.423Z` | **Timestamp:** `2026-09-02T12:17:08.487Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `20`
- **Repetitions per Scenario:** `1`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **mock** | `mock-model` | 100.0% | 100.0% | 45.0% | 100.0% | **60.0%** | 0.0% | 100.0% | **10.0/10** | 5ms | $0.00 | **WARN** |

## Acurácia por Categoria de Cenário

| Categoria | `mock/mock-model` |
| :--- | :---: |
| **military** | **60.0%** (12/20) |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **mock** | 20 | 20 | 0 | 0 | 0 | 12 | 12 |

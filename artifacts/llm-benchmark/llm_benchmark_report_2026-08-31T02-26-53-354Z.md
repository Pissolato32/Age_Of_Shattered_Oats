# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-08-31T02:26:53.111Z` | **Timestamp:** `2026-08-31T02:26:53.355Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `130`
- **Repetitions per Scenario:** `1`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **mock** | `mock-model` | 100.0% | 100.0% | 32.3% | 100.0% | **47.7%** | 0.0% | 100.0% | **10.0/10** | 5ms | $0.00 | **WARN** |

## Acurácia por Categoria de Cenário

| Categoria | `mock/mock-model` |
| :--- | :---: |
| **military** | **60.0%** (12/20) |
| **diplomacy** | **45.0%** (9/20) |
| **economy** | **26.7%** (4/15) |
| **intrigue** | **46.7%** (7/15) |
| **exploration** | **30.0%** (3/10) |
| **crisis** | **20.0%** (2/10) |
| **ambiguous** | **90.0%** (9/10) |
| **adversarial** | **80.0%** (8/10) |
| **historical** | **60.0%** (6/10) |
| **cross_system** | **20.0%** (2/10) |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **mock** | 130 | 130 | 0 | 0 | 0 | 62 | 62 |

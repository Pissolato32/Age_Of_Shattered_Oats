# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-08-31T00:03:33.929Z` | **Timestamp:** `2026-08-31T00:52:20.037Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `130`
- **Repetitions per Scenario:** `1`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **openrouter** | `google/gemma-4-31b-it:free` | 82.3% | 82.3% | 56.2% | 100.0% | **63.1%** | 0.0% | 66.2% | **8.1/10** | 10182ms | $0.00 | **FAIL** |

## Acurácia por Categoria de Cenário

| Categoria | `openrouter/google/gemma-4-31b-it:free` |
| :--- | :---: |
| **military** | **5.0%** (1/20) |
| **diplomacy** | **65.0%** (13/20) |
| **economy** | **66.7%** (10/15) |
| **intrigue** | **80.0%** (12/15) |
| **exploration** | **70.0%** (7/10) |
| **crisis** | **70.0%** (7/10) |
| **ambiguous** | **90.0%** (9/10) |
| **adversarial** | **90.0%** (9/10) |
| **historical** | **70.0%** (7/10) |
| **cross_system** | **70.0%** (7/10) |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **openrouter** | 130 | 130 | 0 | 0 | 0 | 82 | 82 |

# Age of Shattered Oaths — LLM Compatibility & Benchmark Report

**Run ID:** `BENCH-2026-08-30T21:59:01.427Z` | **Timestamp:** `2026-08-30T21:59:04.846Z`
- **Prompt Version:** `v1.3.0-iron-chronicle`
- **Schema Version:** `v1.1.0-narrative-contract`
- **Total Scenarios:** `5`
- **Repetitions per Scenario:** `1`

## Resumo Comparativo por Provedor

| Provedor | Modelo | JSON % | Schema % | Semantic % | Engine Safe % | First Pass % | Alucinação % | Silêncio % | Nota Narrativa | Latência | Custo | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **huggingface** | `meta-llama/Llama-3.2-3B-Instruct` | 0.0% | 0.0% | 0.0% | 0.0% | **0.0%** | 100.0% | 0.0% | **0.0/10** | 0ms | $0.00 | **FAIL** |

## Acurácia por Categoria de Cenário

| Categoria | `huggingface/meta-llama/Llama-3.2-3B-Instruct` |
| :--- | :---: |
| **military** | **0.0%** (0/5) |

## Resiliência e Telemetria de Falhas

| Provedor | Total Requests | Sucessos | Rate Limited | Timeouts | Server Errors | First-Pass | Eventual |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **huggingface** | 5 | 0 | 0 | 0 | 5 | 0 | 0 |

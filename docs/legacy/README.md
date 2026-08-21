# Legacy Archive & Lore Vault — Age of Shattered Oaths

> [!CAUTION]
> **AVISO DE ESCOPO E ISOLAMENTO ARQUITETURAL:**
> Este diretório é **estritamente arquivo histórico e acervo de lore/referência**. Nenhum documento ou especificação aqui presente possui autoridade sobre as regras, estado de campanha, arquitetura ou comportamento mecânico atual do jogo.
> Em qualquer hipótese de conflito ou divergência, prevalecem com autoridade máxima o código-fonte canônico (`src/engine.ts`, `src/lib/`), os contratos vigentes e a documentação oficial em `docs/development/` e `docs/architecture/`.

---

## 1. Architectural Scope & Non-Interference Policy

* **Canonical Authority:** The deterministic simulation engine in `src/engine.ts` and the codified rules in `codex/` remain the sole canonical authorities for gameplay mechanics.
* **Archival Status:** The documents here serve as narrative reference, worldbuilding lore, character chronicles, and historical rule design context. They do not alter starting campaign states or duplicate runtime mechanics.
* **Strict Non-Implementation:** Future AI agents and developers must NOT re-implement systems or change campaign defaults based on legacy files in this directory.

---

## 2. Directory Structure

### `narrative/`
* **`NARRATIVE_PROTOCOL.md` (PART 122):** The 6-Step Response Cycle (`Resolve mechanics` → `Narrate consequence` → `Update world state` → `Surface new information` → `Return agency` → `Wait`), scene state classification (`Continuing`, `Resolved`, `Suspended`, `Interrupted`), Contextual Question rules, and multi-actor handling.
* **`QUICK_REF.md`:** Reference tables for in-world units, holding tiers, medieval time designations, and cross-references.
* **`BOOTSTRAP.md`:** Historical guide on semantic rule consultation and GM behavior.

### `lore/`
* **`LINHA_DO_TEMPO.md`:** Comprehensive 62 KB chronological campaign chronicle detailing the fall of Valenfort, the alliance of Grey Keep, conspiracies, and historical events across Years 0–345.
* **`LIVRO_NEGRO.md`:** Intelligence dossiers, secret investigations, and intrigue records.
* **`TERRITORIOS.md`:** Regional geography, settlements, garrison registries, and territorial holdings.
* **`GENEALOGIA.md`:** Noble lineage and dynastic trees.
* **`MISSOES.md`:** Historical quests, diplomatic missions, and military operations.
* **`DIPLOMACIA.md` & `CONSELHO.md`:** Diplomatic treaties, House opinions, and Council proceedings.
* **`ECONOMIA.md` & `MERCENARIOS.md`:** Historical trade routes, market ledgers, and mercenary companies.
* **`APPENDIX_G.md`, `G.17_HIDDEN_HEIR.md`, `G.21_DISTANCIAS.md`, `G.23_CARAVAN_LEDGER.md`, `G.24_TRADE_GUIDE.md`:** Detailed campaign tables, travel distances, and trade caravan matrices.
* **`PERSONAGENS/`:** Character sheets and personality briefs.

### `rules_archive/`
* Complete historical rulebook modules (`certeza.md`, `viagem.md`, `economia.md`, `comercio.md`, `mil_combate.md`, `mil_unidades.md`, `pol_diplomacia.md`, `eventos.md`, `appendix_a.md`, etc.).

### `LEGACY_AGENTS.md`
* Historical GM prompt and system instructions preserved for archival reference.

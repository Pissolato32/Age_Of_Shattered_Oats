# Age of Shattered Oaths

> A dark, fatalistic, and deterministic feudal strategy RPG powered by an authoritative deterministic simulation engine and an Iron Chronicle sensory translation AI layer.

---

## 🏛️ Documentation & Architecture

* **[Project Master Roadmap & Definition of Done](docs/development/PROJECT_ROADMAP.md)**: Authoritative 5-phase completion contract and release acceptance checklist.
* **[System Guidelines & Narrative Rules (AGENTS.md)](AGENTS.md)**: Core operational principles (Mechanical Truth, Sensory Translation, Absolute Mechanical Silence, Iron Chronicle tone).
* **[Technical Debt & Deferred Backlog](docs/development/TECHNICAL_DEBT.md)**: Single source of truth for verified technical findings and deferred optimizations.
* **[Narrative AI Architecture](docs/development/NARRATIVE_AI_ARCHITECTURE.md)**: Canonical contracts, observer projections, and semantic validation boundaries.

---

## 🚀 Running Locally

**Prerequisites:** Node.js (v20+)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Set `GEMINI_API_KEY` in `.env` (optional for offline testing; deterministic mock operates automatically if unset).

3. **Run the application:**
   ```bash
   npm run dev
   ```

4. **Execute full test suite:**
   ```bash
   npm test
   ```

# NARRATOR MIGRATION READINESS

## 1. Files inspected
The following 10 legacy files from `legacy/main:src/domain/narrator/` and 4 test files from `legacy/main:tests/` were fully inspected:

### Source Files
- `src/domain/narrator/ChangeTypes.ts` (Zod schemas and TypeScript interfaces for narrative state changes)
- `src/domain/narrator/ContextBuilder.ts` (Context aggregator querying repositories, visibility service, and event store)
- `src/domain/narrator/EntityResolver.ts` (Exact and Levenshtein fuzzy string matching against character and holding names)
- `src/domain/narrator/LoreRetriever.ts` (EventStore reader for character memories and active vows)
- `src/domain/narrator/PatternLibrary.ts` (Regex pattern catalog and parser for narrative text changes)
- `src/domain/narrator/PromptCompiler.ts` (System and user prompt formatter for LLM narrator)
- `src/domain/narrator/RiskClassifier.ts` (Risk categorizer splitting changes into auto vs confirmation required)
- `src/domain/narrator/StateApplicator.ts` (Disk state mutator updating markdown files, YAML files, SQLite repositories, and EventStore)
- `src/domain/narrator/StateExtractor.ts` (Pipeline combining Regex PatternLibrary, LLM gateway prompts, and EntityResolver)
- `src/domain/narrator/README.md` (Documentation for legacy narrator pipeline)

### Test Files
- `tests/PatternLibrary.test.ts`
- `tests/domain/NarrativeStateExtractor.test.ts`
- `tests/domain/NarratorPipeline.test.ts`
- `tests/integration/StateExtractorE2E.test.ts`

---

## 2. Architectural classification
**Is Narrator a Domain? NO.**  
Despite its folder location (`src/domain/narrator`), none of the 10 files contain pure domain entity logic or deterministic game rules. The per-module architectural classification is:

| Module | Architectural Layer | Primary Responsibility |
|---|---|---|
| `ChangeTypes.ts` | SHARED / CORE | Data contracts and Zod validation schemas |
| `ContextBuilder.ts` | APPLICATION | Assembles system context by querying repos and EventStore |
| `EntityResolver.ts` | APPLICATION / INFRASTRUCTURE | String normalization and Levenshtein fuzzy entity resolution |
| `LoreRetriever.ts` | APPLICATION | Reads character memories and vows from EventStore |
| `PatternLibrary.ts` | AI / INFRASTRUCTURE | Regex parsing of unstructured narrative text |
| `PromptCompiler.ts` | AI / RAG | System/User prompt construction for LLM execution |
| `RiskClassifier.ts` | APPLICATION | Risk classification mapping for state mutations |
| `StateApplicator.ts` | INFRASTRUCTURE | Disk file mutation (`.md`/`.yaml`) and EventStore persistence |
| `StateExtractor.ts` | APPLICATION / AI | Orchestrates regex, AI Gateway, and EntityResolver |

---

## 3. Dependency audit
- **Direct Dependencies**: `zod`, `js-yaml`, `crypto` (`randomUUID`), `fs/promises`, `path`.
- **Infrastructure / Database Coupling**: `ICharacterRepository`, `IHoldingRepository`, `IEventStore`, `SqliteDb`, `SqliteCharacterRepository`, `SqliteHoldingRepository`, `SqliteEventStore`.
- **Service Coupling**: `CampaignMarkdownSyncService`, `TransactionService`, `VisibilityService`, `IAiGateway`.
- **FileSystem Coupling**: `StateApplicator` directly reads and writes disk files (`PERSONAGENS/*.yaml`, `TERRITORIOS.md`, `DIPLOMACIA.md`, `STATE_CHANGES.md`).

---

## 4. Legacy-only coupling
- **Disk Markdown/YAML Campaign State**: The legacy architecture stored state in `.md` and `.yaml` files on disk. `StateApplicator` relies entirely on regex replacing strings in markdown files.
- **SQLite Database Repositories**: Heavy reliance on legacy SQLite repository abstractions.
- **Two-Way Narrative State Mutation**: Legacy Narrator attempts to extract state changes from LLM text and apply them back to disk.

---

## 5. Target equivalent functionality
In **Age_Of_Shattered_Oats**:
- Narrative generation is handled by `src/components/ActivePlay.tsx` (`generateNarrativeWithAI`), `/api/narrate` (Gemini API serverless route), `src/lib/gameplayPipeline.ts`, and `src/lib/webFlavorService.ts`.
- **Target Golden Rule**: Engine (`engine.ts`) deterministically computes state changes first; AI acts strictly as a sensory post-processor. AI text NEVER mutates game state.

---

## 6. Test audit
- **Tested Functionality**: Regex pattern matching (`PatternLibrary.test.ts`), name resolution (`EntityResolver`), LLM prompt compilation (`NarratorPipeline.test.ts`), and end-to-end extraction (`StateExtractorE2E.test.ts`).
- **Test Dependencies**: Tests require active SQLite database instances (`./campaign.db`), mock AI gateways, and disk filesystem structures.
- **Structural Test/Source Proxy Ratio**: 4 test files / 10 source files = **0.40** (Not 1.0 as reported in previous legacy scorecard).

---

## 7. Existing scorecard discrepancies
Comparing findings against `DOMAIN_MIGRATION_SCORECARD.md`:

1. **Domain Classification Discrepancy**: Scorecard classified Narrator as a `Domain`. In reality, it is a hybrid Application/AI/Infrastructure orchestration pipeline.
2. **Test/Source Ratio Discrepancy**: Scorecard reported `1.0`. Actual ratio of dedicated test files is `0.40`.
3. **Persistence Coupling Discrepancy**: Scorecard listed `Low`. Actual persistence coupling is **HIGH / CRITICAL** (couples to SQLite DB, EventStore, and disk Markdown/YAML file reads/writes).
4. **Architectural Flow Discrepancy**: Scorecard assumed Narrator could be copied into `src/domain/`. Copying Narrator would violate the target's core architecture (Engine-first deterministic truth vs LLM state mutation).

---

## 8. Reuse classification
**D — MERGE WITH TARGET** (with `StateApplicator` classified as **F — LEGACY-ONLY / DISCARD**)

Individual pure modules (`PromptCompiler` templates, `EntityResolver` logic) can be selectively merged into target services (`src/lib/` / `src/services/`), while `StateApplicator` must be discarded.

---

## 9. Target architectural destination
**MULTI-LAYER (APPLICATION / AI / SERVICES)**  
No files from Narrator belong in `src/domain/`.

---

## 10. Migration risk
**HIGH RISK / ARCHITECTURAL COLLISION**  
Migrating `src/domain/narrator` as a domain would introduce unused SQLite infrastructure, filesystem mutation routines, and violate the golden rule of mechanical determinism.

---

## 11. Recommended migration strategy
1. **Do NOT migrate `src/domain/narrator` as a domain.**
2. Keep target narrative generation inside `ActivePlay.tsx` / `/api/narrate` / `gameplayPipeline.ts`.
3. If prompt enhancement or entity resolution is desired in the target, port only `EntityResolver` or `PromptCompiler` as utility services in `src/lib/` or `src/services/`.

---

## 12. Exact next step
Select a true self-contained domain candidate from `legacy/main:src/domain/` (such as `Holdings`, `Items`, `Retinues`, or `Weather`) for the second domain migration readiness check.

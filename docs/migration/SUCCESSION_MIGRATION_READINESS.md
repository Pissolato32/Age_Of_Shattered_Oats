# Succession Migration Readiness (SuccessionService)

## 1. Legacy Implementation
- **File**: `legacy/main/src/domain/kingdom/services/SuccessionService.ts`
- **Class**: `SuccessionService`
- **Method**: `getSuccessionOrder(relatives: Relative[]): Relative[]`
- **Interface**:
  ```ts
  export interface Relative {
    id: string;
    name: string;
    relation: 'child' | 'sibling' | 'nephew' | 'niece' | 'other';
    age: number;
    isLegitimate: boolean;
  }
  ```
- **Algorithm Hierarchy**:
  1. Eldest legitimate children (`relation === 'child' && isLegitimate`, sorted by age descending).
  2. Legitimate siblings (`relation === 'sibling' && isLegitimate`, sorted by age descending).
  3. Legitimate nephews and nieces (`relation === 'nephew' || 'niece'`, sorted by age descending).
  4. Other blood relatives (legitimate first, then illegitimate, sorted by age descending).

---

## 2. Canonical Rules
- **Rule Reference**: `@rule politics.succession` (from `legacy/main:docs/ARCHITECTURE_FREEZE.md`).
- **Rule Principle**: Dynastic succession follows strict primogeniture and legitimacy preference. When a ruler abdicates or dies, authority passes to the highest-ranking living heir in the lineage hierarchy.

---

## 3. Target Existing Logic
- **`src/types.ts`**:
  - `HouseFamily` contains `children: FamilyChild[]`.
  - `FamilyChild` contains `{ name: string; age: number; gender: string; isHeir: boolean; alive: boolean }`.
- **`src/engine.ts`** (Line 744):
  - On childbirth: `isHeir: !hasHeir` (sets firstborn as heir).
- **`src/components/ActivePlay.tsx`** (Lines 1176–1202):
  - On abdication or ruler death (`handleAbdicateOrDie`):
    ```ts
    const livingHeirs = s.family.children.filter(c => c.alive);
    const primaryHeir = livingHeirs.find(c => c.isHeir) || livingHeirs[0];
    // ...
    if (s.family.children.length > 0) {
      s.family.children[0].isHeir = true; // Naive fallback
    }
    ```
- **Evaluation**: The target currently relies on crude array index access (`children[0]`) in the UI layer during dynastic transitions, rather than a canonical domain primogeniture sorting algorithm.

---

## 4. Dependency Graph
- **Legacy Dependencies**: `RuntimeLogger` (`import { RuntimeLogger } from '../../../tools/RuntimeLogger'`).
- **Required Cleanup**: Strip `RuntimeLogger` call to render the class 100% dependency-free.

---

## 5. Duplication Analysis
- **Duplication Status**: **NONE**.
- Target `src/` lacks an explicit primogeniture sorting algorithm that accounts for relative age, legitimacy, and collateral bloodlines (siblings/nephews).

---

## 6. Purity Analysis

| Property | Status |
|---|---|
| **Database / SQLite** | 0 calls |
| **EventStore / SnapshotStore** | 0 calls |
| **Filesystem I/O** | 0 calls |
| **RNG (Random)** | 0 calls |
| **Clock / Date** | 0 calls |
| **State Mutation** | 0 mutations (Returns a new sorted array) |

- **Verdict**: 100% pure array transformation function ($f(\text{relatives}) \rightarrow \text{sortedRelatives}$).

---

## 7. State Boundary
- `SuccessionService` does **NOT** mutate `CampaignState` directly.
- **Proposed Engine Facade** in `src/engine.ts`:
  ```ts
  export function resolveDynasticSuccession(state: CampaignState): { newRuler: FamilyChild; nextHeir?: FamilyChild }
  ```
- The Engine function calls `SuccessionService.calculateSuccessionOrder()`, updates `CampaignState`, and records the major event in `worldLedger`.

---

## 8. Required Adaptations
1. Remove `RuntimeLogger` import and `RuntimeLogger.logRule()` call.
2. Provide a lightweight adapter function `mapFamilyChildrenToRelatives(children: FamilyChild[]): Relative[]` to bridge target `FamilyChild` data structures to the domain service.
3. Make `calculateSuccessionOrder` a static pure method.

---

## 9. Test Cases Required
1. **Firstborn Primogeniture**: Verify eldest legitimate child ranks first.
2. **Age Sorting**: Verify children of ages 14, 22, 18 sort as 22 $\rightarrow$ 18 $\rightarrow$ 14.
3. **Legitimacy Priority**: Verify a younger legitimate child ranks ahead of an older illegitimate relative.
4. **Collateral Lineage**: Verify siblings rank after children but ahead of nephews.
5. **Empty Relatives Array**: Handle empty arrays gracefully without throwing errors.

---

## 10. Migration Risk
- **Risk Level**: **LOW**.
- The service is a pure array sorting algorithm with zero external dependencies and zero side effects.

---

## 11. Final Readiness Verdict
**STATUS: READY FOR MIGRATION**

*(Selective extraction of `SuccessionService.ts` from `legacy/main:src/domain/kingdom/services/` with `RuntimeLogger` removed).*

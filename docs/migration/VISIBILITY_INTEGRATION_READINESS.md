# Visibility Integration Readiness

## 1. Legacy Service
`src/domain/visibility/VisibilityService.ts` is a pure, deterministic domain/application service that evaluates whether a factual event occurring at `eventLocation` at timestamp `tickOccurred` is visible to an observer located at `observerLocation` at `currentTick`.

### Core Signature
```ts
public canObserverSeeEvent(
  observerLocation: string,
  eventLocation: string,
  currentTick: number,
  tickOccurred: number
): boolean
```

- **Distance Matrix**:
  - `valenfort` ↔ `valenfort`: 0 ticks (Immediate local visibility)
  - `valenfort` ↔ `blackmoor`: 1 tick delay
  - `valenfort` ↔ `harvel`: 2 ticks delay
  - `valenfort` ↔ `capital`: 3 ticks delay
  - Default fallback for unknown locations: 1 day/tick delay.

---

## 2. Legacy Tests
- Covered by `tests/domain/NpcAndVisibility.test.ts` (Visibility section).
- Test cases:
  - Local event (`valenfort` -> `valenfort`) at `eventTick` = immediate visibility (`true`).
  - Distant event (`valenfort` -> `harvel` delay = 2 ticks):
    - At `eventTick + 1` -> invisible (`false`).
    - At `eventTick + 2` -> visible (`true`).

---

## 3. Dependencies
- **SQLite**: NONE
- **TypeORM**: NONE
- **Filesystem**: NONE
- **EventStore**: NONE
- **SnapshotStore**: NONE
- **RNG**: NONE
- **Clock**: NONE (Pure parameter inputs)
- **AI/RAG**: NONE

`VisibilityService.ts` has **0 external dependencies**.

---

## 4. Target Time Model
- **Legacy Time Model**: Integer tick timestamps (`currentTick`, `tickOccurred`).
- **Target Time Model**: `CampaignState.worldLedger.currentDate` (`year`, `month`, `week`).
- **Adapter Mapping**:
  Absolute turn tick calculation: `currentTick = (year - 342) * 52 + week`.
  This maps target weekly turn progression into integer ticks cleanly without changing `CampaignState`.

---

## 5. Target Spatial Model
- **Legacy Hubs**: `'valenfort'`, `'blackmoor'`, `'harvel'`, `'capital'`.
- **Target Landmarks & Regions**:
  - `"Valenfort Citadel"` / `"Valenfort"` → `valenfort` (Confidence: HIGH)
  - `"Blackmoor Keep"` / `"Blackmoor"` → `blackmoor` (Confidence: HIGH)
  - `"Harvel"` / `"Harvel Pass"` → `harvel` (Confidence: HIGH)
  - `"Royal Capital"` / `"Capital"` → `capital` (Confidence: HIGH)
  - Default fallback for unmapped landmarks: 1 tick delay.

---

## 6. Existing Visibility/Information Systems
- Target currently has secrets in `worldSecrets` (`src/engine.ts`, `ActivePlay.tsx`) and regional house rumors in `src/data.ts`.
- Target currently reveals secrets based purely on progress checks without spatial distance propagation delays between campaign hubs.

---

## 7. Concrete Integration Point

### Engine Helper (`src/engine.ts`)
```ts
export function isEventVisibleToObserver(
  observerLocation: string,
  eventLocation: string,
  currentTurn: number,
  eventTurn: number
): boolean {
  const visService = new VisibilityService();
  return visService.canObserverSeeEvent(observerLocation, eventLocation, currentTurn, eventTurn);
}
```

### Gameplay Usage
- Filters secret/rumor propagation in `src/engine.ts` and `ActivePlay.tsx` based on player location vs secret origin landmark and elapsed turns since occurrence.

---

## 8. Duplicate Logic Audit
- **`git grep` Search Results**: 0 duplicate fog-of-war or spatial distance propagation implementations exist in target.
- `VisibilityService` is the unique owner of spatial event visibility logic.

---

## 9. Compatibility
- `VisibilityService.ts`: **100% Compatible (A — DIRECT REUSE)**.
- Unit Test (`tests/domain/Visibility.test.ts`): **100% Compatible (A — DIRECT REUSE)**.
- Engine Adapter (`src/engine.ts`): **B — MINIMAL ADAPTATION**.

---

## 10. Technical Reuse Classification
**A — DIRECT REUSE**  
Pure domain service class with 0 external dependencies.

---

## 11. Integration Value
**HIGH**  
Introduces deterministic fog-of-war event propagation delays across campaign hubs, preventing instant global knowledge of distant events.

---

## 12. Risks
**LOW RISK**  
- Pure read-only query service (`canObserverSeeEvent`).
- Does not mutate `CampaignState` or break deterministic turn resolution.

---

## 13. Recommendation
**READY WITH ADAPTATION**  
Proceed with copying `VisibilityService.ts`, creating isolated unit/integration tests, and exposing `isEventVisibleToObserver` in `src/engine.ts`.

# Visibility Migration Report

## 1. Files Migrated
- `src/domain/visibility/VisibilityService.ts` (Pure domain model copied directly from `legacy/main` with 0 diffs, evaluating spatial distance propagation and fog-of-war delays).

---

## 2. Files Adapted
- `src/engine.ts`: Added Visibility integration helpers:
  - `getAbsoluteCampaignTurn(year, week)`: Converts CampaignState year/week (base year 342) into absolute turn ticks (`(year - 342) * 52 + week`).
  - `normalizeLocationToHub(locationName)`: Normalizes target landmark names (`Valenfort Citadel`, `Blackmoor Keep`, `Harvel Pass`, `Royal Capital`) to VisibilityService hubs (`valenfort`, `blackmoor`, `harvel`, `capital`).
  - `isEventVisibleToObserver(observerLocation, eventLocation, currentTurn, eventTurn)`: Primary Engine entrypoint for event visibility queries.
  - `getVisibleWorldSecrets(state)`: Returns `worldSecrets` filtered by fog-of-war propagation delays based on player landmark location and current turn.
- `src/types.ts`: Added optional `originLocation?: string` and `originTurn?: number` to `worldSecrets` item interface.
- `src/components/ActivePlay.tsx`: Updated secrets office UI to map `getVisibleWorldSecrets(state)` instead of raw unfiltered secrets array.
- `package.json`: Updated `npm test` script to include `tests/domain/Visibility.test.ts` and `tests/integration/VisibilityEngineIntegration.test.ts`.

---

## 3. Legacy Logic Preservation
- `VisibilityService.ts` distance matrix (`valenfort`=0, `blackmoor`=1, `harvel`=2, `capital`=3) and `canObserverSeeEvent()` rule evaluation preserved 100% without modification (`0 diff`).

---

## 4. Time Adapter
- **Formula**: `currentTurn = (currentDate.year - 342) * 52 + (currentDate.week || 1)`
- **Validation**: Accurately maps target campaign calendar weeks into integer tick progression without introducing external clocks or altering `CampaignState`.

---

## 5. Location Adapter
- **`Valenfort Citadel` / `Valenfort` / `Stormcrest Keep`** → `valenfort`
- **`Blackmoor Keep` / `Blackmoor` / `Bogthrone`** → `blackmoor`
- **`Harvel Pass` / `Harvel` / `Ironridge`** → `harvel`
- **`Royal Capital` / `Capital`** → `capital`
- **Fallback**: Unmapped locations default to 1 day/tick distance delay.

---

## 6. Engine Integration
- **Engine Authority**: `isEventVisibleToObserver()` and `getVisibleWorldSecrets()` in `src/engine.ts` own the spatial visibility query pipeline.
- **State Mutability**: `VisibilityService` and visibility helpers are 100% read-only and pure.

---

## 7. Gameplay Integration
- Secret/Rumor propagation in `ActivePlay.tsx` is filtered through `getVisibleWorldSecrets(state)`. Distant secrets (e.g. `secret_1` originated in Harvel Pass) remain hidden by fog-of-war until elapsed turn delay (2 weeks) elapses or the player travels closer to the origin hub.

---

## 8. Duplicate Logic Audit
- `git grep -n -E "canObserverSeeEvent|isEventVisibleToObserver|visibility" -- src` returned **0 duplicate distance or visibility matrix implementations**. `VisibilityService` is the unique owner.

---

## 9. Determinism
- `git grep -n -E "Math\.random|globalRNG|RandomService|Date\.now|new Date|performance\.now|randomUUID|fs\.|sqlite|typeorm|EventStore|SnapshotStore" -- src/domain/visibility` returned **0 matches**.
- `VisibilityService` executes with 100% determinism.

---

## 10. Tests
- `tests/domain/Visibility.test.ts` (Unit test suite validating local hub visibility, future event protection, spatial propagation delays, and unknown hub fallback).
- `tests/integration/VisibilityEngineIntegration.test.ts` (Engine integration suite validating turn conversion, location normalization, visibility checks, `getVisibleWorldSecrets` filtering, and state immutability).
- `npm test`: **PASSED (100%)**.

---

## 11. Build & Replay
- `npm run build`: **PASSED (0 build errors)**.
- `npx tsx src/tools/ReplayValidator.ts`: **PASSED (10/10 snapshots deterministic)**.

---

## 12. Behavioral Changes
- Unrevealed secrets originating in distant hubs (e.g. Harvel Pass) are now subject to a 2-week spatial propagation delay before appearing in the player's secret office, unless the player is locally present at the origin hub. Secrets without origin locations or already verified remain immediately visible.

---

## 13. Known Limitations
- Landmark to hub mapping currently covers the 4 major hubs (`valenfort`, `blackmoor`, `harvel`, `capital`) with default 1-tick delay fallback for new custom landmarks. Additional regional hubs can be added to `VisibilityService.regionDistances` as the map expands.

# EVE Industry Tool — Development Plan

## Status

Phases 1–11 are committed and passing. The app runs (`npm run dev`) and shows a
functional paste-and-compute UI, but the IPC handlers still return mocks. Phase 12
wires them to the real DB and calculator.

## Completed

| Phase | Description |
|---|---|
| 1 | Project scaffolding: Electron + Vite + React + TypeScript + Tailwind |
| 2 | TypeScript config: two-tsconfig architecture (electron/renderer split) |
| 3 | Vite renderer config, Tailwind CSS v4, React 19 |
| 4 | SQLite client (`electron/db/client.ts`) — `getDb()` / `closeDb()` singleton |
| 5 | SDE download script (`scripts/downloadSde.ts`) — `npm run setup-sde` |
| 6 | SDE query helpers (`electron/db/sde.ts`) |
| 7 | Material paste parser (`src/lib/materialParser.ts`) |
| 8 | ME10 manufacturing calculator (`src/lib/manufactureCalculator.ts`) |
| 9 | Vitest config — unit (jsdom) + integration (node) projects |
| 10 | IPC contract, preload bridge (`electron/ipc/contract.ts`, `electron/preload.ts`) |
| 11 | Renderer UI: `MaterialPasteInput`, `BuildableTable`, `ShortfallList`, `useBuildables` hook |

Current test count: 79 unit tests, 13 integration tests (skip gracefully when SDE absent).

---

## Phase 12 — Wire IPC to Real DB + Calculator

**Goal:** Replace the two mock handlers in `electron/ipc/blueprints.ts` with real logic.

### `sde:status` handler

Replace the mock with a real check:

```typescript
import { existsSync } from 'node:fs';
import path from 'node:path';

ipcMainInstance.handle(IPC_CHANNELS.SDE_STATUS, (): SdeStatusResponse => {
  const sdePath = path.join(process.cwd(), 'data', 'sde.sqlite');
  return existsSync(sdePath)
    ? { present: true, path: sdePath }
    : { present: false, path: null };
});
```

### `blueprints:computeBuildables` handler

The pipeline (all pieces exist — just need to be connected):

```
rawPaste
  → parseMaterials(rawPaste)           // src/lib/materialParser.ts
  → findManyTypeIdsByName(db, names)   // electron/db/sde.ts  — name → typeID map
  → build Inventory Map<typeID, qty>
  → listManufacturableBlueprints(db)   // all blueprints from SDE
  → getAllManufacturingMaterials(db)    // all material rows (single batch query)
  → computeBuildables(inventory, bps)  // src/lib/manufactureCalculator.ts
  → return { items, parseErrors }
```

Key details:
- `parseMaterials` returns `{ items: ParsedMaterial[], errors: ParseError[] }`. The `errors`
  field maps directly to `parseErrors` in the response (same shape as `ParseErrorData`).
- `ParsedMaterial.name` is the raw string from the paste. Resolve to typeID via
  `findManyTypeIdsByName`. Materials whose name isn't found in the SDE should be
  silently dropped from inventory (they won't match any blueprint material anyway).
- `getAllManufacturingMaterials` returns all material rows for activityID=1. Group by
  `blueprintTypeID` to build `BlueprintInput[]` for the calculator.
- Only pass blueprints whose `blueprintTypeID` is in the materials result (i.e., has
  at least one material row) — blueprints with no materials are uninteresting.
- `computeBuildables` filters to `possibleRuns > 0` by default (correct behaviour).
- The return types are structurally compatible: `BuildableResult` ≈ `BuildableResultData`,
  `ParseError` ≈ `ParseErrorData`. TypeScript structural typing handles this.

### Type-duplication tech debt (resolve in this phase)

`src/types/models.ts` and `electron/ipc/contract.ts` define the same types independently
because the renderer and electron tsconfigs have separate roots. Resolve by creating
`shared/types.ts` covered by **both** tsconfigs, then deleting `src/types/models.ts`
and having `electron/ipc/contract.ts` re-export from it.

Add `shared/` to both tsconfigs:
- `tsconfig.electron.json`: add `"shared/**/*"` to `include`
- `tsconfig.renderer.json`: add `"shared/**/*"` to `include`

### Tests for Phase 12

- Unit test the new handler logic in `electron/ipc/blueprints.test.ts` using a fake DB
  (pass a mock DB object or use `vi.mock` on the sde module). Test the full pipeline:
  parse → lookup → compute.
- Integration test via `tests/integration/` is already covered by `sde.test.ts`.

---

## Phase 13 — SDE Bootstrap UX

**Goal:** Show a first-run screen when SDE is absent; let the user trigger the download
from inside the app rather than running `npm run setup-sde` manually.

### Approach

1. On app load, `useBuildables` (or a new `useSdeStatus` hook) calls `window.eveIndy.sdeStatus()`.
2. If `present: false`, show a `SdeSetupScreen` component instead of the paste UI.
3. The setup screen has a "Download SDE" button that calls a new IPC channel
   `sde:download` which runs the download pipeline from `scripts/downloadSde.ts`
   inline in the main process.
4. Emit progress events back to the renderer via `BrowserWindow.webContents.send`
   (one-way push, not `ipcMain.handle`) — add a `sde:progress` listener in the renderer.
5. When download completes, re-check status and transition to the main UI.

New IPC channels to add to `contract.ts`:
- `SDE_DOWNLOAD: 'sde:download'` — starts download, returns `void`
- `SDE_PROGRESS: 'sde:progress'` — one-way push: `{ percent: number, done: boolean, error?: string }`

---

## Phase 14 — Polish

- Per-column sorting in `BuildableTable` (click header to toggle asc/desc)
- Search/filter input above the table (filter by product name)
- Persist `rawPaste` across sessions via `localStorage` so the user doesn't re-paste
- Empty state when no items match the filter
- Loading skeleton while computing (brief but visible on large inventories)
- Accessibility: `aria-label` on the textarea, keyboard nav for table rows

---

## Phase 15 — Production Packaging + CI

- `electron-builder` config in `package.json` (`build` key): target macOS `.dmg`,
  Windows `.nsis`, Linux `.AppImage`
- The built app must bundle `data/sde.sqlite` or trigger the Phase 13 download on
  first launch (prefer download — SDE is ~100 MB, bad to ship in installer)
- `electron/db/client.ts` Phase 13 note: `resolveSdePath()` must check
  `app.getPath('userData')` for production installs in addition to `process.cwd()/data`
- ESLint + Prettier setup (defer from Phase 11 as noted)
- GitHub Actions CI: `npm test` on push, typecheck gate, optional integration test
  with cached SDE

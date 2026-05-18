# EVE Industry Tool — Development Plan

## Status

Phases 1–12 are committed and passing. The app runs (`npm run dev`) with a functional
paste-and-compute UI wired to the real SDE DB and calculator. 84 unit tests pass.

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
| 12 | Wire IPC to real DB + calculator; shared types in `shared/`; blueprint cache |

Current test count: 84 unit tests, 13 integration tests (skip gracefully when SDE absent).

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

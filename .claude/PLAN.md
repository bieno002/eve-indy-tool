# EVE Industry Tool — Development Plan

## Status

Phases 1–14 are committed and passing. The app runs (`npm run dev`) with a functional
paste-and-compute UI, in-app SDE download, and polished table UX. 116 unit tests pass.

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
| 13 | SDE Bootstrap UX: first-run setup screen, in-app download with progress |
| 14 | Polish: per-column sort, product filter, localStorage paste persistence, loading skeleton, a11y |

Current test count: 116 unit tests, 13 integration tests (skip gracefully when SDE absent).

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

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

## Phase 15 — Production Packaging + CI (complete)

- `electron-builder` config in `package.json` (`build` key): macOS `.dmg` (x64+arm64),
  Windows `.nsis` (x64), Linux `.AppImage` (x64); output to `release/`
- `getSdePath()` reads `EVE_SDE_DIR` env var (set to `app.getPath('userData')` only
  when `app.isPackaged`); falls back to `process.cwd()` in dev/test
- `asarUnpack: ["**/*.node"]` keeps `better-sqlite3` outside the asar archive
- ESLint 9 flat config (`eslint.config.mjs`) + Prettier (`.prettierrc`);
  `npm run lint` / `npm run format` / `npm run format:check`
- GitHub Actions CI (`.github/workflows/ci.yml`): typecheck + unit tests on all
  pushes; integration tests with weekly-cached SDE

**Known limitation:** `react` and `react-dom` are in `dependencies` (pre-existing),
so electron-builder will bundle them into the package even though Vite already
bundles them into the renderer. Moving them to `devDependencies` would shrink the
installer but is deferred.

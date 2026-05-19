# EVE Industry Tool — Context for Fresh Sessions

This file captures non-obvious decisions, constraints, and gotchas that are not
derivable from reading the code alone. Read this before starting any new phase.

---

## Architecture constraints

### Two-tsconfig split

The project has two separate TypeScript compilation roots:

| Config | Covers | Module format | Used by |
|---|---|---|---|
| `tsconfig.electron.json` | `electron/`, `scripts/` | CommonJS (node16) | `tsc` → `dist/` |
| `tsconfig.renderer.json` | `src/` | ESNext/bundler | Vite (noEmit) |

**Consequence:** `src/` cannot import from `electron/` and vice versa. Types shared
between them must live in a `shared/` directory included by both configs (not yet
created — Phase 12 task). Until then, `src/types/models.ts` and
`electron/ipc/contract.ts` define the same types independently. This is known tech
debt, not an oversight.

### Vitest environment

The unit test project uses `environment: 'jsdom'` for **all** test files (src/,
electron/, scripts/). Electron and scripts tests don't use the DOM — jsdom is a
superset of Node so they work fine. Component and hook tests require jsdom.

### better-sqlite3

Native module. Works in tests against the system Node.js without rebuilding. For
the Electron runtime, run `npm run rebuild` if queries fail with a Node ABI mismatch.
Integration tests use `describe.skipIf(!existsSync(SDE_PATH))` so `npm test` is
always green on fresh checkouts.

### Electron sandbox

`main.ts` sets `sandbox: false` in `webPreferences`. Electron 20+ sandboxes preload
scripts by default, which blocks `require()` for local files like `./ipc/contract.js`.
Without `sandbox: false` the preload silently fails to load, `window.eveIndy` is
never set, and all IPC calls throw at runtime.

---

## EVE SDE facts

- Source: Fuzzwork pre-converted SQLite at `https://www.fuzzwork.co.uk/dump/sqlite-latest.sqlite.bz2`
- Location: `data/sde.sqlite` (gitignored). Run `npm run setup-sde` to download.
- **Column name gotcha:** The `industryActivityProducts` and `industryActivityMaterials`
  tables use `typeID` (the blueprint type ID), NOT `blueprintTypeID`. All queries
  alias it: `iap.typeID AS blueprintTypeID`.
- Key tables: `invTypes` (typeID ↔ typeName), `industryActivityProducts` (activityID=1
  for manufacturing), `industryActivityMaterials` (activityID=1)
- ME 10 formula: `Math.max(1, Math.ceil(baseQty * 0.9))` — always assumed, never
  user-configurable in the current design.

---

## IPC design

### Channels (in `electron/ipc/contract.ts`)

| Constant | String | Direction | Handler |
|---|---|---|---|
| `SDE_STATUS` | `sde:status` | renderer → main | Returns `{ present, path }` |
| `BLUEPRINTS_COMPUTE` | `blueprints:computeBuildables` | renderer → main | Main compute pipeline |

Request-response channels use `ipcMain.handle` / `ipcRenderer.invoke`.
`SDE_PROGRESS` is a one-way push from main → renderer via `event.sender.send` / `ipcRenderer.on`.

### `IpcMainLike` type

`electron/ipc/contract.ts` exports `IpcMainLike` — a minimal interface that lets
handlers be tested without importing Electron. The real `ipcMain` satisfies it.
The `any[]` in its signature is intentional (matches Electron's actual type).

---

## Data flow

```
Renderer paste text
  ↓ IPC: blueprints:computeBuildables({ rawPaste })
  ↓ parseMaterials(rawPaste)              → { items: [{name, qty}], errors }
  ↓ findManyTypeIdsByName(db, names)      → Map<lowercase name, typeID>
  ↓ build Inventory: Map<typeID, qty>
  ↓ listManufacturableBlueprints(db)      → [{blueprintTypeID, productTypeID, productName}]
  ↓ getAllManufacturingMaterials(db)       → [{blueprintTypeID, materialTypeID, materialName, baseQuantity}]
  ↓ group materials by blueprintTypeID    → Map<bpID, material[]>
  ↓ build BlueprintInput[]
  ↓ computeBuildables(inventory, bps)     → BuildableResult[]
  ↓ return { items: results, parseErrors: errors }
```

Materials whose names aren't in the SDE are silently dropped from the inventory
(they won't match blueprint materials, so they're irrelevant to the calculation).

---

## Key type relationships

```
materialParser.ts:    ParsedMaterial { name, quantity }
                      ParseError     { lineNumber, line, reason }
                                              ↕ structurally identical
contract.ts:          ParseErrorData { lineNumber, line, reason }
                      BuildableResultData { ..., bottleneckMaterialTypeID, bottleneckMaterialName, ... }
                                              ↕ structurally identical
src/types/models.ts:  BuildableItem { ..., bottleneckMaterialTypeID, bottleneckMaterialName, ... }

manufactureCalculator.ts: BuildableResult { same fields as BuildableResultData }
                          BlueprintInput { blueprintTypeID, productTypeID, productName, materials[] }
                          Inventory = Map<typeID: number, qty: number>
```

TypeScript structural typing means these are assignment-compatible across the
boundary without explicit casts.

---

## Code conventions (non-negotiable)

- **No comments** unless the WHY is non-obvious (hidden constraint, invariant,
  workaround). Never comment what code does.
- **No `Co-Authored-By: Claude`** in any git commit messages.
- **Run `/review` and `/simplify` on all new code before committing.**
- Strict TypeScript — no `any`, no implicit `any` (the `IpcMainLike` explicit `any`
  is intentional and documented above).
- All DB access through `electron/db/` — never directly from IPC handlers.
- IPC handlers are thin: validate input, call pure functions, return.
- Test files live next to their source file (`foo.ts` → `foo.test.ts`).
- All new functionality requires tests before the work is considered done.

---

## npm scripts

| Command | What it does |
|---|---|
| `npm test` | Run unit tests (jsdom, fast) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:integration` | Integration tests (needs `data/sde.sqlite`) |
| `npm run setup-sde` | Download Fuzzwork SDE SQLite to `data/sde.sqlite` |
| `npm run dev` | Launch Electron + Vite HMR concurrently |
| `npm run build` | Production build (tsc + vite) |
| `npm run typecheck` | Type-check both electron and renderer tsconfigs |
| `npm run rebuild` | Recompile native modules for Electron's Node ABI |

---

## What the UI does right now (post Phase 14)

- On launch: checks SDE presence via `sde:status`. Shows `SdeSetupScreen` with
  in-app download + progress bar if absent; main UI if present.
- `rawPaste` is persisted in `localStorage` and restored on app reload.
- User pastes tab-separated inventory (`Name\tQuantity` per line)
- Clicks "Compute" (disabled when empty or loading); shows loading skeleton during compute
- Results appear in `BuildableTable` with clickable column headers for sort (asc/desc)
  and a filter input to narrow by product name
- Clicking a row selects it and shows its shortfalls in `ShortfallList`
- Parse errors from the paste appear below the textarea

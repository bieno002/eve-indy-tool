# Eve Industry Tool — CLAUDE.md

## Project Overview

A desktop app (Electron) that lets an EVE Online player paste their raw material inventory and instantly see which items they can manufacture, how many runs they can complete, and what materials are missing for partial runs. All blueprint material data comes from the EVE Static Data Export (SDE) stored locally in SQLite. The EVE Swagger Interface (ESI) public API supplements with live data where needed.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron |
| Renderer | React 19 + Vite |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Local DB | SQLite via `better-sqlite3` |
| Testing | Vitest |
| IPC | Electron contextBridge / ipcMain + ipcRenderer |

## Architecture

```
eve-indy-tool/
├── electron/           # Main process (Node.js)
│   ├── main.ts         # Entry point, BrowserWindow setup
│   ├── preload.ts      # contextBridge API exposed to renderer
│   ├── db/             # SQLite layer
│   │   ├── client.ts   # better-sqlite3 singleton
│   │   └── sde.ts      # Queries against the SDE (types, blueprints, materials)
│   └── ipc/            # ipcMain handlers
│       ├── blueprints.ts
│       └── types.ts
├── src/                # Renderer process (React)
│   ├── main.tsx        # React entry
│   ├── App.tsx
│   ├── components/
│   ├── hooks/
│   └── lib/
│       └── materialParser.ts   # Pure function: paste text → {name, qty}[]
├── data/               # Local data files (gitignored except schema)
│   └── sde.sqlite      # Downloaded EVE SDE converted to SQLite (not committed)
├── scripts/            # One-off setup scripts
│   └── downloadSde.ts  # Downloads and sets up the SDE SQLite file
└── tests/
    ├── unit/           # Pure logic tests (Vitest)
    └── integration/    # Tests that hit the local SQLite DB
```

## Data Sources

### EVE Static Data Export (SDE)
- **Source**: Pre-converted SQLite from Fuzzwork (`sqlite-latest.sqlite.bz2`)
- **Key tables used**:
  - `invTypes` — maps `typeID` ↔ `typeName`
  - `industryBlueprints` — blueprint metadata
  - `industryActivityMaterials` — `(blueprintTypeID, activityID=1, materialTypeID, quantity)`
  - `industryActivities` — activity names (1 = Manufacturing)
- **Setup**: Run `npm run setup-sde` to download and place the SQLite file in `data/`
- **Updates**: Run `npm run setup-sde` again when CCP releases a new SDE

### EVE ESI (Public, no auth)
- Base URL: `https://esi.evetech.net/latest/`
- Used for live market prices if added later
- No authentication required for the current feature set

## Blueprint Calculations

- **Material Efficiency**: Always assume **ME 10** (maximum research level)
- **ME 10 formula**: `required = max(1, ceil(baseQty * 0.9))` per material line
- **Run calculation**: For each blueprint, `possibleRuns = floor(min(haveQty / requiredPerRun))` across all materials

## Development Workflow

1. Work in small, focused commits — one logical unit per commit
2. Every new function or module must have unit tests before the PR is complete
3. Pure functions (parser, calculator) live in `src/lib/` or `electron/lib/` and are tested independently of Electron
4. IPC handlers are thin: they delegate to the pure-function layer immediately
5. Use `npm run dev` to launch Electron with Vite HMR
6. Never include `Co-Authored-By: Claude` or any AI attribution in git commit messages

## Testing

- **Framework**: Vitest
- **Unit tests**: All pure business logic — parser, ME calculator, run estimator
- **Integration tests**: SDE queries (require `data/sde.sqlite` to exist)
- **Convention**: Test files live next to their source file (`foo.ts` → `foo.test.ts`) or in `tests/`
- **Run**: `npm test` (unit only), `npm run test:integration` (requires SDE)
- New functionality always requires tests. If skipping tests for a piece of code, confirm with the user first.

## Key Conventions

- Strict TypeScript — no `any`, no implicit `any`
- Tailwind for all styling — no inline styles, no CSS modules
- All DB access goes through the `electron/db/` layer, never directly from IPC handlers
- Material paste format (EVE copy from inventory): tab-separated `Name\tQuantity` lines, quantities may include commas (e.g. `Tritanium\t1,234,567`)
- IDs are `number` in TypeScript (EVE type IDs fit in a 32-bit int)
- **No comments by default.** Only add a comment when the *why* is non-obvious: a hidden constraint, a non-obvious invariant, or a workaround for a specific bug. Never comment on what the code does — well-named identifiers already do that.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Launch Electron + Vite dev server |
| `npm test` | Run Vitest unit tests |
| `npm run test:integration` | Run integration tests (needs SDE) |
| `npm run setup-sde` | Download and configure the local SDE SQLite file |
| `npm run build` | Production build |

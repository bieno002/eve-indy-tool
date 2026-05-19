# EVE Industry Tool

A desktop app for EVE Online players that tells you what you can manufacture from your current material inventory.

Paste your raw materials, click Compute, and instantly see:
- Which blueprints you can run and how many times
- Which material is the bottleneck for each blueprint
- What you're short for partial runs

All blueprint data comes from a local copy of the EVE Static Data Export (SDE) — no internet connection required once set up.

## Setup

**Prerequisites:** Node.js 20+, npm

```bash
npm install
```

On first launch the app will prompt you to download the SDE (~100 MB). You can also download it manually beforehand:

```bash
npm run setup-sde
```

## Usage

```bash
npm run dev
```

In EVE, open your inventory, select all items, and copy (`Ctrl+A`, `Ctrl+C`). Paste the result into the text area and click **Compute**.

The table shows every blueprint you have enough materials for at least one run, sorted by possible runs. Click a row to see which materials you're short for a full run of that blueprint.

## Development

| Command | Description |
|---|---|
| `npm run dev` | Launch Electron + Vite dev server with HMR |
| `npm test` | Unit tests |
| `npm run test:integration` | Integration tests (requires SDE) |
| `npm run typecheck` | Type-check both electron and renderer |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run build` | Production build |
| `npm run package` | Build + package for current platform |
| `npm run package:mac` | macOS `.dmg` (x64 + arm64) |
| `npm run package:win` | Windows `.exe` installer (x64) |
| `npm run package:linux` | Linux `.AppImage` (x64) |

Packaged installers are written to `release/`.

## Tech Stack

- **Shell:** Electron
- **Renderer:** React 19 + Vite + Tailwind CSS
- **Language:** TypeScript (strict)
- **Local DB:** SQLite via `better-sqlite3`
- **Testing:** Vitest

## Blueprint Calculations

Material requirements are computed at **ME 10** (maximum research level):

```
required = max(1, ceil(baseQty × 0.9))
runs     = floor(min(inventory[material] / required) for each material)
```

## Data Sources

- **SDE:** [Fuzzwork pre-converted SQLite](https://www.fuzzwork.co.uk/dump/sqlite-latest.sqlite.bz2) — downloaded to `data/sde.sqlite` and gitignored. Re-run `npm run setup-sde` after CCP releases a new SDE.
- **ESI:** Reserved for future live market price integration (no auth required).

import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';
import path from 'node:path';

let instance: Database.Database | null = null;

function resolveSdePath(): string {
  // Phase 13 will add Electron userData path for production installs.
  // For now (dev + tests) resolve relative to the project root.
  const devPath = path.join(process.cwd(), 'data', 'sde.sqlite');
  if (existsSync(devPath)) return devPath;
  throw new Error(
    `SDE not found at ${devPath}. Run "npm run setup-sde" to download it.`,
  );
}

export function getDb(): Database.Database {
  if (!instance) {
    instance = new Database(resolveSdePath(), { readonly: true, fileMustExist: true });
  }
  return instance;
}

export function closeDb(): void {
  if (instance?.open) {
    instance.close();
  }
  instance = null;
}

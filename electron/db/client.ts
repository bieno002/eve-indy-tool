import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';
import path from 'node:path';

let instance: Database.Database | null = null;

export function getSdePath(): string {
  return path.join(process.cwd(), 'data', 'sde.sqlite');
}

function resolveSdePath(): string {
  const p = getSdePath();
  if (existsSync(p)) return p;
  throw new Error(`SDE not found at ${p}. Run "npm run setup-sde" to download it.`);
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

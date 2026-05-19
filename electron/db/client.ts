import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import path from 'node:path';

let instance: DatabaseSync | null = null;

export function getSdePath(): string {
  const base = process.env['EVE_SDE_DIR'] ?? process.cwd();
  return path.join(base, 'data', 'sde.sqlite');
}

function resolveSdePath(): string {
  const p = getSdePath();
  if (existsSync(p)) return p;
  throw new Error(`SDE not found at ${p}. Run "npm run setup-sde" to download it.`);
}

export function getDb(): DatabaseSync {
  if (!instance) {
    instance = new DatabaseSync(resolveSdePath(), { readOnly: true });
  }
  return instance;
}

export function closeDb(): void {
  instance?.close();
  instance = null;
}

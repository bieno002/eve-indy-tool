import { access as fsAccess } from 'node:fs/promises';
import path from 'node:path';

export type SdePaths = {
  sdePath: string;
  tmpPath: string;
};

export type DownloadArgs = {
  force: boolean;
};

export function parseArgs(argv: string[]): DownloadArgs {
  return { force: argv.includes('--force') };
}

export function getSdePaths(dataDir: string): SdePaths {
  return {
    sdePath: path.join(dataDir, 'sde.sqlite'),
    tmpPath: path.join(dataDir, 'sde.sqlite.tmp'),
  };
}

export async function shouldSkipDownload(
  sdePath: string,
  force: boolean,
  accessFn: (p: string) => Promise<void> = fsAccess,
): Promise<boolean> {
  if (force) return false;
  try {
    await accessFn(sdePath);
    return true;
  } catch {
    return false;
  }
}

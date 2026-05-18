import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import { parseArgs, getSdePaths, shouldSkipDownload } from './downloadSde.lib.js';

describe('parseArgs', () => {
  it('returns force: false with no args', () => {
    expect(parseArgs([])).toEqual({ force: false });
  });

  it('returns force: true with --force', () => {
    expect(parseArgs(['--force'])).toEqual({ force: true });
  });

  it('returns force: true when --force is among other args', () => {
    expect(parseArgs(['--verbose', '--force', '--dry-run'])).toEqual({ force: true });
  });

  it('returns force: false when only unrelated flags are passed', () => {
    expect(parseArgs(['--verbose', '--dry-run'])).toEqual({ force: false });
  });
});

describe('getSdePaths', () => {
  it('returns sde.sqlite and sde.sqlite.tmp inside the given dir', () => {
    const { sdePath, tmpPath } = getSdePaths('/some/data');
    expect(sdePath).toBe(path.join('/some/data', 'sde.sqlite'));
    expect(tmpPath).toBe(path.join('/some/data', 'sde.sqlite.tmp'));
  });

  it('handles a dir with a trailing separator', () => {
    const { sdePath } = getSdePaths('/some/data/');
    expect(sdePath).toBe(path.join('/some/data/', 'sde.sqlite'));
  });
});

describe('shouldSkipDownload', () => {
  it('returns true when the file exists and force is false', async () => {
    const accessFn = vi.fn<(p: string) => Promise<void>>().mockResolvedValue(undefined);
    const result = await shouldSkipDownload('/data/sde.sqlite', false, accessFn);
    expect(result).toBe(true);
    expect(accessFn).toHaveBeenCalledWith('/data/sde.sqlite');
  });

  it('returns false when force is true, even if the file exists', async () => {
    const accessFn = vi.fn<(p: string) => Promise<void>>().mockResolvedValue(undefined);
    const result = await shouldSkipDownload('/data/sde.sqlite', true, accessFn);
    expect(result).toBe(false);
    expect(accessFn).not.toHaveBeenCalled();
  });

  it('returns false when the file does not exist', async () => {
    const accessFn = vi.fn<(p: string) => Promise<void>>().mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
    );
    const result = await shouldSkipDownload('/data/sde.sqlite', false, accessFn);
    expect(result).toBe(false);
  });

  it('returns false for any access error, not just ENOENT', async () => {
    const accessFn = vi.fn<(p: string) => Promise<void>>().mockRejectedValue(
      Object.assign(new Error('EACCES'), { code: 'EACCES' }),
    );
    const result = await shouldSkipDownload('/data/sde.sqlite', false, accessFn);
    expect(result).toBe(false);
  });
});

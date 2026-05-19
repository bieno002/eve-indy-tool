import { describe, it, expect, vi } from 'vitest';
import { downloadSde } from './sdeDownload.js';
import type { DownloadDeps } from './sdeDownload.js';
import type { SdeProgressData } from '../../shared/types.js';

function makeDeps(overrides: Partial<DownloadDeps> = {}): Required<DownloadDeps> {
  return {
    fetchFn: vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({ start(c) { c.close(); } }),
      headers: { get: (h: string) => (h === 'content-length' ? '1000' : null) },
    }),
    mkdirFn: vi.fn().mockResolvedValue(undefined),
    renameFn: vi.fn().mockResolvedValue(undefined),
    unlinkFn: vi.fn().mockResolvedValue(undefined),
    pipelineFn: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('downloadSde', () => {
  it('rejects when fetch returns a non-ok status', async () => {
    const deps = makeDeps({
      fetchFn: vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable', body: null }),
    });
    await expect(downloadSde('/tmp/data', vi.fn(), deps)).rejects.toThrow('HTTP 503');
  });

  it('rejects when fetch returns no body', async () => {
    const deps = makeDeps({
      fetchFn: vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK', body: null, headers: { get: () => null } }),
    });
    await expect(downloadSde('/tmp/data', vi.fn(), deps)).rejects.toThrow('HTTP 200');
  });

  it('calls mkdir with the data directory', async () => {
    const deps = makeDeps();
    await downloadSde('/tmp/data', vi.fn(), deps);
    expect(deps.mkdirFn).toHaveBeenCalledWith('/tmp/data', { recursive: true });
  });

  it('renames tmp file to final sde path on success', async () => {
    const deps = makeDeps();
    await downloadSde('/tmp/data', vi.fn(), deps);
    expect(deps.renameFn).toHaveBeenCalledWith('/tmp/data/sde.sqlite.tmp', '/tmp/data/sde.sqlite');
  });

  it('emits a done:true progress event on success', async () => {
    const deps = makeDeps();
    const onProgress = vi.fn<(data: SdeProgressData) => void>();
    await downloadSde('/tmp/data', onProgress, deps);
    expect(onProgress).toHaveBeenLastCalledWith({ percent: 100, done: true });
  });

  it('removes tmp file and rethrows when pipeline fails', async () => {
    const deps = makeDeps({
      pipelineFn: vi.fn().mockRejectedValue(new Error('stream error')),
    });
    await expect(downloadSde('/tmp/data', vi.fn(), deps)).rejects.toThrow('stream error');
    expect(deps.unlinkFn).toHaveBeenCalledWith('/tmp/data/sde.sqlite.tmp');
  });

  it('does not swallow the original error when unlink also fails', async () => {
    const deps = makeDeps({
      pipelineFn: vi.fn().mockRejectedValue(new Error('stream error')),
      unlinkFn: vi.fn().mockRejectedValue(new Error('already gone')),
    });
    await expect(downloadSde('/tmp/data', vi.fn(), deps)).rejects.toThrow('stream error');
  });
});

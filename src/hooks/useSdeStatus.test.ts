import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSdeStatus } from './useSdeStatus.js';

beforeEach(() => {
  vi.stubGlobal('eveIndy', {
    sdeStatus: vi.fn().mockResolvedValue({ present: true, path: '/data/sde.sqlite' }),
    sdeDownload: vi.fn(),
    onSdeProgress: vi.fn(),
    computeBuildables: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useSdeStatus', () => {
  it('starts in checking state', () => {
    const { result } = renderHook(() => useSdeStatus());
    expect(result.current.checking).toBe(true);
    expect(result.current.present).toBeNull();
  });

  it('resolves present: true when SDE exists', async () => {
    const { result } = renderHook(() => useSdeStatus());
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(result.current.present).toBe(true);
  });

  it('resolves present: false when SDE is absent', async () => {
    vi.stubGlobal('eveIndy', {
      sdeStatus: vi.fn().mockResolvedValue({ present: false, path: null }),
    });
    const { result } = renderHook(() => useSdeStatus());
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(result.current.present).toBe(false);
  });

  it('resolves present: false when sdeStatus rejects', async () => {
    vi.stubGlobal('eveIndy', {
      sdeStatus: vi.fn().mockRejectedValue(new Error('IPC error')),
    });
    const { result } = renderHook(() => useSdeStatus());
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(result.current.present).toBe(false);
  });

  it('recheck sets checking back to true then resolves', async () => {
    const { result } = renderHook(() => useSdeStatus());
    await waitFor(() => expect(result.current.checking).toBe(false));

    await act(async () => {
      await result.current.recheck();
    });
    expect(result.current.present).toBe(true);
    expect(result.current.checking).toBe(false);
  });
});

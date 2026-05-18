import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBuildables } from './useBuildables.js';
import type { BuildableItem } from '../types/models.js';

const mockItem: BuildableItem = {
  blueprintTypeID: 1,
  productTypeID: 2,
  productName: 'Tritanium Widget',
  possibleRuns: 3,
  perRunRequirements: [],
  bottleneckMaterialTypeID: null,
  bottleneckMaterialName: null,
  shortfalls: [],
};

beforeEach(() => {
  vi.stubGlobal('eveIndy', {
    sdeStatus: vi.fn(),
    computeBuildables: vi.fn().mockResolvedValue({ items: [mockItem], parseErrors: [] }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useBuildables', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => useBuildables());
    expect(result.current.items).toEqual([]);
    expect(result.current.parseErrors).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('populates items after successful compute', async () => {
    const { result } = renderHook(() => useBuildables());
    await act(async () => {
      await result.current.compute('Tritanium\t1000');
    });
    expect(result.current.items).toEqual([mockItem]);
    expect(result.current.parseErrors).toEqual([]);
    expect(result.current.error).toBe(null);
    expect(result.current.isLoading).toBe(false);
  });

  it('sets error on IPC failure', async () => {
    vi.stubGlobal('eveIndy', {
      computeBuildables: vi.fn().mockRejectedValue(new Error('IPC failed')),
    });
    const { result } = renderHook(() => useBuildables());
    await act(async () => {
      await result.current.compute('anything');
    });
    expect(result.current.error).toBe('IPC failed');
    expect(result.current.isLoading).toBe(false);
  });

  it('clears previous error on new successful compute', async () => {
    vi.stubGlobal('eveIndy', {
      computeBuildables: vi.fn().mockRejectedValue(new Error('first failure')),
    });
    const { result } = renderHook(() => useBuildables());
    await act(async () => {
      await result.current.compute('anything');
    });
    expect(result.current.error).toBe('first failure');

    vi.stubGlobal('eveIndy', {
      computeBuildables: vi.fn().mockResolvedValue({ items: [], parseErrors: [] }),
    });
    await act(async () => {
      await result.current.compute('anything');
    });
    expect(result.current.error).toBe(null);
    expect(result.current.items).toEqual([]);
  });

  it('surfaces parse errors from the response', async () => {
    const parseErrors = [{ lineNumber: 2, line: 'bad', reason: 'missing tab' }];
    vi.stubGlobal('eveIndy', {
      computeBuildables: vi.fn().mockResolvedValue({ items: [], parseErrors }),
    });
    const { result } = renderHook(() => useBuildables());
    await act(async () => {
      await result.current.compute('bad');
    });
    expect(result.current.parseErrors).toEqual(parseErrors);
  });
});

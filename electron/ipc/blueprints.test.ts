import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerBlueprintHandlers, computeBuildablesFromDb, getSdeStatus, clearBlueprintCache } from './blueprints.js';
import { IPC_CHANNELS } from './contract.js';

vi.mock('../db/client.js', () => ({ getDb: vi.fn(() => ({})) }));
vi.mock('../db/sde.js', () => ({
  findManyTypeIdsByName: vi.fn(),
  listManufacturableBlueprints: vi.fn(),
  getAllManufacturingMaterials: vi.fn(),
}));

import { findManyTypeIdsByName, listManufacturableBlueprints, getAllManufacturingMaterials } from '../db/sde.js';
import path from 'node:path';

function makeFakeIpcMain() {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  const handle = vi.fn((channel: string, listener: (...args: unknown[]) => unknown) => {
    handlers.set(channel, listener);
  });
  const invoke = (channel: string, ...args: unknown[]): unknown => {
    const listener = handlers.get(channel);
    if (!listener) throw new Error(`No handler registered for channel: ${channel}`);
    return listener({}, ...args);
  };
  return { handle, invoke };
}

const fakeDb = {} as Parameters<typeof computeBuildablesFromDb>[0];

describe('registerBlueprintHandlers', () => {
  it('registers the sde:status channel', () => {
    const fake = makeFakeIpcMain();
    registerBlueprintHandlers(fake);
    expect(fake.handle).toHaveBeenCalledWith(IPC_CHANNELS.SDE_STATUS, expect.any(Function));
  });

  it('registers the blueprints:computeBuildables channel', () => {
    const fake = makeFakeIpcMain();
    registerBlueprintHandlers(fake);
    expect(fake.handle).toHaveBeenCalledWith(IPC_CHANNELS.BLUEPRINTS_COMPUTE, expect.any(Function));
  });

  it('registers exactly two channels', () => {
    const fake = makeFakeIpcMain();
    registerBlueprintHandlers(fake);
    expect(fake.handle).toHaveBeenCalledTimes(2);
  });

  describe('sde:status handler', () => {
    it('returns present: false for a nonexistent path', () => {
      expect(getSdeStatus('/nonexistent/path/sde.sqlite')).toEqual({ present: false, path: null });
    });

    it('returns present: true with the path for an existing file', () => {
      const knownPath = path.join(process.cwd(), 'package.json');
      const result = getSdeStatus(knownPath);
      expect(result.present).toBe(true);
      expect(result.path).toBe(knownPath);
    });
  });
});

describe('computeBuildablesFromDb', () => {
  beforeEach(() => {
    clearBlueprintCache();
    vi.mocked(findManyTypeIdsByName).mockReturnValue(new Map([['tritanium', 34], ['pyerite', 35]]));
    vi.mocked(listManufacturableBlueprints).mockReturnValue([
      { blueprintTypeID: 1, productTypeID: 2, productName: 'Antimatter Charge S' },
    ]);
    vi.mocked(getAllManufacturingMaterials).mockReturnValue([
      { blueprintTypeID: 1, materialTypeID: 34, materialName: 'Tritanium', baseQuantity: 100 },
      { blueprintTypeID: 1, materialTypeID: 35, materialName: 'Pyerite', baseQuantity: 50 },
    ]);
  });

  it('returns items with possibleRuns > 0 when inventory covers materials', () => {
    const result = computeBuildablesFromDb(
      fakeDb,
      'Tritanium\t900\nPyerite\t450',
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productName).toBe('Antimatter Charge S');
    expect(result.items[0].possibleRuns).toBe(10);
  });

  it('returns empty items when inventory is insufficient', () => {
    const result = computeBuildablesFromDb(fakeDb, 'Tritanium\t1');
    expect(result.items).toHaveLength(0);
  });

  it('surfaces parse errors from malformed paste lines', () => {
    const result = computeBuildablesFromDb(fakeDb, 'Tritanium\t900\nbad line');
    expect(result.parseErrors).toHaveLength(1);
    expect(result.parseErrors[0].lineNumber).toBe(2);
  });

  it('silently drops materials not found in the SDE', () => {
    vi.mocked(findManyTypeIdsByName).mockReturnValue(new Map([['tritanium', 34]]));
    const result = computeBuildablesFromDb(
      fakeDb,
      'Tritanium\t900\nUnknownMaterial\t999',
    );
    expect(result.parseErrors).toHaveLength(0);
  });

  it('sets bottleneckMaterialName on the result', () => {
    const result = computeBuildablesFromDb(
      fakeDb,
      'Tritanium\t900\nPyerite\t45',
    );
    expect(result.items[0].bottleneckMaterialName).toBe('Pyerite');
  });
});

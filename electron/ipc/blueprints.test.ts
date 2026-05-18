import { describe, it, expect, vi } from 'vitest';
import { registerBlueprintHandlers } from './blueprints.js';
import { IPC_CHANNELS } from './contract.js';

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

  it('sde:status handler returns the expected shape', () => {
    const fake = makeFakeIpcMain();
    registerBlueprintHandlers(fake);
    expect(fake.invoke(IPC_CHANNELS.SDE_STATUS)).toMatchObject({
      present: expect.any(Boolean),
      path: null,
    });
  });

  it('computeBuildables handler returns the expected shape', () => {
    const fake = makeFakeIpcMain();
    registerBlueprintHandlers(fake);
    expect(fake.invoke(IPC_CHANNELS.BLUEPRINTS_COMPUTE, { rawPaste: '' })).toMatchObject({
      items: [],
      parseErrors: [],
    });
  });
});

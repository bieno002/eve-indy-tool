import {
  IPC_CHANNELS,
  type IpcMainLike,
  type SdeStatusResponse,
  type ComputeBuildablesResponse,
} from './contract.js';

export function registerBlueprintHandlers(ipcMainInstance: IpcMainLike): void {
  ipcMainInstance.handle(IPC_CHANNELS.SDE_STATUS, (): SdeStatusResponse => ({
    present: false,
    path: null,
  }));

  ipcMainInstance.handle(
    IPC_CHANNELS.BLUEPRINTS_COMPUTE,
    (): ComputeBuildablesResponse => ({
      items: [],
      parseErrors: [],
    }),
  );
}

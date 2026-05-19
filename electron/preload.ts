import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC_CHANNELS,
  type SdeStatusResponse,
  type SdeProgressData,
  type ComputeBuildablesRequest,
  type ComputeBuildablesResponse,
} from './ipc/contract.js';

contextBridge.exposeInMainWorld('eveIndy', {
  sdeStatus: (): Promise<SdeStatusResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.SDE_STATUS),

  sdeDownload: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.SDE_DOWNLOAD),

  onSdeProgress: (callback: (data: SdeProgressData) => void): (() => void) => {
    const handler = (_event: unknown, data: SdeProgressData) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.SDE_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SDE_PROGRESS, handler);
  },

  computeBuildables: (request: ComputeBuildablesRequest): Promise<ComputeBuildablesResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.BLUEPRINTS_COMPUTE, request),
});

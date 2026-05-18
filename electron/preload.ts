import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC_CHANNELS,
  type SdeStatusResponse,
  type ComputeBuildablesRequest,
  type ComputeBuildablesResponse,
} from './ipc/contract.js';

contextBridge.exposeInMainWorld('eveIndy', {
  sdeStatus: (): Promise<SdeStatusResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.SDE_STATUS),

  computeBuildables: (request: ComputeBuildablesRequest): Promise<ComputeBuildablesResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.BLUEPRINTS_COMPUTE, request),
});

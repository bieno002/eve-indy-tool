export type {
  ParseErrorData,
  PerRunRequirementData,
  ShortfallData,
  BuildableResultData,
  SdeProgressData,
} from '../../shared/types.js';

import type { BuildableResultData, ParseErrorData } from '../../shared/types.js';

export const IPC_CHANNELS = {
  SDE_STATUS: 'sde:status',
  SDE_DOWNLOAD: 'sde:download',
  SDE_PROGRESS: 'sde:progress',
  BLUEPRINTS_COMPUTE: 'blueprints:computeBuildables',
} as const;

export type IpcMainLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handle(channel: string, listener: (...args: any[]) => any): void;
};

export type SdeStatusResponse = {
  present: boolean;
  path: string | null;
};

export type ComputeBuildablesRequest = {
  rawPaste: string;
};

export type ComputeBuildablesResponse = {
  items: BuildableResultData[];
  parseErrors: ParseErrorData[];
};

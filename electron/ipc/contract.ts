export type {
  ParseErrorData,
  PerRunRequirementData,
  ShortfallData,
  BuildableResultData,
} from '../../shared/types.js';

import type { BuildableResultData, ParseErrorData } from '../../shared/types.js';

export const IPC_CHANNELS = {
  SDE_STATUS: 'sde:status',
  BLUEPRINTS_COMPUTE: 'blueprints:computeBuildables',
} as const;

export type IpcMainLike = {
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

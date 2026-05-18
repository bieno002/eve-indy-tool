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

export type ParseErrorData = {
  lineNumber: number;
  line: string;
  reason: string;
};

export type PerRunRequirementData = {
  materialTypeID: number;
  materialName: string;
  requiredPerRun: number;
  have: number;
};

export type ShortfallData = {
  materialTypeID: number;
  materialName: string;
  needForOneMore: number;
};

export type BuildableResultData = {
  blueprintTypeID: number;
  productTypeID: number;
  productName: string;
  possibleRuns: number;
  perRunRequirements: PerRunRequirementData[];
  bottleneckMaterialTypeID: number | null;
  shortfalls: ShortfallData[];
};

export type ComputeBuildablesRequest = {
  rawPaste: string;
};

export type ComputeBuildablesResponse = {
  items: BuildableResultData[];
  parseErrors: ParseErrorData[];
};

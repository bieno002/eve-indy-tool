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
  bottleneckMaterialName: string | null;
  shortfalls: ShortfallData[];
};

export type SdeProgressData = {
  percent: number;
  done: boolean;
  error?: string;
};

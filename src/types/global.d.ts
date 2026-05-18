export {};

declare global {
  interface Window {
    eveIndy: {
      sdeStatus(): Promise<{
        present: boolean;
        path: string | null;
      }>;
      computeBuildables(request: { rawPaste: string }): Promise<{
        items: Array<{
          blueprintTypeID: number;
          productTypeID: number;
          productName: string;
          possibleRuns: number;
          perRunRequirements: Array<{
            materialTypeID: number;
            materialName: string;
            requiredPerRun: number;
            have: number;
          }>;
          bottleneckMaterialTypeID: number | null;
          shortfalls: Array<{
            materialTypeID: number;
            materialName: string;
            needForOneMore: number;
          }>;
        }>;
        parseErrors: Array<{
          lineNumber: number;
          line: string;
          reason: string;
        }>;
      }>;
    };
  }
}

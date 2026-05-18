import type { BuildableResultData, ParseErrorData } from '../../shared/types.js';

declare global {
  interface Window {
    eveIndy: {
      sdeStatus(): Promise<{ present: boolean; path: string | null }>;
      computeBuildables(request: { rawPaste: string }): Promise<{
        items: BuildableResultData[];
        parseErrors: ParseErrorData[];
      }>;
    };
  }
}

import type { BuildableResultData, ParseErrorData, SdeProgressData } from '../../shared/types.js';

declare global {
  interface Window {
    eveIndy: {
      sdeStatus(): Promise<{ present: boolean; path: string | null }>;
      sdeDownload(): Promise<void>;
      onSdeProgress(callback: (data: SdeProgressData) => void): () => void;
      computeBuildables(request: { rawPaste: string }): Promise<{
        items: BuildableResultData[];
        parseErrors: ParseErrorData[];
      }>;
    };
  }
}

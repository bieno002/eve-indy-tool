import type { BuildableItem, ParseErrorData } from './models.js';

declare global {
  interface Window {
    eveIndy: {
      sdeStatus(): Promise<{ present: boolean; path: string | null }>;
      computeBuildables(request: { rawPaste: string }): Promise<{
        items: BuildableItem[];
        parseErrors: ParseErrorData[];
      }>;
    };
  }
}

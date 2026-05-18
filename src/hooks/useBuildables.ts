import { useState, useCallback } from 'react';
import type { BuildableItem, ParseErrorData } from '../types/models.js';

export type UseBuildablesState = {
  items: BuildableItem[];
  parseErrors: ParseErrorData[];
  isLoading: boolean;
  error: string | null;
};

export function useBuildables() {
  const [state, setState] = useState<UseBuildablesState>({
    items: [],
    parseErrors: [],
    isLoading: false,
    error: null,
  });

  const compute = useCallback(async (rawPaste: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await window.eveIndy.computeBuildables({ rawPaste });
      setState({ items: result.items, parseErrors: result.parseErrors, isLoading: false, error: null });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  return { ...state, compute };
}

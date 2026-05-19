import { useState, useEffect, useCallback } from 'react';

export type SdeStatusState = {
  present: boolean | null;
  checking: boolean;
};

export function useSdeStatus() {
  const [state, setState] = useState<SdeStatusState>({ present: null, checking: true });

  const check = useCallback(async () => {
    setState(prev => ({ ...prev, checking: true }));
    try {
      const status = await window.eveIndy.sdeStatus();
      setState({ present: status.present, checking: false });
    } catch {
      setState({ present: false, checking: false });
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  return { ...state, recheck: check };
}

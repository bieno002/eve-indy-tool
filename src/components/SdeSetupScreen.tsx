import { useState, useEffect, useCallback } from 'react';
import type { SdeProgressData } from '../../shared/types.js';

type Props = {
  onComplete: () => void;
};

export function SdeSetupScreen({ onComplete }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<SdeProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!downloading) return;
    const unsub = window.eveIndy.onSdeProgress((data) => {
      setProgress(data);
      if (data.done && !data.error) {
        setDownloading(false);
        onComplete();
      } else if (data.error) {
        setError(data.error);
        setDownloading(false);
      }
    });
    return unsub;
  }, [downloading, onComplete]);

  const handleDownload = useCallback(async () => {
    setError(null);
    setProgress(null);
    setDownloading(true);
    try {
      await window.eveIndy.sdeDownload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDownloading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 rounded-lg p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-cyan-400 mb-2">EVE Industry Tool</h1>
        <p className="text-slate-300 mb-6">
          The EVE Static Data Export (SDE) is required to look up blueprints and materials.
          It is approximately 100 MB and only needs to be downloaded once.
        </p>

        {progress && !progress.done && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-400 mb-1">
              <span>Downloading SDE…</span>
              <span>{progress.percent}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-cyan-500 h-2 rounded-full transition-all duration-200"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="mb-4 text-red-400 text-sm">Error: {error}</p>
        )}

        <button
          className="w-full px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded disabled:opacity-50 transition-colors"
          onClick={() => void handleDownload()}
          disabled={downloading}
        >
          {downloading ? 'Downloading…' : error ? 'Retry Download' : 'Download SDE'}
        </button>
      </div>
    </div>
  );
}

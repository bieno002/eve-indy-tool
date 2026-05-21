import { useState } from 'react';
import { MaterialPasteInput } from './components/MaterialPasteInput.js';
import { BuildableTable } from './components/BuildableTable.js';
import { ShortfallList } from './components/ShortfallList.js';
import { SdeSetupScreen } from './components/SdeSetupScreen.js';
import { useBuildables } from './hooks/useBuildables.js';
import { useSdeStatus } from './hooks/useSdeStatus.js';
import type { BuildableItem } from './types/models.js';

export default function App() {
  const { present, checking, recheck } = useSdeStatus();
  const [rawPaste, setRawPaste] = useState(() => localStorage.getItem('rawPaste') ?? '');
  const [selected, setSelected] = useState<BuildableItem | null>(null);
  const { items, parseErrors, isLoading, error, compute } = useBuildables();

  const handlePasteChange = (value: string) => {
    setRawPaste(value);
    localStorage.setItem('rawPaste', value);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!present) {
    return <SdeSetupScreen onComplete={recheck} />;
  }

  const handleCompute = () => {
    setSelected(null);
    void compute(rawPaste);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <header className="mb-8 max-w-5xl mx-auto">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold text-cyan-400 tracking-tight">EVE Industry Tool</h1>
          <span className="text-slate-600 text-sm font-medium uppercase tracking-widest">ME 10</span>
        </div>
        <p className="mt-1 text-slate-500 text-sm">Paste your inventory to see what you can build.</p>
        <div className="mt-4 h-px bg-linear-to-r from-cyan-800/60 via-slate-700/40 to-transparent" />
      </header>

      <main className="max-w-5xl mx-auto flex flex-col gap-6">
        <section>
          <MaterialPasteInput value={rawPaste} onChange={handlePasteChange} errors={parseErrors} />
          <button
            className="mt-3 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors shadow-lg shadow-cyan-900/30"
            onClick={handleCompute}
            disabled={isLoading || rawPaste.trim() === ''}
          >
            {isLoading ? 'Computing…' : 'Compute'}
          </button>
          {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
        </section>

        {(isLoading || items.length > 0) && (
          <section className="grid grid-cols-3 gap-6 items-start">
            <div className="col-span-2">
              <BuildableTable
                items={items}
                selectedId={selected?.blueprintTypeID ?? null}
                onSelect={setSelected}
                isLoading={isLoading}
              />
            </div>
            <div>
              <ShortfallList item={selected} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

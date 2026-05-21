import { useState } from 'react';
import type { BuildableItem } from '../types/models.js';

type SortKey = 'productName' | 'possibleRuns' | 'bottleneckMaterialName';
type SortDir = 'asc' | 'desc';

type Props = {
  items: BuildableItem[];
  selectedId: number | null;
  onSelect: (item: BuildableItem | null) => void;
  isLoading?: boolean;
};

function sortItems(items: BuildableItem[], key: SortKey, dir: SortDir): BuildableItem[] {
  return [...items].sort((a, b) => {
    let cmp: number;
    if (key === 'possibleRuns') {
      cmp = a.possibleRuns - b.possibleRuns;
    } else if (key === 'bottleneckMaterialName') {
      cmp = (a.bottleneckMaterialName ?? '').localeCompare(b.bottleneckMaterialName ?? '');
    } else {
      cmp = a.productName.localeCompare(b.productName);
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

function RunsBadge({ runs }: { runs: number }) {
  const cls =
    runs >= 10
      ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50'
      : runs >= 3
      ? 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50'
      : runs >= 1
      ? 'bg-amber-900/60 text-amber-300 border-amber-700/50'
      : 'bg-red-900/60 text-red-300 border-red-700/50';
  return (
    <span className={`inline-flex items-center justify-center min-w-10 px-2 py-0.5 rounded-full text-xs font-semibold border tabular-nums ${cls}`}>
      {runs}
    </span>
  );
}

export function BuildableTable({ items, selectedId, onSelect, isLoading = false }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('possibleRuns');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filter, setFilter] = useState('');

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden animate-pulse" aria-label="Loading results">
        <div className="px-4 py-3 border-b border-slate-700/60">
          <div className="h-4 w-36 bg-slate-700 rounded" />
        </div>
        <div className="px-4 py-3 space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 bg-slate-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-slate-500 text-sm">No buildable items found.</p>;
  }

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'possibleRuns' ? 'desc' : 'asc');
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return <span className="ml-1 text-slate-600">↕</span>;
    return <span className="ml-1 text-cyan-400">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const filtered = filter
    ? items.filter(item => item.productName.toLowerCase().includes(filter.toLowerCase()))
    : items;
  const sorted = sortItems(filtered, sortKey, sortDir);

  return (
    <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/60 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Buildable Items</h2>
        <span className="text-xs text-slate-500 tabular-nums">
          {filtered.length !== items.length ? `${filtered.length} / ${items.length}` : items.length} items
        </span>
      </div>
      <div className="px-4 py-2.5 border-b border-slate-700/40">
        <input
          type="text"
          aria-label="Filter by product name"
          placeholder="Filter products…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full bg-slate-900/60 text-slate-100 border border-slate-600/60 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 placeholder-slate-600 transition-colors"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-900/40 border-b border-slate-700/60">
              <th
                className="py-2.5 pl-4 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-200 transition-colors"
                onClick={() => handleSort('productName')}
              >
                Product{sortIndicator('productName')}
              </th>
              <th
                className="py-2.5 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-slate-200 transition-colors"
                onClick={() => handleSort('possibleRuns')}
              >
                Runs{sortIndicator('possibleRuns')}
              </th>
              <th
                className="py-2.5 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-200 transition-colors"
                onClick={() => handleSort('bottleneckMaterialName')}
              >
                Bottleneck{sortIndicator('bottleneckMaterialName')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-500 text-sm">
                  No items match &ldquo;{filter}&rdquo;.
                </td>
              </tr>
            ) : (
              sorted.map(item => {
                const isSelected = item.blueprintTypeID === selectedId;
                const bottleneck = item.bottleneckMaterialName ?? '—';
                return (
                  <tr
                    key={item.blueprintTypeID}
                    tabIndex={0}
                    aria-selected={isSelected}
                    className={`cursor-pointer hover:bg-slate-700/40 transition-colors ${isSelected ? 'bg-slate-700/60' : ''}`}
                    onClick={() => onSelect(isSelected ? null : item)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(isSelected ? null : item);
                      }
                    }}
                  >
                    <td className={`py-2.5 pr-4 pl-3 border-l-4 transition-colors ${isSelected ? 'border-cyan-500' : 'border-transparent'}`}>
                      <span className="flex items-center gap-2.5">
                        <img
                          src={`https://images.evetech.net/types/${item.productTypeID}/icon?size=32`}
                          alt=""
                          width={24}
                          height={24}
                          className="rounded shrink-0 opacity-90"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="text-slate-200">{item.productName}</span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <RunsBadge runs={item.possibleRuns} />
                    </td>
                    <td className="py-2.5 pr-4 text-amber-400/90 text-xs">{bottleneck}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

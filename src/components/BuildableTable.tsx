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

export function BuildableTable({ items, selectedId, onSelect, isLoading = false }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('possibleRuns');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filter, setFilter] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse" aria-label="Loading results">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 bg-slate-700 rounded" />
        ))}
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

  const indicator = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const filtered = filter
    ? items.filter(item => item.productName.toLowerCase().includes(filter.toLowerCase()))
    : items;
  const sorted = sortItems(filtered, sortKey, sortDir);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        aria-label="Filter by product name"
        placeholder="Filter products…"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="w-full bg-slate-800 text-slate-100 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500"
      />
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="text-slate-400 border-b border-slate-700">
            <th
              className="py-2 pr-4 font-medium cursor-pointer select-none hover:text-slate-200"
              onClick={() => handleSort('productName')}
            >
              Product{indicator('productName')}
            </th>
            <th
              className="py-2 pr-4 font-medium text-right cursor-pointer select-none hover:text-slate-200"
              onClick={() => handleSort('possibleRuns')}
            >
              Possible Runs{indicator('possibleRuns')}
            </th>
            <th
              className="py-2 font-medium cursor-pointer select-none hover:text-slate-200"
              onClick={() => handleSort('bottleneckMaterialName')}
            >
              Bottleneck{indicator('bottleneckMaterialName')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-4 text-center text-slate-500 text-sm">
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
                  className={`cursor-pointer border-b border-slate-800 hover:bg-slate-800 transition-colors ${isSelected ? 'bg-slate-700' : ''}`}
                  onClick={() => onSelect(isSelected ? null : item)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(isSelected ? null : item);
                    }
                  }}
                >
                  <td className="py-2 pr-4">
                    <span className="flex items-center gap-2">
                      <img
                        src={`https://images.evetech.net/types/${item.productTypeID}/icon?size=32`}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded shrink-0"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                      {item.productName}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{item.possibleRuns}</td>
                  <td className="py-2 text-amber-400">{bottleneck}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

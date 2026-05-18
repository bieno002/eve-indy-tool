import type { BuildableItem } from '../types/models.js';

type Props = {
  items: BuildableItem[];
  selectedId: number | null;
  onSelect: (item: BuildableItem | null) => void;
};

export function BuildableTable({ items, selectedId, onSelect }: Props) {
  if (items.length === 0) {
    return <p className="text-slate-500 text-sm">No buildable items found.</p>;
  }

  return (
    <table className="w-full text-sm text-left border-collapse">
      <thead>
        <tr className="text-slate-400 border-b border-slate-700">
          <th className="py-2 pr-4 font-medium">Product</th>
          <th className="py-2 pr-4 font-medium text-right">Possible Runs</th>
          <th className="py-2 font-medium">Bottleneck</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => {
          const isSelected = item.blueprintTypeID === selectedId;
          const bottleneck = item.bottleneckMaterialName ?? '—';
          return (
            <tr
              key={item.blueprintTypeID}
              className={`cursor-pointer border-b border-slate-800 hover:bg-slate-800 transition-colors ${isSelected ? 'bg-slate-700' : ''}`}
              onClick={() => onSelect(isSelected ? null : item)}
            >
              <td className="py-2 pr-4">{item.productName}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{item.possibleRuns}</td>
              <td className="py-2 text-amber-400">{bottleneck}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

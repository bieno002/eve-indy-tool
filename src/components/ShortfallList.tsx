import type { BuildableItem } from '../types/models.js';

type Props = {
  item: BuildableItem | null;
};

export function ShortfallList({ item }: Props) {
  if (item === null) {
    return <p className="text-slate-500 text-sm">Select a row to see shortfalls.</p>;
  }

  if (item.shortfalls.length === 0) {
    return <p className="text-green-400 text-sm">No shortfalls — enough for one more run.</p>;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 mb-2">
        Shortfalls for {item.productName} (run {item.possibleRuns + 1})
      </h3>
      <ul className="space-y-1">
        {item.shortfalls.map(s => (
          <li key={s.materialTypeID} className="text-sm flex justify-between gap-4">
            <span className="text-slate-200">{s.materialName}</span>
            <span className="text-red-400 tabular-nums">need {s.needForOneMore.toLocaleString()} more</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

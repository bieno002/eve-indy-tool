import type { BuildableItem } from '../types/models.js';

type Props = {
  item: BuildableItem | null;
};

export function ShortfallList({ item }: Props) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
      {item === null ? (
        <div className="flex flex-col items-center justify-center min-h-50 px-4 py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-700/60 flex items-center justify-center mb-3 text-slate-500 text-lg select-none">
            →
          </div>
          <p className="text-slate-500 text-sm">Select a row to see material shortfalls.</p>
        </div>
      ) : (
        <>
          <div className="px-4 py-3 border-b border-slate-700/60 flex items-center gap-2.5">
            <img
              src={`https://images.evetech.net/types/${item.productTypeID}/icon?size=32`}
              alt=""
              width={24}
              height={24}
              className="rounded shrink-0 opacity-90"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shortfalls</p>
              <p className="text-sm text-slate-200 truncate">{item.productName}</p>
            </div>
          </div>
          <div className="px-4 py-3">
            {item.shortfalls.length === 0 ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-emerald-400 font-semibold">✓</span>
                <span className="text-emerald-400">Enough for run {item.possibleRuns + 1}</span>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
                  Need for run {item.possibleRuns + 1}
                </p>
                <ul className="space-y-2">
                  {item.shortfalls.map(s => (
                    <li key={s.materialTypeID} className="flex items-center justify-between gap-3">
                      <span className="text-slate-300 text-sm truncate">{s.materialName}</span>
                      <span className="text-red-400 text-xs tabular-nums whitespace-nowrap font-medium">
                        +{s.needForOneMore.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

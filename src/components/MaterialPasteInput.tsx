import type { ParseErrorData } from '../types/models.js';

type Props = {
  value: string;
  onChange: (value: string) => void;
  errors: ParseErrorData[];
};

export function MaterialPasteInput({ value, onChange, errors }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <textarea
        className="w-full h-48 bg-slate-800 text-slate-100 border border-slate-600 rounded p-3 font-mono text-sm resize-none focus:outline-none focus:border-cyan-500"
        placeholder={"Paste your inventory here (Name\tQuantity per line)"}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {errors.length > 0 && (
        <ul className="text-xs text-red-400 space-y-1">
          {errors.map(err => (
            <li key={err.lineNumber}>
              Line {err.lineNumber}: {err.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

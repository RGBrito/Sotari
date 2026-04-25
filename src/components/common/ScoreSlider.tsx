import clsx from 'clsx';

interface ScoreSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  description?: string;
}

const LABEL_COLORS = [
  '', 'bg-red-500', 'bg-red-400', 'bg-orange-400', 'bg-orange-300',
  'bg-amber-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-400', 'bg-emerald-500', 'bg-emerald-600',
];

export default function ScoreSlider({ label, value, onChange, disabled, min = 1, max = 10, description }: ScoreSliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <div className="flex items-center gap-1.5">
          <div className={clsx('w-2 h-2 rounded-full', LABEL_COLORS[Math.round(value)] ?? 'bg-slate-300')} />
          <span className="text-sm font-bold text-slate-900 w-4 text-right">{value}</span>
          <span className="text-xs text-slate-400">/{max}</span>
        </div>
      </div>
      {description && <p className="text-xs text-slate-500">{description}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={clsx(
          'w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

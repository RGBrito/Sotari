import clsx from 'clsx';
import { getScoreBarColor } from '../../utils/scoring';

interface ScoreBarProps {
  score: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
  color?: string;
}

export default function ScoreBar({ score, max = 10, label, showValue = true, size = 'md', color }: ScoreBarProps) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));
  const barColor = color ?? getScoreBarColor(score);

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className={clsx('text-slate-600', size === 'sm' ? 'text-xs' : 'text-sm')}>{label}</span>}
          {showValue && (
            <span className={clsx('font-semibold text-slate-800', size === 'sm' ? 'text-xs' : 'text-sm')}>
              {score.toFixed(1)}<span className="text-slate-400 font-normal">/{max}</span>
            </span>
          )}
        </div>
      )}
      <div className={clsx('bg-slate-100 rounded-full overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2')}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

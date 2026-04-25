import clsx from 'clsx';
import { FeatureStatus, FeatureSource } from '../../types';

const STATUS_CLASSES: Record<FeatureStatus, string> = {
  Backlog: 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'In Review': 'bg-amber-100 text-amber-700',
  Done: 'bg-emerald-100 text-emerald-700',
};

const SOURCE_CLASSES: Record<FeatureSource, string> = {
  manual: 'bg-slate-100 text-slate-500',
  jira: 'bg-blue-50 text-blue-600',
  linear: 'bg-violet-50 text-violet-600',
};

const SOURCE_LABELS: Record<FeatureSource, string> = {
  manual: 'Manual',
  jira: 'Jira',
  linear: 'Linear',
};

interface StatusBadgeProps { status: FeatureStatus; size?: 'sm' | 'md' }
export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span className={clsx('rounded-full font-medium', size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs', STATUS_CLASSES[status])}>
      {status}
    </span>
  );
}

interface SourceBadgeProps { source: FeatureSource; sourceId?: string }
export function SourceBadge({ source, sourceId }: SourceBadgeProps) {
  return (
    <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', SOURCE_CLASSES[source])}>
      {SOURCE_LABELS[source]}{sourceId ? ` · ${sourceId}` : ''}
    </span>
  );
}

interface LabelBadgeProps { label: string }
export function LabelBadge({ label }: LabelBadgeProps) {
  return (
    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium">
      {label}
    </span>
  );
}

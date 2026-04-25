import { useState } from 'react';
import { useAppStore } from '../store';
import { calculateESGComposite, calculateGTMComposite, calculateValuesFitComposite, getScoreBg, getQuadrant } from '../utils/scoring';
import ScoreBar from '../components/common/ScoreBar';
import { StatusBadge } from '../components/common/Badge';
import ScoringPanel from '../components/scoring/ScoringPanel';
import { Feature } from '../types';
import clsx from 'clsx';
import { TrendingUp, Filter } from 'lucide-react';

type SortKey = 'composite' | 'businessValue' | 'esg' | 'gtm' | 'effort';

export default function RankedList() {
  const features = useAppStore((s) => s.tenantFeatures());
  const tenant = useAppStore((s) => s.currentTenant());
  const role = useAppStore((s) => s.demoRole);
  const [sortKey, setSortKey] = useState<SortKey>('composite');
  const [scoringFeature, setScoringFeature] = useState<Feature | null>(null);

  const scored = features.filter((f) => f.scores);
  const unscored = features.filter((f) => !f.scores);

  function getSort(f: Feature): number {
    if (!f.scores) return -1;
    switch (sortKey) {
      case 'composite': return f.scores.compositeScore;
      case 'businessValue': return f.scores.businessValue;
      case 'esg': return calculateESGComposite(f.scores.esg, tenant.esgWeights);
      case 'gtm': return calculateGTMComposite(f.scores.gtmReadiness);
      case 'effort': return 10 - f.scores.effort;
      default: return f.scores.compositeScore;
    }
  }

  const sorted = [...scored].sort((a, b) => getSort(b) - getSort(a));

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'composite', label: 'Composite' },
    { key: 'businessValue', label: 'Business Value' },
    { key: 'esg', label: 'ESG' },
    { key: 'gtm', label: 'GTM' },
    { key: 'effort', label: 'Effort' },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ranked Features</h1>
          <p className="text-sm text-slate-500 mt-0.5">{scored.length} scored · {unscored.length} unscored</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">Sort by:</span>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            {SORT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  sortKey === key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {scored.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No scored features yet</p>
          <p className="text-sm mt-1">Score your features to see the ranked list.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[3rem_1fr_8rem_8rem_8rem_8rem_8rem_7rem] text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 px-4 py-3 bg-slate-50">
            <span>#</span>
            <span>Feature</span>
            <span>Composite</span>
            <span>BV</span>
            <span>ESG</span>
            <span>GTM</span>
            <span>Effort</span>
            <span>Quadrant</span>
          </div>
          {sorted.map((feature, i) => {
            const s = feature.scores!;
            const esg = calculateESGComposite(s.esg, tenant.esgWeights);
            const gtm = calculateGTMComposite(s.gtmReadiness);
            const q = getQuadrant(s.effort, s.compositeScore);
            return (
              <div
                key={feature.id}
                className="grid grid-cols-[3rem_1fr_8rem_8rem_8rem_8rem_8rem_7rem] items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
              >
                <span className="text-sm font-bold text-slate-400">#{i + 1}</span>
                <div className="min-w-0 pr-4">
                  <button
                    onClick={() => setScoringFeature(feature)}
                    className="text-sm font-medium text-slate-900 hover:text-brand-600 transition-colors text-left truncate block w-full"
                  >
                    {feature.title}
                  </button>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StatusBadge status={feature.status} size="sm" />
                    {feature.quarter && (
                      <span className="text-xs text-slate-400">{feature.quarter}</span>
                    )}
                  </div>
                </div>
                <div className="pr-3">
                  <span className={clsx('text-sm font-bold px-2 py-0.5 rounded', getScoreBg(s.compositeScore))}>
                    {s.compositeScore.toFixed(1)}
                  </span>
                  <div className="mt-1"><ScoreBar score={s.compositeScore} size="sm" showValue={false} /></div>
                </div>
                <ScoreCell value={s.businessValue} color="bg-blue-400" />
                <ScoreCell value={esg} color="bg-emerald-400" />
                <ScoreCell value={gtm} color="bg-amber-400" />
                <ScoreCell value={10 - s.effort} color="bg-purple-400" note={`Effort: ${s.effort}`} />
                <span className={clsx('text-xs font-semibold', q.color)}>{q.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {unscored.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Unscored Features ({unscored.length})</p>
          <div className="space-y-2">
            {unscored.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-xs flex items-center justify-center">—</span>
                  <span className="text-sm text-slate-600">{f.title}</span>
                </div>
                {role !== 'Viewer' && (
                  <button onClick={() => setScoringFeature(f)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Score →</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {scoringFeature && (
        <ScoringPanel feature={scoringFeature} onClose={() => setScoringFeature(null)} />
      )}
    </div>
  );
}

function ScoreCell({ value, color, note }: { value: number; color: string; note?: string }) {
  return (
    <div className="pr-3" title={note}>
      <span className="text-xs font-semibold text-slate-700">{value.toFixed(1)}</span>
      <div className="h-1.5 bg-slate-100 rounded-full mt-1">
        <div className={clsx('h-1.5 rounded-full', color)} style={{ width: `${(value / 10) * 100}%` }} />
      </div>
    </div>
  );
}

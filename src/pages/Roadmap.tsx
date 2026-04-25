import { useState } from 'react';
import { useAppStore } from '../store';
import { Quarter } from '../types';
import { Lock, Unlock, ChevronDown, CalendarDays, MoveRight } from 'lucide-react';
import { StatusBadge } from '../components/common/Badge';
import { getScoreBg } from '../utils/scoring';
import PermissionGuard from '../components/common/PermissionGuard';
import clsx from 'clsx';

const ALL_QUARTERS: Quarter[] = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026'];

export default function Roadmap() {
  const features = useAppStore((s) => s.tenantFeatures());
  const quarters = useAppStore((s) => s.tenantQuarters());
  const assignFeatureToQuarter = useAppStore((s) => s.assignFeatureToQuarter);
  const lockQuarter = useAppStore((s) => s.lockQuarter);
  const unlockQuarter = useAppStore((s) => s.unlockQuarter);
  const role = useAppStore((s) => s.demoRole);
  const [moveFeatureId, setMoveFeatureId] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<Quarter | ''>('');

  function getQuarterMeta(label: Quarter) {
    return quarters.find((q) => q.label === label);
  }

  function handleMove() {
    if (moveFeatureId && moveTarget) {
      assignFeatureToQuarter(moveFeatureId, moveTarget as Quarter);
      setMoveFeatureId(null);
      setMoveTarget('');
    }
  }

  const unscheduled = features.filter((f) => !f.quarter);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Roadmap</h1>
        <p className="text-sm text-slate-500 mt-0.5">Assign features to quarters · Admin can lock published quarters</p>
      </div>

      {/* Roadmap grid */}
      <div className="space-y-4">
        {ALL_QUARTERS.map((quarter) => {
          const meta = getQuarterMeta(quarter);
          const quarterFeatures = features.filter((f) => f.quarter === quarter);
          const isLocked = meta?.locked ?? false;

          return (
            <div key={quarter} className={clsx('bg-white border rounded-xl overflow-hidden', isLocked ? 'border-slate-300' : 'border-slate-200')}>
              {/* Quarter header */}
              <div className={clsx('flex items-center justify-between px-5 py-3 border-b', isLocked ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100')}>
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-800">{quarter}</h2>
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', isLocked ? 'bg-slate-200 text-slate-600' : 'bg-brand-100 text-brand-700')}>
                    {quarterFeatures.length} feature{quarterFeatures.length !== 1 ? 's' : ''}
                  </span>
                  {isLocked && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Lock className="w-3 h-3" /> Published
                    </span>
                  )}
                </div>
                <PermissionGuard allowedRoles={['Admin']}>
                  {meta ? (
                    <button
                      onClick={() => isLocked ? unlockQuarter(meta.id) : lockQuarter(meta.id)}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        isLocked
                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      )}
                    >
                      {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {isLocked ? 'Unlock' : 'Publish & Lock'}
                    </button>
                  ) : null}
                </PermissionGuard>
              </div>

              {/* Feature cards */}
              <div className="p-4">
                {quarterFeatures.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No features scheduled</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                    {quarterFeatures.map((feature) => (
                      <div
                        key={feature.id}
                        className={clsx('border rounded-lg p-3 space-y-2', isLocked ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white hover:border-brand-300 transition-colors')}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-slate-800 line-clamp-2">{feature.title}</p>
                          {feature.scores && (
                            <span className={clsx('text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0', getScoreBg(feature.scores.compositeScore))}>
                              {feature.scores.compositeScore.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <StatusBadge status={feature.status} size="sm" />
                        {!isLocked && role !== 'Viewer' && (
                          <div className="flex items-center gap-1 pt-1">
                            {moveFeatureId === feature.id ? (
                              <>
                                <select
                                  value={moveTarget}
                                  onChange={(e) => setMoveTarget(e.target.value as Quarter)}
                                  className="flex-1 text-xs border border-slate-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                                >
                                  <option value="">Move to…</option>
                                  <option value="">Unscheduled</option>
                                  {ALL_QUARTERS.filter((q) => q !== quarter).map((q) => <option key={q} value={q}>{q}</option>)}
                                </select>
                                <button onClick={handleMove} disabled={!moveTarget} className="px-2 py-1 bg-brand-600 text-white text-xs rounded disabled:opacity-50">Move</button>
                                <button onClick={() => setMoveFeatureId(null)} className="px-2 py-1 text-slate-500 hover:bg-slate-100 text-xs rounded">✕</button>
                              </>
                            ) : (
                              <button
                                onClick={() => { setMoveFeatureId(feature.id); setMoveTarget(''); }}
                                className="text-xs text-slate-400 hover:text-brand-600 flex items-center gap-1 transition-colors"
                              >
                                <MoveRight className="w-3 h-3" /> Move
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unscheduled */}
      {unscheduled.length > 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Unscheduled ({unscheduled.length})</h2>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {unscheduled.map((feature) => (
              <div key={feature.id} className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700 line-clamp-2">{feature.title}</p>
                  {feature.scores && (
                    <span className={clsx('text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0', getScoreBg(feature.scores.compositeScore))}>
                      {feature.scores.compositeScore.toFixed(1)}
                    </span>
                  )}
                </div>
                <StatusBadge status={feature.status} size="sm" />
                {role !== 'Viewer' && (
                  <div className="flex items-center gap-1 pt-1">
                    {moveFeatureId === feature.id ? (
                      <>
                        <select
                          value={moveTarget}
                          onChange={(e) => setMoveTarget(e.target.value as Quarter)}
                          className="flex-1 text-xs border border-slate-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                        >
                          <option value="">Schedule to…</option>
                          {ALL_QUARTERS.map((q) => <option key={q} value={q}>{q}</option>)}
                        </select>
                        <button onClick={handleMove} disabled={!moveTarget} className="px-2 py-1 bg-brand-600 text-white text-xs rounded disabled:opacity-50">Add</button>
                        <button onClick={() => setMoveFeatureId(null)} className="px-2 py-1 text-slate-500 hover:bg-slate-100 text-xs rounded">✕</button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setMoveFeatureId(feature.id); setMoveTarget(''); }}
                        className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
                      >
                        <CalendarDays className="w-3 h-3" /> Schedule
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

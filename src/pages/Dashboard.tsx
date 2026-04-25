import { useState } from 'react';
import { useAppStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Layers, CheckCircle2, Clock, TrendingUp, Leaf, AlertTriangle } from 'lucide-react';
import { getScoreBg, getScoreBarColor } from '../utils/scoring';
import ScoreBar from '../components/common/ScoreBar';
import clsx from 'clsx';
import { Feature } from '../types';

export default function Dashboard() {
  const features = useAppStore((s) => s.tenantFeatures());
  const tenant = useAppStore((s) => s.currentTenant());
  const role = useAppStore((s) => s.demoRole);

  const scored = features.filter((f) => f.scores);
  const unscored = features.filter((f) => !f.scores);
  const pendingReview = features.filter((f) => f.scores?.esg.pendingReview);
  const avgScore = scored.length ? scored.reduce((s, f) => s + f.scores!.compositeScore, 0) / scored.length : 0;
  const topFeatures = [...scored].sort((a, b) => b.scores!.compositeScore - a.scores!.compositeScore).slice(0, 5);

  const scoreDistribution = [
    { range: '0–2', count: scored.filter((f) => f.scores!.compositeScore < 2).length },
    { range: '2–4', count: scored.filter((f) => f.scores!.compositeScore >= 2 && f.scores!.compositeScore < 4).length },
    { range: '4–6', count: scored.filter((f) => f.scores!.compositeScore >= 4 && f.scores!.compositeScore < 6).length },
    { range: '6–8', count: scored.filter((f) => f.scores!.compositeScore >= 6 && f.scores!.compositeScore < 8).length },
    { range: '8–10', count: scored.filter((f) => f.scores!.compositeScore >= 8).length },
  ];

  const avgESG = scored.length
    ? scored.reduce((s, f) => s + (f.scores!.esg.environmental * (tenant.esgWeights.environmental / 100) + f.scores!.esg.social * (tenant.esgWeights.social / 100) + f.scores!.esg.governance * (tenant.esgWeights.governance / 100)), 0) / scored.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">{tenant.name} · {tenant.sector} · {tenant.stage}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard icon={Layers} label="Total Features" value={features.length} sub={`${unscored.length} unscored`} color="text-blue-600" bg="bg-blue-50" />
        <KPICard icon={CheckCircle2} label="Scored Features" value={scored.length} sub={`${Math.round((scored.length / Math.max(1, features.length)) * 100)}% coverage`} color="text-emerald-600" bg="bg-emerald-50" />
        <KPICard icon={TrendingUp} label="Avg Composite Score" value={avgScore.toFixed(1)} sub="out of 10" color="text-brand-600" bg="bg-brand-50" />
        <KPICard icon={Leaf} label="Avg ESG Score" value={avgESG.toFixed(1)} sub="weighted composite" color="text-teal-600" bg="bg-teal-50" />
      </div>

      {/* Alerts */}
      {(pendingReview.length > 0 || unscored.length > 0) && (
        <div className="space-y-2">
          {pendingReview.length > 0 && role === 'Admin' && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span><strong>{pendingReview.length}</strong> feature{pendingReview.length !== 1 ? 's have' : ' has'} pending ESG score adjustments awaiting your review.</span>
            </div>
          )}
          {unscored.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span><strong>{unscored.length}</strong> feature{unscored.length !== 1 ? 's are' : ' is'} not yet scored. Go to Features to score them.</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Score distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Score Distribution</h2>
          {scored.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No scored features yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreDistribution} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                  formatter={(value) => [value, 'Features']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {scoreDistribution.map((entry, i) => {
                    const midpoint = [1, 3, 5, 7, 9][i];
                    return <Cell key={i} fill={midpoint >= 8 ? '#10b981' : midpoint >= 6 ? '#3b82f6' : midpoint >= 4 ? '#f59e0b' : '#ef4444'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Dimension weights */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Dimension Weights</h2>
          <div className="space-y-3">
            {[
              { label: 'Business Value', weight: tenant.dimensionWeights.businessValue, color: 'bg-blue-500' },
              { label: 'ESG', weight: tenant.dimensionWeights.esg, color: 'bg-emerald-500' },
              { label: 'Values Fit', weight: tenant.dimensionWeights.valuesFit, color: 'bg-rose-500' },
              { label: 'GTM Readiness', weight: tenant.dimensionWeights.gtmReadiness, color: 'bg-amber-500' },
              { label: 'Effort (inverted)', weight: tenant.dimensionWeights.effort, color: 'bg-purple-500' },
            ].map(({ label, weight, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-32 flex-shrink-0">{label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className={clsx('h-2 rounded-full', color)} style={{ width: `${weight}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-8 text-right">{weight}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Features */}
      {topFeatures.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Top Scored Features</h2>
          <div className="space-y-3">
            {topFeatures.map((f, i) => (
              <FeatureSummaryRow key={f.id} feature={f} rank={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, color, bg }: { icon: React.ElementType; label: string; value: string | number; sub: string; color: string; bg: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', bg)}>
          <Icon className={clsx('w-4 h-4', color)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function FeatureSummaryRow({ feature, rank }: { feature: Feature; rank: number }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{feature.title}</p>
      </div>
      <div className="w-32">
        <ScoreBar score={feature.scores!.compositeScore} size="sm" showValue={false} />
      </div>
      <span className={clsx('px-2 py-0.5 rounded text-xs font-bold min-w-12 text-center', getScoreBg(feature.scores!.compositeScore))}>
        {feature.scores!.compositeScore.toFixed(1)}
      </span>
    </div>
  );
}

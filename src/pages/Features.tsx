import { useState } from 'react';
import { Plus, Search, SlidersHorizontal, Plug2, Trash2, ChevronDown } from 'lucide-react';
import { useAppStore } from '../store';
import { Feature, FeatureStatus } from '../types';
import { StatusBadge, SourceBadge, LabelBadge } from '../components/common/Badge';
import AddFeatureModal from '../components/features/AddFeatureModal';
import IntegrationModal from '../components/features/IntegrationModal';
import ScoringPanel from '../components/scoring/ScoringPanel';
import ScoreBar from '../components/common/ScoreBar';
import PermissionGuard from '../components/common/PermissionGuard';
import clsx from 'clsx';
import { getScoreBg } from '../utils/scoring';

const STATUS_FILTERS: (FeatureStatus | 'All')[] = ['All', 'Backlog', 'In Progress', 'In Review', 'Done'];

export default function Features() {
  const features = useAppStore((s) => s.tenantFeatures());
  const deleteFeature = useAppStore((s) => s.deleteFeature);
  const role = useAppStore((s) => s.demoRole);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeatureStatus | 'All'>('All');
  const [addOpen, setAddOpen] = useState(false);
  const [jiraOpen, setJiraOpen] = useState(false);
  const [linearOpen, setLinearOpen] = useState(false);
  const [scoringFeature, setScoringFeature] = useState<Feature | null>(null);
  const [showIntegrations, setShowIntegrations] = useState(false);

  const filtered = features.filter((f) => {
    const matchSearch = !search || f.title.toLowerCase().includes(search.toLowerCase()) || f.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const scored = filtered.filter((f) => f.scores);
  const unscored = filtered.filter((f) => !f.scores);

  return (
    <div className="p-6 space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Features</h1>
          <p className="text-sm text-slate-500 mt-0.5">{features.length} features · {scored.length} scored</p>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGuard allowedRoles={['Admin', 'PM']}>
            {/* Integration dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowIntegrations((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Plug2 className="w-4 h-4" />
                Connect
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showIntegrations && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 min-w-40">
                  <button onClick={() => { setJiraOpen(true); setShowIntegrations(false); }} className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <span className="w-4 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">J</span>
                    Jira
                  </button>
                  <button onClick={() => { setLinearOpen(true); setShowIntegrations(false); }} className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <span className="w-4 h-4 bg-violet-600 rounded text-white text-xs flex items-center justify-center font-bold">L</span>
                    Linear
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Feature
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search features…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-white">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                'px-3 py-1 rounded text-xs font-medium transition-colors',
                statusFilter === s ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-400 flex items-center gap-1">
          <SlidersHorizontal className="w-4 h-4" />
          {filtered.length} results
        </span>
      </div>

      {/* Feature list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium">No features found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((feature) => (
            <FeatureRow
              key={feature.id}
              feature={feature}
              onScore={() => setScoringFeature(feature)}
              onDelete={role !== 'Viewer' ? () => deleteFeature(feature.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddFeatureModal open={addOpen} onClose={() => setAddOpen(false)} />
      <IntegrationModal open={jiraOpen} onClose={() => setJiraOpen(false)} integration="jira" />
      <IntegrationModal open={linearOpen} onClose={() => setLinearOpen(false)} integration="linear" />

      {/* Scoring panel */}
      {scoringFeature && (
        <ScoringPanel feature={scoringFeature} onClose={() => setScoringFeature(null)} />
      )}
    </div>
  );
}

function FeatureRow({ feature, onScore, onDelete }: { feature: Feature; onScore: () => void; onDelete?: () => void }) {
  const role = useAppStore((s) => s.demoRole);
  const hasScores = !!feature.scores;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-300 transition-colors group">
      <div className="flex items-start gap-4">
        {/* Score indicator */}
        <div className={clsx('w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-bold', hasScores ? getScoreBg(feature.scores!.compositeScore) : 'bg-slate-100 text-slate-400')}>
          {hasScores ? feature.scores!.compositeScore.toFixed(1) : '—'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
              {feature.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{feature.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status={feature.status} size="sm" />
              <SourceBadge source={feature.source} sourceId={feature.sourceId} />
            </div>
          </div>

          {/* Score bars */}
          {hasScores && feature.scores && (
            <div className="grid grid-cols-5 gap-2 mt-3">
              {[
                { label: 'BV', value: feature.scores.businessValue, color: 'bg-blue-400' },
                { label: 'ESG', value: (feature.scores.esg.environmental * 0.4 + feature.scores.esg.social * 0.35 + feature.scores.esg.governance * 0.25), color: 'bg-emerald-400' },
                { label: 'VF', value: feature.scores.valuesFit.reduce((s, v) => s + v.score, 0) / Math.max(1, feature.scores.valuesFit.length), color: 'bg-rose-400' },
                { label: 'GTM', value: (feature.scores.gtmReadiness.marketTiming + feature.scores.gtmReadiness.salesReadiness + feature.scores.gtmReadiness.customerDemand + feature.scores.gtmReadiness.channelFit) / 4, color: 'bg-amber-400' },
                { label: 'Eff', value: 10 - feature.scores.effort, color: 'bg-purple-400' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                  <ScoreBar score={value} size="sm" showValue={false} color={color} />
                  <p className="text-xs text-slate-600 font-medium mt-0.5">{value.toFixed(1)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Labels & quarter */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {feature.labels.map((l) => <LabelBadge key={l} label={l} />)}
            {feature.quarter && (
              <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded border border-brand-200">{feature.quarter}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {role !== 'Viewer' && (
            <button
              onClick={onScore}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                hasScores
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              )}
            >
              {hasScores ? 'Edit Score' : 'Score'}
            </button>
          )}
          {role === 'Viewer' && hasScores && (
            <button onClick={onScore} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              View
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { ESGSubScore, Feature } from '../../types';
import { useAppStore } from '../../store';
import ScoreSlider from '../common/ScoreSlider';
import ScoreBar from '../common/ScoreBar';
import clsx from 'clsx';

interface Props {
  feature: Feature;
  scores: ESGSubScore;
  onChange: (scores: ESGSubScore) => void;
  readonly?: boolean;
}

export default function ESGAnalysis({ feature, scores, onChange, readonly }: Props) {
  const tenant = useAppStore((s) => s.currentTenant());
  const role = useAppStore((s) => s.demoRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [proposeMode, setProposeMode] = useState(false);
  const [proposedE, setProposedE] = useState(scores.proposedEnvironmental ?? scores.environmental);
  const [proposedS, setProposedS] = useState(scores.proposedSocial ?? scores.social);
  const [proposedG, setProposedG] = useState(scores.proposedGovernance ?? scores.governance);

  const esgComposite = (
    scores.environmental * (tenant.esgWeights.environmental / 100) +
    scores.social * (tenant.esgWeights.social / 100) +
    scores.governance * (tenant.esgWeights.governance / 100)
  );

  async function handleAnalyse() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze-esg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: feature.title,
          description: feature.description,
          sector: tenant.sector,
          gtmModel: tenant.gtmModel,
          values: tenant.values.map((v) => v.name),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Analysis failed');
      }
      const data = await res.json();
      onChange({
        ...scores,
        environmental: data.environmental.score,
        social: data.social.score,
        governance: data.governance.score,
        environmentalReasoning: data.environmental.reasoning,
        socialReasoning: data.social.reasoning,
        governanceReasoning: data.governance.reasoning,
        summary: data.summary,
        recommendations: data.recommendations,
        aiGenerated: true,
        pendingReview: false,
      });
      setShowReasoning(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to analyse. Check API key.');
    } finally {
      setLoading(false);
    }
  }

  function handlePropose() {
    onChange({
      ...scores,
      pendingReview: true,
      proposedBy: 'current-user',
      proposedEnvironmental: proposedE,
      proposedSocial: proposedS,
      proposedGovernance: proposedG,
    });
    setProposeMode(false);
  }

  function handleApproveProposal() {
    onChange({
      ...scores,
      environmental: scores.proposedEnvironmental ?? scores.environmental,
      social: scores.proposedSocial ?? scores.social,
      governance: scores.proposedGovernance ?? scores.governance,
      pendingReview: false,
      proposedBy: undefined,
      proposedEnvironmental: undefined,
      proposedSocial: undefined,
      proposedGovernance: undefined,
    });
  }

  function handleRejectProposal() {
    onChange({
      ...scores,
      pendingReview: false,
      proposedBy: undefined,
      proposedEnvironmental: undefined,
      proposedSocial: undefined,
      proposedGovernance: undefined,
    });
  }

  return (
    <div className="space-y-4">
      {/* Composite ESG Score */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-emerald-800">Composite ESG Score</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              E {tenant.esgWeights.environmental}% · S {tenant.esgWeights.social}% · G {tenant.esgWeights.governance}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-700">{esgComposite.toFixed(1)}</p>
            <p className="text-xs text-emerald-600">/10</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-emerald-700 font-medium mb-1">E</p>
            <ScoreBar score={scores.environmental} size="sm" showValue={false} color="bg-emerald-500" />
            <p className="text-sm font-bold text-emerald-800 mt-1">{scores.environmental}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-blue-700 font-medium mb-1">S</p>
            <ScoreBar score={scores.social} size="sm" showValue={false} color="bg-blue-500" />
            <p className="text-sm font-bold text-blue-800 mt-1">{scores.social}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-purple-700 font-medium mb-1">G</p>
            <ScoreBar score={scores.governance} size="sm" showValue={false} color="bg-purple-500" />
            <p className="text-sm font-bold text-purple-800 mt-1">{scores.governance}</p>
          </div>
        </div>
      </div>

      {/* AI Analyse button */}
      {!readonly && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyse}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Analysing with AI…' : scores.aiGenerated ? 'Re-analyse with AI' : 'Analyse with AI'}
          </button>
          {scores.aiGenerated && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> AI-scored
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Analysis failed</p>
            <p className="text-xs mt-0.5">{error}</p>
            <p className="text-xs mt-1 text-red-500">Set ANTHROPIC_API_KEY in server/.env to enable AI analysis.</p>
          </div>
        </div>
      )}

      {/* Pending review banner */}
      {scores.pendingReview && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-amber-800">PM proposed score adjustment</p>
              <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
                <div>
                  <span className="text-slate-500">E: </span>
                  <span className="font-medium text-slate-800">{scores.environmental}</span>
                  <span className="text-amber-600"> → {scores.proposedEnvironmental}</span>
                </div>
                <div>
                  <span className="text-slate-500">S: </span>
                  <span className="font-medium text-slate-800">{scores.social}</span>
                  <span className="text-amber-600"> → {scores.proposedSocial}</span>
                </div>
                <div>
                  <span className="text-slate-500">G: </span>
                  <span className="font-medium text-slate-800">{scores.governance}</span>
                  <span className="text-amber-600"> → {scores.proposedGovernance}</span>
                </div>
              </div>
            </div>
            {role === 'Admin' && (
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={handleApproveProposal} className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors">Approve</button>
                <button onClick={handleRejectProposal} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">Reject</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual sliders (Admin only for direct edit, PM for proposals) */}
      {!readonly && role === 'Admin' && (
        <div className="space-y-3 border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Manual Override</p>
          <ScoreSlider
            label="Environmental Impact"
            value={scores.environmental}
            onChange={(v) => onChange({ ...scores, environmental: v, aiGenerated: false })}
            description="How positively does this feature impact the environment?"
          />
          <ScoreSlider
            label="Social Impact"
            value={scores.social}
            onChange={(v) => onChange({ ...scores, social: v, aiGenerated: false })}
            description="How does this feature affect people, communities, or labour standards?"
          />
          <ScoreSlider
            label="Governance Impact"
            value={scores.governance}
            onChange={(v) => onChange({ ...scores, governance: v, aiGenerated: false })}
            description="How does this feature improve accountability, compliance, or transparency?"
          />
        </div>
      )}

      {/* PM propose adjustment */}
      {!readonly && role === 'PM' && !scores.pendingReview && (
        <div>
          {!proposeMode ? (
            <button onClick={() => setProposeMode(true)} className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              Propose score adjustment
            </button>
          ) : (
            <div className="space-y-3 border border-amber-200 rounded-lg p-4 bg-amber-50">
              <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Propose Score Adjustment (pending Admin review)</p>
              <ScoreSlider label="Environmental" value={proposedE} onChange={setProposedE} />
              <ScoreSlider label="Social" value={proposedS} onChange={setProposedS} />
              <ScoreSlider label="Governance" value={proposedG} onChange={setProposedG} />
              <div className="flex gap-2">
                <button onClick={handlePropose} className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">Submit Proposal</button>
                <button onClick={() => setProposeMode(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Reasoning */}
      {scores.aiGenerated && (scores.summary || scores.environmentalReasoning) && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowReasoning((r) => !r)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              AI Analysis & Reasoning
            </span>
            {showReasoning ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showReasoning && (
            <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
              {scores.summary && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">SUMMARY</p>
                  <p className="text-sm text-slate-700">{scores.summary}</p>
                </div>
              )}
              <div className="grid gap-3">
                {scores.environmentalReasoning && (
                  <div className="bg-emerald-50 rounded p-2.5">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Environmental</p>
                    <p className="text-xs text-emerald-800">{scores.environmentalReasoning}</p>
                  </div>
                )}
                {scores.socialReasoning && (
                  <div className="bg-blue-50 rounded p-2.5">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Social</p>
                    <p className="text-xs text-blue-800">{scores.socialReasoning}</p>
                  </div>
                )}
                {scores.governanceReasoning && (
                  <div className="bg-purple-50 rounded p-2.5">
                    <p className="text-xs font-semibold text-purple-700 mb-1">Governance</p>
                    <p className="text-xs text-purple-800">{scores.governanceReasoning}</p>
                  </div>
                )}
              </div>
              {scores.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">RECOMMENDATIONS</p>
                  <ul className="space-y-1">
                    {scores.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">{i + 1}</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

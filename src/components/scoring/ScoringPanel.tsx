import { useState, useEffect } from 'react';
import { X, Target, Leaf, Heart, Rocket, Zap, BarChart3, Save, ChevronRight } from 'lucide-react';
import { Feature, FeatureScores, GTMSubScore, ValueFitItem, ESGSubScore } from '../../types';
import { useAppStore } from '../../store';
import ScoreSlider from '../common/ScoreSlider';
import ScoreBar from '../common/ScoreBar';
import ESGAnalysis from './ESGAnalysis';
import { calculateCompositeScore, calculateESGComposite, calculateGTMComposite, calculateValuesFitComposite, getScoreBg } from '../../utils/scoring';
import clsx from 'clsx';

interface Props {
  feature: Feature;
  onClose: () => void;
}

type Tab = 'business' | 'esg' | 'values' | 'gtm' | 'effort' | 'summary';

const TABS: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'business', label: 'Business Value', icon: Target, color: 'text-blue-600' },
  { id: 'esg', label: 'ESG', icon: Leaf, color: 'text-emerald-600' },
  { id: 'values', label: 'Values Fit', icon: Heart, color: 'text-rose-600' },
  { id: 'gtm', label: 'GTM Readiness', icon: Rocket, color: 'text-amber-600' },
  { id: 'effort', label: 'Effort', icon: Zap, color: 'text-purple-600' },
  { id: 'summary', label: 'Summary', icon: BarChart3, color: 'text-brand-600' },
];

function defaultScores(feature: Feature, tenant: ReturnType<typeof useAppStore.getState>['currentTenant'] extends () => infer T ? T : never): FeatureScores {
  return feature.scores ?? {
    businessValue: 5,
    esg: {
      environmental: 5, social: 5, governance: 5,
      environmentalReasoning: '', socialReasoning: '', governanceReasoning: '',
      summary: '', recommendations: [],
      aiGenerated: false, pendingReview: false,
    },
    valuesFit: tenant.values.map((v) => ({ valueId: v.id, score: 5, reasoning: '' })),
    gtmReadiness: { marketTiming: 5, salesReadiness: 5, customerDemand: 5, channelFit: 5 },
    effort: 5,
    compositeScore: 0,
  };
}

export default function ScoringPanel({ feature, onClose }: Props) {
  const tenant = useAppStore((s) => s.currentTenant());
  const updateFeatureScores = useAppStore((s) => s.updateFeatureScores);
  const role = useAppStore((s) => s.demoRole);
  const readonly = role === 'Viewer';

  const [tab, setTab] = useState<Tab>('business');
  const [scores, setScores] = useState<FeatureScores>(() => defaultScores(feature, tenant));

  useEffect(() => {
    setScores(defaultScores(feature, tenant));
  }, [feature.id]);

  // Ensure valuesFit has entries for all tenant values
  useEffect(() => {
    setScores((prev) => {
      const vf = tenant.values.map((v) => {
        const existing = prev.valuesFit.find((x) => x.valueId === v.id);
        return existing ?? { valueId: v.id, score: 5, reasoning: '' };
      });
      return { ...prev, valuesFit: vf };
    });
  }, [tenant.values]);

  const composite = calculateCompositeScore(scores, tenant.dimensionWeights, tenant.esgWeights);

  function handleSave() {
    updateFeatureScores(feature.id, scores);
  }

  function updateESG(esg: ESGSubScore) {
    setScores((prev) => ({ ...prev, esg }));
  }

  function updateValuesFit(valueId: string, field: 'score' | 'reasoning', value: number | string) {
    setScores((prev) => ({
      ...prev,
      valuesFit: prev.valuesFit.map((v) =>
        v.valueId === valueId ? { ...v, [field]: value } : v
      ),
    }));
  }

  function updateGTM(field: keyof GTMSubScore, value: number) {
    setScores((prev) => ({ ...prev, gtmReadiness: { ...prev.gtmReadiness, [field]: value } }));
  }

  const esgComposite = calculateESGComposite(scores.esg, tenant.esgWeights);
  const gtmComposite = calculateGTMComposite(scores.gtmReadiness);
  const valuesFitComposite = calculateValuesFitComposite(scores.valuesFit);

  return (
    <div className="fixed inset-y-0 right-0 w-[640px] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-40">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
        <div className="min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">Scoring</span>
            {readonly && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">Read-only</span>}
          </div>
          <h2 className="text-base font-semibold text-slate-900 truncate">{feature.title}</h2>
          {feature.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{feature.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!readonly && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 flex-shrink-0 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
              tab === id
                ? `border-brand-600 text-brand-700 bg-brand-50/50`
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            <Icon className={clsx('w-3.5 h-3.5', tab === id ? color : 'text-slate-400')} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">

        {tab === 'business' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Business Value / Revenue Impact</h3>
              <p className="text-xs text-slate-500">Rate the potential business impact: revenue generation, strategic importance, and customer demand.</p>
            </div>
            <ScoreSlider
              label="Business Value Score"
              value={scores.businessValue}
              onChange={(v) => setScores((p) => ({ ...p, businessValue: v }))}
              disabled={readonly}
              description="1 = minimal value, 10 = game-changing revenue/strategic impact"
            />
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Revenue Potential</p>
                <p className="text-lg font-bold text-slate-800">{scores.businessValue}</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Weight</p>
                <p className="text-lg font-bold text-slate-800">{tenant.dimensionWeights.businessValue}%</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">Contribution</p>
                <p className="text-lg font-bold text-blue-700">
                  {((scores.businessValue / 10) * tenant.dimensionWeights.businessValue / 10).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === 'esg' && (
          <ESGAnalysis feature={feature} scores={scores.esg} onChange={updateESG} readonly={readonly} />
        )}

        {tab === 'values' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Values Fit</h3>
              <p className="text-xs text-slate-500">Rate how strongly this feature aligns with each of {tenant.name}'s company values.</p>
            </div>
            {tenant.values.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No company values configured. Go to Settings to add values.</p>
            ) : (
              tenant.values.map((value) => {
                const vf = scores.valuesFit.find((v) => v.valueId === value.id);
                const score = vf?.score ?? 5;
                const reasoning = vf?.reasoning ?? '';
                return (
                  <div key={value.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{value.name}</p>
                      {value.description && <p className="text-xs text-slate-500 mt-0.5">{value.description}</p>}
                    </div>
                    <ScoreSlider
                      label="Alignment Score"
                      value={score}
                      onChange={(v) => updateValuesFit(value.id, 'score', v)}
                      disabled={readonly}
                    />
                    {!readonly && (
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Reasoning (optional)</label>
                        <input
                          type="text"
                          value={reasoning}
                          onChange={(e) => updateValuesFit(value.id, 'reasoning', e.target.value)}
                          placeholder="Why does this feature align with this value?"
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {scores.valuesFit.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center justify-between">
                <p className="text-sm text-rose-700 font-medium">Values Fit Composite</p>
                <p className="text-xl font-bold text-rose-700">{valuesFitComposite.toFixed(1)}<span className="text-sm font-normal">/10</span></p>
              </div>
            )}
          </div>
        )}

        {tab === 'gtm' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">GTM Readiness</h3>
              <p className="text-xs text-slate-500">
                Rate go-to-market readiness for your <strong>{tenant.gtmModel}</strong> motion.
              </p>
            </div>
            <ScoreSlider label="Market Timing" value={scores.gtmReadiness.marketTiming} onChange={(v) => updateGTM('marketTiming', v)} disabled={readonly} description="Is the market ready for this feature now?" />
            <ScoreSlider label="Sales Readiness" value={scores.gtmReadiness.salesReadiness} onChange={(v) => updateGTM('salesReadiness', v)} disabled={readonly} description="Can the sales/growth team position and sell this effectively?" />
            <ScoreSlider label="Customer Demand" value={scores.gtmReadiness.customerDemand} onChange={(v) => updateGTM('customerDemand', v)} disabled={readonly} description="How strongly have customers/prospects requested this?" />
            <ScoreSlider label="Channel Fit" value={scores.gtmReadiness.channelFit} onChange={(v) => updateGTM('channelFit', v)} disabled={readonly} description="How well does this leverage your existing distribution channels?" />
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
              <p className="text-sm text-amber-700 font-medium">GTM Composite</p>
              <p className="text-xl font-bold text-amber-700">{gtmComposite.toFixed(1)}<span className="text-sm font-normal">/10</span></p>
            </div>
          </div>
        )}

        {tab === 'effort' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Effort / Implementation Cost</h3>
              <p className="text-xs text-slate-500">Rate the engineering and implementation effort. Higher effort = lower priority contribution (inverted in composite score).</p>
            </div>
            <ScoreSlider
              label="Effort Score"
              value={scores.effort}
              onChange={(v) => setScores((p) => ({ ...p, effort: v }))}
              disabled={readonly}
              description="1 = trivial change, 10 = multi-month platform rewrite"
            />
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Effort Score</p>
                <p className="text-lg font-bold text-slate-800">{scores.effort}</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Inverted</p>
                <p className="text-lg font-bold text-purple-700">{10 - scores.effort}</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-600 mb-1">Weight</p>
                <p className="text-lg font-bold text-purple-700">{tenant.dimensionWeights.effort}%</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">
                Lower effort features get a higher priority boost. An effort of {scores.effort} contributes a score of {10 - scores.effort}/10 to the composite.
              </p>
            </div>
          </div>
        )}

        {tab === 'summary' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Composite Score Summary</h3>
              <p className="text-xs text-slate-500">Weighted composite score across all 5 dimensions.</p>
            </div>

            {/* Big composite score */}
            <div className={clsx('rounded-xl p-5 text-center', getScoreBg(composite))}>
              <p className="text-xs font-medium uppercase tracking-wider opacity-70">Composite Priority Score</p>
              <p className="text-5xl font-bold mt-1">{composite.toFixed(1)}</p>
              <p className="text-sm opacity-70">/10</p>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              {[
                { label: 'Business Value', score: scores.businessValue, weight: tenant.dimensionWeights.businessValue, color: 'bg-blue-500' },
                { label: 'ESG Score', score: esgComposite, weight: tenant.dimensionWeights.esg, color: 'bg-emerald-500' },
                { label: 'Values Fit', score: valuesFitComposite, weight: tenant.dimensionWeights.valuesFit, color: 'bg-rose-500' },
                { label: 'GTM Readiness', score: gtmComposite, weight: tenant.dimensionWeights.gtmReadiness, color: 'bg-amber-500' },
                { label: 'Effort (inverted)', score: 10 - scores.effort, weight: tenant.dimensionWeights.effort, color: 'bg-purple-500' },
              ].map(({ label, score, weight, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-36 flex-shrink-0">
                    <p className="text-xs font-medium text-slate-700">{label}</p>
                    <p className="text-xs text-slate-400">{weight}% weight</p>
                  </div>
                  <div className="flex-1">
                    <ScoreBar score={score} showValue={false} size="sm" color={color} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 w-8 text-right">{score.toFixed(1)}</span>
                  <span className="text-xs text-slate-400 w-12 text-right">
                    → {((score / 10) * weight / 10).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">Final Composite</span>
              <span className="text-xl font-bold text-brand-700">{composite.toFixed(1)}/10</span>
            </div>

            {!readonly && (
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg font-medium text-sm hover:bg-brand-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Scores
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick nav footer */}
      <div className="flex-shrink-0 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            const idx = TABS.findIndex((t) => t.id === tab);
            if (idx > 0) setTab(TABS[idx - 1].id);
          }}
          disabled={TABS[0].id === tab}
          className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30"
        >
          ← Previous
        </button>
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx('w-2 h-2 rounded-full transition-colors', tab === t.id ? 'bg-brand-600' : 'bg-slate-300')}
            />
          ))}
        </div>
        <button
          onClick={() => {
            const idx = TABS.findIndex((t) => t.id === tab);
            if (idx < TABS.length - 1) setTab(TABS[idx + 1].id);
          }}
          disabled={TABS[TABS.length - 1].id === tab}
          className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 flex items-center gap-1"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

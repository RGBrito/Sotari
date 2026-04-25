import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Tenant, CompanyValue, DimensionWeights, ESGWeights, TenantStage, GTMModel } from '../types';
import { Plus, Trash2, Save, AlertTriangle, Users, Sliders, Building2, Leaf, Heart } from 'lucide-react';
import clsx from 'clsx';

const STAGES: TenantStage[] = ['Seed', 'Series A', 'Series B', 'Scale-up'];
const GTM_MODELS: GTMModel[] = ['Product-Led', 'Sales-Led', 'Community-Led', 'Hybrid'];

type SettingsTab = 'company' | 'weights' | 'esg' | 'values' | 'users';

export default function Settings() {
  const tenant = useAppStore((s) => s.currentTenant());
  const updateTenantSettings = useAppStore((s) => s.updateTenantSettings);
  const users = useAppStore((s) => s.tenantUsers());
  const role = useAppStore((s) => s.demoRole);

  const [tab, setTab] = useState<SettingsTab>('company');
  const [saved, setSaved] = useState(false);

  // Local state mirrors tenant
  const [name, setName] = useState(tenant.name);
  const [sector, setSector] = useState(tenant.sector);
  const [stage, setStage] = useState<TenantStage>(tenant.stage);
  const [gtmModel, setGtmModel] = useState<GTMModel>(tenant.gtmModel);
  const [values, setValues] = useState<CompanyValue[]>(tenant.values);
  const [esgWeights, setEsgWeights] = useState<ESGWeights>({ ...tenant.esgWeights });
  const [dimWeights, setDimWeights] = useState<DimensionWeights>({ ...tenant.dimensionWeights });

  useEffect(() => {
    setName(tenant.name);
    setSector(tenant.sector);
    setStage(tenant.stage);
    setGtmModel(tenant.gtmModel);
    setValues(tenant.values);
    setEsgWeights({ ...tenant.esgWeights });
    setDimWeights({ ...tenant.dimensionWeights });
  }, [tenant.id]);

  const esgSum = esgWeights.environmental + esgWeights.social + esgWeights.governance;
  const dimSum = dimWeights.businessValue + dimWeights.esg + dimWeights.valuesFit + dimWeights.gtmReadiness + dimWeights.effort;

  function handleSave() {
    updateTenantSettings({ name, sector, stage, gtmModel, values, esgWeights, dimensionWeights: dimWeights });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function addValue() {
    if (values.length >= 5) return;
    setValues([...values, { id: `v-${Date.now()}`, name: '', description: '' }]);
  }

  function updateValue(id: string, field: keyof CompanyValue, val: string) {
    setValues((prev) => prev.map((v) => v.id === id ? { ...v, [field]: val } : v));
  }

  function removeValue(id: string) {
    setValues((prev) => prev.filter((v) => v.id !== id));
  }

  if (role !== 'Admin') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-96">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
        <h2 className="text-lg font-semibold text-slate-800">Admin Access Required</h2>
        <p className="text-sm text-slate-500 mt-1">Only Admins can access company settings.</p>
        <p className="text-xs text-slate-400 mt-2">Use the role switcher in the header to switch to Admin.</p>
      </div>
    );
  }

  const TABS = [
    { id: 'company' as const, label: 'Company', icon: Building2 },
    { id: 'values' as const, label: 'Values', icon: Heart },
    { id: 'esg' as const, label: 'ESG Weights', icon: Leaf },
    { id: 'weights' as const, label: 'Dimension Weights', icon: Sliders },
    { id: 'users' as const, label: 'Users', icon: Users },
  ];

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">{tenant.name} · Admin configuration</p>
        </div>
        {tab !== 'users' && (
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'company' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sector</label>
              <input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. CleanTech, FinTech" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value as TenantStage)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GTM Model</label>
              <select value={gtmModel} onChange={(e) => setGtmModel(e.target.value as GTMModel)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {GTM_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {tab === 'values' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Define up to 5 company values that features will be scored against.</p>
            {values.length < 5 && (
              <button onClick={addValue} className="flex items-center gap-1.5 px-3 py-1.5 border border-brand-300 text-brand-700 rounded-lg text-sm hover:bg-brand-50 transition-colors">
                <Plus className="w-4 h-4" /> Add Value
              </button>
            )}
          </div>
          {values.map((v, i) => (
            <div key={v.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <input
                  value={v.name}
                  onChange={(e) => updateValue(v.id, 'name', e.target.value)}
                  placeholder="Value name (e.g. Carbon Neutral)"
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button onClick={() => removeValue(v.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                value={v.description}
                onChange={(e) => updateValue(v.id, 'description', e.target.value)}
                placeholder="Short description of what this value means for feature decisions"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ))}
          {values.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No company values yet. Click "Add Value" to get started.</p>
          )}
        </div>
      )}

      {tab === 'esg' && (
        <div className="space-y-5">
          <p className="text-sm text-slate-600">Set the relative weight of each ESG pillar when calculating the composite ESG score.</p>
          <div className={clsx('text-sm font-medium px-3 py-2 rounded-lg', Math.abs(esgSum - 100) < 0.5 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
            Total: {esgSum}% {Math.abs(esgSum - 100) < 0.5 ? '✓ Perfect' : '— must sum to 100%'}
          </div>
          <WeightSlider label="Environmental (E)" value={esgWeights.environmental} color="bg-emerald-500" onChange={(v) => setEsgWeights((w) => ({ ...w, environmental: v }))} />
          <WeightSlider label="Social (S)" value={esgWeights.social} color="bg-blue-500" onChange={(v) => setEsgWeights((w) => ({ ...w, social: v }))} />
          <WeightSlider label="Governance (G)" value={esgWeights.governance} color="bg-purple-500" onChange={(v) => setEsgWeights((w) => ({ ...w, governance: v }))} />
        </div>
      )}

      {tab === 'weights' && (
        <div className="space-y-5">
          <p className="text-sm text-slate-600">Set how much each scoring dimension contributes to the composite priority score.</p>
          <div className={clsx('text-sm font-medium px-3 py-2 rounded-lg', Math.abs(dimSum - 100) < 0.5 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
            Total: {dimSum}% {Math.abs(dimSum - 100) < 0.5 ? '✓ Perfect' : '— must sum to 100%'}
          </div>
          <WeightSlider label="Business Value" value={dimWeights.businessValue} color="bg-blue-500" onChange={(v) => setDimWeights((w) => ({ ...w, businessValue: v }))} />
          <WeightSlider label="ESG" value={dimWeights.esg} color="bg-emerald-500" onChange={(v) => setDimWeights((w) => ({ ...w, esg: v }))} />
          <WeightSlider label="Values Fit" value={dimWeights.valuesFit} color="bg-rose-500" onChange={(v) => setDimWeights((w) => ({ ...w, valuesFit: v }))} />
          <WeightSlider label="GTM Readiness" value={dimWeights.gtmReadiness} color="bg-amber-500" onChange={(v) => setDimWeights((w) => ({ ...w, gtmReadiness: v }))} />
          <WeightSlider label="Effort (inverted)" value={dimWeights.effort} color="bg-purple-500" onChange={(v) => setDimWeights((w) => ({ ...w, effort: v }))} />
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Team members with access to this workspace.</p>
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
              <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold', user.avatarColor)}>
                {user.avatarInitials}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <span className={clsx('px-2.5 py-1 rounded-full text-xs font-semibold', user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : user.role === 'PM' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600')}>
                {user.role}
              </span>
            </div>
          ))}
          <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center">
            <p className="text-xs text-slate-400">Invite functionality available in the full version</p>
          </div>
        </div>
      )}
    </div>
  );
}

function WeightSlider({ label, value, color, onChange }: { label: string; value: number; color: string; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-bold text-slate-900">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-600"
      />
      <div className="h-2 bg-slate-100 rounded-full">
        <div className={clsx('h-2 rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

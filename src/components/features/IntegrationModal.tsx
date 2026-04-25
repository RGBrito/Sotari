import { useState } from 'react';
import Modal from '../common/Modal';
import { useAppStore } from '../../store';
import { JIRA_MOCK_FEATURES, LINEAR_MOCK_FEATURES } from '../../data/mockData';
import { IntegrationFeature } from '../../types';
import clsx from 'clsx';
import { CheckCircle2, Circle, Loader2, ExternalLink } from 'lucide-react';

type Integration = 'jira' | 'linear';

interface Props {
  open: boolean;
  onClose: () => void;
  integration: Integration;
}

type Step = 'auth' | 'loading' | 'select';

export default function IntegrationModal({ open, onClose, integration }: Props) {
  const importFeatures = useAppStore((s) => s.importFeatures);
  const currentTenantId = useAppStore((s) => s.currentTenantId);

  const [step, setStep] = useState<Step>('auth');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const MOCK = integration === 'jira' ? JIRA_MOCK_FEATURES : LINEAR_MOCK_FEATURES;
  const label = integration === 'jira' ? 'Jira' : 'Linear';
  const color = integration === 'jira' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-violet-600 hover:bg-violet-700';

  function handleAuth() {
    setStep('loading');
    setTimeout(() => setStep('select'), 2000);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleImport() {
    const toImport: IntegrationFeature[] = MOCK.filter((f) => selected.has(f.id));
    importFeatures(
      toImport.map((f) => ({
        tenantId: currentTenantId,
        title: f.title,
        description: f.description,
        status: 'Backlog' as const,
        labels: f.labels,
        source: integration,
        sourceId: f.id,
        quarter: null,
      }))
    );
    setStep('auth');
    setSelected(new Set());
    onClose();
  }

  function handleClose() {
    setStep('auth');
    setSelected(new Set());
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Connect ${label}`}
      size="lg"
      footer={
        step === 'select' ? (
          <>
            <button onClick={handleClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selected.size === 0}
              className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Import {selected.size} feature{selected.size !== 1 ? 's' : ''}
            </button>
          </>
        ) : undefined
      }
    >
      {step === 'auth' && (
        <div className="space-y-6 py-4">
          <div className="text-center space-y-3">
            <div className={clsx('w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto', integration === 'jira' ? 'bg-blue-600' : 'bg-violet-600')}>
              {label[0]}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Connect your {label} workspace</h3>
              <p className="text-sm text-slate-500 mt-1">
                Authorise Sotari to import issues from {label} as features.
                This uses a secure OAuth 2.0 flow.
              </p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm text-slate-600">
            <p className="font-medium text-slate-700">Sotari will be able to:</p>
            <ul className="space-y-1">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> Read issue titles and descriptions</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> Read issue status and labels</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> One-time import (no ongoing sync)</li>
            </ul>
          </div>
          <button
            onClick={handleAuth}
            className={clsx('w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium text-sm transition-colors', color)}
          >
            <ExternalLink className="w-4 h-4" />
            Authorise with {label}
          </button>
          <p className="text-xs text-slate-400 text-center">
            Demo mode: clicking will simulate an OAuth flow and load mock features.
          </p>
        </div>
      )}

      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <div className="text-center">
            <p className="font-medium text-slate-700">Connecting to {label}…</p>
            <p className="text-sm text-slate-500 mt-1">Fetching your backlog</p>
          </div>
        </div>
      )}

      {step === 'select' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Select the features you want to import into Sotari.
          </p>
          {MOCK.map((feature) => (
            <div
              key={feature.id}
              onClick={() => toggleSelect(feature.id)}
              className={clsx(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                selected.has(feature.id)
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-slate-200 hover:bg-slate-50'
              )}
            >
              {selected.has(feature.id)
                ? <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                : <Circle className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
              }
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{feature.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{feature.description}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {feature.labels.map((l) => (
                    <span key={l} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">{l}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

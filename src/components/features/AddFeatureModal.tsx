import { useState } from 'react';
import Modal from '../common/Modal';
import { useAppStore } from '../../store';
import { FeatureStatus } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const STATUSES: FeatureStatus[] = ['Backlog', 'In Progress', 'In Review', 'Done'];

export default function AddFeatureModal({ open, onClose }: Props) {
  const addFeature = useAppStore((s) => s.addFeature);
  const currentTenantId = useAppStore((s) => s.currentTenantId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<FeatureStatus>('Backlog');
  const [labels, setLabels] = useState('');

  function handleSubmit() {
    if (!title.trim()) return;
    addFeature({
      tenantId: currentTenantId,
      title: title.trim(),
      description: description.trim(),
      status,
      labels: labels.split(',').map((l) => l.trim()).filter(Boolean),
      source: 'manual',
      quarter: null,
    });
    setTitle('');
    setDescription('');
    setStatus('Backlog');
    setLabels('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Feature"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Feature
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Dark mode support"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the feature and its expected impact…"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FeatureStatus)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Labels</label>
          <input
            type="text"
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            placeholder="e.g. ui, core, integrations (comma-separated)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    </Modal>
  );
}

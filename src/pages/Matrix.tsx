import { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { useAppStore } from '../store';
import { getQuadrant } from '../utils/scoring';
import clsx from 'clsx';

interface DotData {
  id: string;
  title: string;
  effort: number;
  composite: number;
  businessValue: number;
  quadrant: string;
  quadrantColor: string;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: DotData }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-xs max-w-52">
      <p className="font-semibold text-slate-800 mb-1">{d.title}</p>
      <div className="space-y-0.5 text-slate-600">
        <p>Composite: <strong>{d.composite.toFixed(1)}</strong></p>
        <p>Effort: <strong>{d.effort}</strong></p>
        <p>Business Value: <strong>{d.businessValue}</strong></p>
        <p className={clsx('font-semibold', d.quadrantColor)}>{d.quadrant}</p>
      </div>
    </div>
  );
};

const QUADRANT_COLORS: Record<string, string> = {
  'Quick Wins': '#10b981',
  'Major Projects': '#3b82f6',
  'Fill-ins': '#f59e0b',
  'Reconsider': '#ef4444',
};

export default function Matrix() {
  const features = useAppStore((s) => s.tenantFeatures());
  const tenant = useAppStore((s) => s.currentTenant());
  const [highlight, setHighlight] = useState<string | null>(null);

  const scored = features.filter((f) => f.scores);

  const data: DotData[] = scored.map((f) => {
    const q = getQuadrant(f.scores!.effort, f.scores!.compositeScore);
    return {
      id: f.id,
      title: f.title,
      effort: f.scores!.effort,
      composite: f.scores!.compositeScore,
      businessValue: f.scores!.businessValue,
      quadrant: q.label,
      quadrantColor: q.color,
    };
  });

  const quadrantCounts = {
    'Quick Wins': data.filter((d) => d.quadrant === 'Quick Wins').length,
    'Major Projects': data.filter((d) => d.quadrant === 'Major Projects').length,
    'Fill-ins': data.filter((d) => d.quadrant === 'Fill-ins').length,
    'Reconsider': data.filter((d) => d.quadrant === 'Reconsider').length,
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Priority Matrix</h1>
        <p className="text-sm text-slate-500 mt-0.5">Composite Score vs Effort · bubble size = Business Value</p>
      </div>

      {/* Quadrant legend */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(quadrantCounts).map(([label, count]) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{label}</span>
              <span className="text-lg font-bold text-slate-800">{count}</span>
            </div>
            <div className="h-1 rounded-full mt-2" style={{ backgroundColor: QUADRANT_COLORS[label] }} />
          </div>
        ))}
      </div>

      {scored.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
          <p className="text-lg font-medium">No scored features yet</p>
          <p className="text-sm mt-1">Go to Features and score at least one feature to see the matrix.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          {/* Quadrant labels */}
          <div className="relative">
            <div className="absolute inset-0 pointer-events-none grid grid-cols-2">
              <div className="flex items-start justify-start p-4">
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">← Quick Wins</span>
              </div>
              <div className="flex items-start justify-end p-4">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">Major Projects →</span>
              </div>
              <div className="flex items-end justify-start p-4">
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">← Fill-ins</span>
              </div>
              <div className="flex items-end justify-end p-4">
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">Reconsider →</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={480}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="effort"
                  domain={[0, 10]}
                  label={{ value: 'Effort →', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#94a3b8' }}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis
                  type="number"
                  dataKey="composite"
                  domain={[0, 10]}
                  label={{ value: '↑ Composite Score', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#94a3b8' }}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <ReferenceLine x={5} stroke="#cbd5e1" strokeDasharray="6 3" />
                <ReferenceLine y={5} stroke="#cbd5e1" strokeDasharray="6 3" />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={data}>
                  {data.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={QUADRANT_COLORS[entry.quadrant]}
                      fillOpacity={highlight ? (highlight === entry.id ? 1 : 0.3) : 0.8}
                      stroke={highlight === entry.id ? '#1e293b' : 'white'}
                      strokeWidth={highlight === entry.id ? 2 : 1}
                      r={Math.max(6, entry.businessValue * 2.5)}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Feature list */}
          <div className="mt-4 border-t border-slate-100 pt-4 grid grid-cols-2 gap-2">
            {data.map((d) => (
              <div
                key={d.id}
                onMouseEnter={() => setHighlight(d.id)}
                onMouseLeave={() => setHighlight(null)}
                className={clsx('flex items-center gap-2 p-2 rounded-lg cursor-default transition-colors', highlight === d.id ? 'bg-slate-100' : 'hover:bg-slate-50')}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: QUADRANT_COLORS[d.quadrant] }} />
                <span className="text-xs text-slate-700 truncate flex-1">{d.title}</span>
                <span className="text-xs font-semibold text-slate-500 flex-shrink-0">{d.composite.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

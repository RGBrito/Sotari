import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Layers, ScatterChart, ListOrdered, CalendarDays, Settings, Leaf } from 'lucide-react';
import { useAppStore } from '../../store';
import clsx from 'clsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/features', label: 'Features', icon: Layers },
  { to: '/matrix', label: 'Priority Matrix', icon: ScatterChart },
  { to: '/ranked', label: 'Ranked List', icon: ListOrdered },
  { to: '/roadmap', label: 'Roadmap', icon: CalendarDays },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const tenant = useAppStore((s) => s.currentTenant());
  const role = useAppStore((s) => s.demoRole);

  const visibleNav = NAV.filter((n) => {
    if (n.to === '/settings' && role === 'Viewer') return false;
    return true;
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Sotari</span>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-10">Smart Roadmap Prioritization</p>
      </div>

      {/* Tenant info */}
      <div className="px-4 py-3 mx-3 mt-4 rounded-lg bg-slate-800/60 border border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-brand-600/80 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {tenant.logo}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{tenant.name}</p>
            <p className="text-xs text-slate-400">{tenant.sector} · {tenant.stage}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600/30 text-brand-300 border border-brand-600/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 text-center">© 2025 Sotari · v0.1.0</p>
      </div>
    </aside>
  );
}

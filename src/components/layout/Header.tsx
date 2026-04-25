import { ChevronDown, Building2, UserCog } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store';
import { UserRole } from '../../types';
import clsx from 'clsx';

const ROLES: UserRole[] = ['Admin', 'PM', 'Viewer'];
const ROLE_COLORS: Record<UserRole, string> = {
  Admin: 'bg-purple-100 text-purple-800 border-purple-200',
  PM: 'bg-blue-100 text-blue-800 border-blue-200',
  Viewer: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function Header() {
  const tenants = useAppStore((s) => s.tenants);
  const currentTenant = useAppStore((s) => s.currentTenant());
  const currentUser = useAppStore((s) => s.currentUser());
  const role = useAppStore((s) => s.demoRole);
  const setCurrentTenant = useAppStore((s) => s.setCurrentTenant);
  const setDemoRole = useAppStore((s) => s.setDemoRole);

  const [tenantOpen, setTenantOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const tenantRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (tenantRef.current && !tenantRef.current.contains(e.target as Node)) setTenantOpen(false);
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 flex-shrink-0">
      {/* Tenant switcher */}
      <div className="relative" ref={tenantRef}>
        <button
          onClick={() => { setTenantOpen((o) => !o); setRoleOpen(false); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
        >
          <Building2 className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-slate-700">{currentTenant.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
        {tenantOpen && (
          <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-48 z-50">
            <p className="px-3 py-1.5 text-xs text-slate-400 font-medium uppercase tracking-wider">Switch Tenant</p>
            {tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => { setCurrentTenant(t.id); setTenantOpen(false); }}
                className={clsx(
                  'w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-slate-50 transition-colors',
                  t.id === currentTenant.id ? 'text-brand-600 font-medium' : 'text-slate-700'
                )}
              >
                <div className="w-6 h-6 rounded bg-brand-600/20 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {t.logo}
                </div>
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.sector} · {t.stage}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Role switcher (demo) */}
      <div className="relative" ref={roleRef}>
        <button
          onClick={() => { setRoleOpen((o) => !o); setTenantOpen(false); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
          title="Demo: switch role"
        >
          <UserCog className="w-4 h-4 text-slate-500" />
          <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold border', ROLE_COLORS[role])}>
            {role}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
        {roleOpen && (
          <div className="absolute top-full mt-1 right-0 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-40 z-50">
            <p className="px-3 py-1.5 text-xs text-slate-400 font-medium uppercase tracking-wider">Demo Role</p>
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => { setDemoRole(r); setRoleOpen(false); }}
                className={clsx(
                  'w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors',
                  r === role ? 'text-brand-600 font-medium' : 'text-slate-700'
                )}
              >
                <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium border', ROLE_COLORS[r])}>{r}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User avatar */}
      <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold', currentUser.avatarColor)}>
        {currentUser.avatarInitials}
      </div>
    </header>
  );
}

import { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { UserRole } from '../../types';
import { useAppStore } from '../../store';

interface PermissionGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGuard({ allowedRoles, children, fallback }: PermissionGuardProps) {
  const role = useAppStore((s) => s.demoRole);
  if (allowedRoles.includes(role)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
      <Lock className="w-3.5 h-3.5" />
      <span>Requires {allowedRoles.join(' or ')} role</span>
    </div>
  );
}

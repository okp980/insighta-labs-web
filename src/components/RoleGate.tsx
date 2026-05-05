import type { ReactNode } from 'react';
import { useAuth, hasRole } from '@/hooks/useAuth';
import type { Role } from '@/types/api';

interface RoleGateProps {
  roles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { data: user } = useAuth();
  if (!hasRole(user, ...roles)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

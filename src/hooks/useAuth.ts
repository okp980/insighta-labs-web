import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@/lib/api';
import { fetchMe } from '@/lib/auth';
import type { CurrentUser, Role } from '@/types/api';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const query = useQuery<CurrentUser, ApiError>({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    function handleExpired() {
      queryClient.removeQueries({ queryKey: ['auth', 'me'] });
      navigate('/login', { replace: true });
    }
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [queryClient, navigate]);

  return query;
}

export function hasRole(user: CurrentUser | null | undefined, ...roles: Role[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

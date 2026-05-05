import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { fetchMe } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import type { CurrentUser } from '@/types/api';

export default function AuthCallback() {
  const navigate = useNavigate();

  const { data: user, isLoading, isError } = useQuery<CurrentUser, ApiError>({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    retry: false,
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (isError) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-full grid place-items-center text-muted-foreground">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {isLoading ? 'Signing you in…' : 'Redirecting…'}
      </div>
    </div>
  );
}

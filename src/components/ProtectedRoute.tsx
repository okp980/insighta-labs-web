import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProtectedRoute() {
  const { data: user, isLoading, isError } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-full p-8 max-w-md mx-auto space-y-3">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { Navigate } from 'react-router-dom';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55 0-.27-.01-1.18-.02-2.13-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.94 10.94 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.13 0 1.54-.01 2.79-.01 3.17 0 .31.21.66.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z"
      />
    </svg>
  );
}
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetchMe, startGitHubLogin } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import type { CurrentUser } from '@/types/api';

export default function Login() {
  const { data: user, isLoading } = useQuery<CurrentUser, ApiError>({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    retry: false,
    staleTime: 30_000,
  });

  if (isLoading) {
    return <div className="min-h-full grid place-items-center text-muted-foreground">Loading…</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-full grid place-items-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto size-10 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">
            IL
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to Insighta Labs</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your GitHub account to access the analytics workspace.
          </p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Button onClick={startGitHubLogin} className="w-full" size="lg">
              <GithubIcon className="size-4" />
              Continue with GitHub
            </Button>
            <ul className="text-xs text-muted-foreground space-y-2 pt-2">
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                Tokens stored in HttpOnly cookies, never readable from JavaScript.
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-emerald-500" />
                Backed by the same APIs that power the CLI.
              </li>
            </ul>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          By signing in you agree to GitHub's terms of service.
        </p>
      </div>
    </div>
  );
}

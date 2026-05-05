import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/lib/auth';

export default function Account() {
  const { data: user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });

  if (isLoading || !user) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">
          Your GitHub identity used to sign in.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {user.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt={user.username} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-xl">{user.username}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Mail className="size-3.5" />
                {user.email}
              </CardDescription>
            </div>
            <Badge
              variant={user.role === 'admin' ? 'default' : 'secondary'}
              className="ml-auto capitalize"
            >
              <ShieldCheck className="size-3" />
              {user.role}
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-4 md:grid-cols-2 pt-6 text-sm">
          <Field label="GitHub ID">{user.github_id}</Field>
          <Field label="Status">
            <Badge variant={user.is_active ? 'success' : 'destructive'}>
              {user.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </Field>
          <Field label="Internal ID" mono>
            {user.id}
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sign out</CardTitle>
          <CardDescription>
            Revokes the current refresh token and clears your session cookies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="size-4" />
            {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className={mono ? 'font-mono text-xs break-all' : ''}>{children}</div>
    </div>
  );
}

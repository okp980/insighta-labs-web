import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import RoleGate from '@/components/RoleGate';
import { deleteProfile, fetchProfile } from '@/lib/profiles';

export default function ProfileDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const query = useQuery({
    queryKey: ['profiles', 'detail', id],
    queryFn: () => fetchProfile(id),
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      navigate('/profiles', { replace: true });
    },
  });

  if (query.isLoading) {
    return <DetailSkeleton />;
  }

  if (query.isError || !query.data) {
    const message =
      (query.error as ApiError | undefined)?.message ?? 'Profile not found.';
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild className="px-0">
          <Link to="/profiles">
            <ArrowLeft className="size-4" />
            Back to profiles
          </Link>
        </Button>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {message}
          </CardContent>
        </Card>
      </div>
    );
  }

  const profile = query.data;
  const genderPct = Math.round((profile.gender_probability ?? 0) * 100);
  const countryPct = Math.round((profile.country_probability ?? 0) * 100);

  return (
    <div className="space-y-4">
      <Button variant="ghost" asChild className="px-0">
        <Link to="/profiles">
          <ArrowLeft className="size-4" />
          Back to profiles
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardDescription className="font-mono text-xs">
              {profile.id}
            </CardDescription>
            <CardTitle className="text-3xl">{profile.name}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge
                variant={profile.gender === 'male' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {profile.gender}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {profile.age_group} ({profile.age})
              </Badge>
              <Badge variant="outline">
                {profile.country_id} · {profile.country_name}
              </Badge>
            </div>
          </div>
          <RoleGate roles={['admin']}>
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </RoleGate>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-6 md:grid-cols-2 pt-6">
          <Field label="Gender confidence">
            <Progress value={genderPct} />
            <span className="mt-1 inline-block text-xs text-muted-foreground">
              {genderPct}%
            </span>
          </Field>
          <Field label="Country confidence">
            <Progress value={countryPct} />
            <span className="mt-1 inline-block text-xs text-muted-foreground">
              {countryPct}%
            </span>
          </Field>
          <Field label="Age">{profile.age}</Field>
          <Field label="Age group" capitalize>
            {profile.age_group}
          </Field>
          <Field label="Country">
            <span className="font-mono mr-2 text-xs text-muted-foreground">
              {profile.country_id}
            </span>
            {profile.country_name}
          </Field>
          <Field label="Created">
            {new Date(profile.created_at).toLocaleString()}
          </Field>
        </CardContent>
      </Card>

      <Dialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!deleteMutation.isPending) setConfirmOpen(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this profile?</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{profile.name}</strong> from
              the workspace. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteMutation.error ? (
            <p className="text-sm text-destructive">
              {(deleteMutation.error as ApiError).message ?? 'Failed to delete.'}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
  capitalize,
}: {
  label: string;
  children: React.ReactNode;
  capitalize?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className={'text-sm ' + (capitalize ? 'capitalize' : '')}>{children}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Card>
        <CardHeader className="space-y-3">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-7 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

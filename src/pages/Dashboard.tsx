import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Globe2, RefreshCcw, UserRound, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { fetchProfiles } from '@/lib/profiles';
import type { ProfilesPage } from '@/types/api';

const POLL_INTERVAL_MS = 15_000;
const SAMPLE_LIMIT = 50;

interface BreakdownDatum {
  label: string;
  value: number;
}

function makeBreakdown<T extends string>(profiles: ProfilesPage['data'], key: keyof ProfilesPage['data'][number]): BreakdownDatum[] {
  const counts = new Map<T, number>();
  for (const profile of profiles) {
    const value = profile[key] as T;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label: String(label), value }))
    .sort((a, b) => b.value - a.value);
}

export default function Dashboard() {
  const totalQuery = useQuery({
    queryKey: ['profiles', 'total'],
    queryFn: () => fetchProfiles({ page: 1, limit: 1 }),
    refetchInterval: POLL_INTERVAL_MS,
  });

  const sampleQuery = useQuery({
    queryKey: ['profiles', 'sample', SAMPLE_LIMIT],
    queryFn: () =>
      fetchProfiles({ page: 1, limit: SAMPLE_LIMIT, sort_by: 'created_at', order: 'desc' }),
    refetchInterval: POLL_INTERVAL_MS,
  });

  const total = totalQuery.data?.total ?? 0;
  const sample = useMemo(
    () => sampleQuery.data?.data ?? [],
    [sampleQuery.data],
  );

  const genderBreakdown = useMemo(
    () => makeBreakdown(sample, 'gender'),
    [sample],
  );
  const ageGroupBreakdown = useMemo(
    () => makeBreakdown(sample, 'age_group'),
    [sample],
  );
  const countryBreakdown = useMemo(
    () => makeBreakdown(sample, 'country_name').slice(0, 6),
    [sample],
  );

  const isLoading = totalQuery.isLoading || sampleQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live snapshot of the profiles in your workspace.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <RefreshCcw
            className={
              'size-3 ' +
              (totalQuery.isFetching || sampleQuery.isFetching ? 'animate-spin' : '')
            }
          />
          auto-refresh 15s
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          icon={<Users className="size-4" />}
          label="Total profiles"
          value={isLoading ? null : total.toLocaleString()}
        />
        <KpiCard
          icon={<UserRound className="size-4" />}
          label="In current sample"
          value={isLoading ? null : sample.length.toLocaleString()}
          hint={`Latest ${SAMPLE_LIMIT} profiles`}
        />
        <KpiCard
          icon={<Globe2 className="size-4" />}
          label="Distinct countries (sample)"
          value={isLoading ? null : countryBreakdown.length.toString()}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By gender</CardTitle>
            <CardDescription>Sample of latest {SAMPLE_LIMIT} profiles.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownChart data={genderBreakdown} loading={isLoading} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By age group</CardTitle>
            <CardDescription>Sample of latest {SAMPLE_LIMIT} profiles.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownChart data={ageGroupBreakdown} loading={isLoading} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top countries</CardTitle>
          <CardDescription>By volume in the latest sample.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : countryBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="grid gap-2 md:grid-cols-2">
              {countryBreakdown.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm"
                >
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground">{row.value}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {value === null ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-3xl font-bold tracking-tight">{value}</div>
        )}
        {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function BreakdownChart({ data, loading }: { data: BreakdownDatum[]; loading: boolean }) {
  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data in sample.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
        <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.03)' }}
          contentStyle={{
            backgroundColor: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

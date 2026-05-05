import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Pagination from '@/components/Pagination';
import RoleGate from '@/components/RoleGate';
import CreateProfileDialog from '@/components/CreateProfileDialog';
import { fetchProfiles } from '@/lib/profiles';
import type { ProfileFilters } from '@/types/api';

const PAGE_LIMIT = 20;
const ANY_VALUE = '__any__';

function readFilters(params: URLSearchParams): ProfileFilters {
  const get = (key: string) => params.get(key) ?? undefined;
  const num = (key: string) => {
    const v = params.get(key);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    page: num('page') ?? 1,
    limit: num('limit') ?? PAGE_LIMIT,
    gender: (get('gender') as ProfileFilters['gender']) ?? undefined,
    age_group: (get('age_group') as ProfileFilters['age_group']) ?? undefined,
    country_id: get('country_id'),
    min_age: num('min_age'),
    max_age: num('max_age'),
    sort_by: (get('sort_by') as ProfileFilters['sort_by']) ?? 'created_at',
    order: (get('order') as ProfileFilters['order']) ?? 'desc',
  };
}

export default function ProfilesList() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);

  const query = useQuery({
    queryKey: ['profiles', 'list', filters],
    queryFn: () => fetchProfiles(filters),
  });

  function updateParams(patch: Record<string, string | number | undefined | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  }

  function setPage(page: number) {
    const next = new URLSearchParams(params);
    next.set('page', String(page));
    setParams(next, { replace: false });
  }

  const profiles = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = query.data?.total_pages ?? 0;
  const page = filters.page ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profiles</h1>
          <p className="text-sm text-muted-foreground">
            {query.isLoading
              ? 'Loading…'
              : `${total.toLocaleString()} total profiles`}
          </p>
        </div>
        <RoleGate roles={['admin']}>
          <CreateProfileDialog />
        </RoleGate>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="size-4 text-muted-foreground" />
          Filters
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <FilterField label="Gender">
            <Select
              value={filters.gender ?? ANY_VALUE}
              onValueChange={(v) =>
                updateParams({ gender: v === ANY_VALUE ? undefined : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_VALUE}>Any</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Age group">
            <Select
              value={filters.age_group ?? ANY_VALUE}
              onValueChange={(v) =>
                updateParams({ age_group: v === ANY_VALUE ? undefined : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_VALUE}>Any</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="teenager">Teenager</SelectItem>
                <SelectItem value="adult">Adult</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Country (ISO code)">
            <Input
              placeholder="e.g. NG"
              defaultValue={filters.country_id ?? ''}
              onBlur={(e) =>
                updateParams({
                  country_id: e.target.value.trim().toUpperCase() || undefined,
                })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
          </FilterField>
          <FilterField label="Min age">
            <Input
              type="number"
              min={0}
              defaultValue={filters.min_age ?? ''}
              onBlur={(e) =>
                updateParams({ min_age: e.target.value || undefined })
              }
            />
          </FilterField>
          <FilterField label="Max age">
            <Input
              type="number"
              min={0}
              defaultValue={filters.max_age ?? ''}
              onBlur={(e) =>
                updateParams({ max_age: e.target.value || undefined })
              }
            />
          </FilterField>
          <FilterField label="Sort by">
            <Select
              value={`${filters.sort_by ?? 'created_at'}:${filters.order ?? 'desc'}`}
              onValueChange={(v) => {
                const [sort_by, order] = v.split(':');
                updateParams({ sort_by, order });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at:desc">Newest first</SelectItem>
                <SelectItem value="created_at:asc">Oldest first</SelectItem>
                <SelectItem value="age:asc">Age ascending</SelectItem>
                <SelectItem value="age:desc">Age descending</SelectItem>
                <SelectItem value="gender_probability:desc">Gender confidence</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setParams(new URLSearchParams(), { replace: true })}
          >
            Reset filters
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Age group</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="text-right">
                <span className="inline-flex items-center gap-1">
                  Created
                  <ArrowUpDown className="size-3" />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : profiles.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                      No profiles match these filters.
                    </TableCell>
                  </TableRow>
                )
                : profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <Link
                          to={`/profiles/${profile.id}`}
                          className="font-medium hover:underline"
                        >
                          {profile.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={profile.gender === 'male' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {profile.gender}
                        </Badge>
                      </TableCell>
                      <TableCell>{profile.age}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {profile.age_group}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground mr-2">
                          {profile.country_id}
                        </span>
                        {profile.country_name}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
          </TableBody>
        </Table>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </Card>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

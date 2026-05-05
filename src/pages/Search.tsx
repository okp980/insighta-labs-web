import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { ApiError } from '@/lib/api';
import { searchProfiles } from '@/lib/profiles';

const PAGE_LIMIT = 20;

const examples = [
  'female adults',
  'males above 30',
  'young women from nigeria',
  'seniors below 80',
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? '1') || 1;

  const [draft, setDraft] = useState(q);

  const query = useQuery({
    queryKey: ['profiles', 'search', q, page],
    queryFn: () => searchProfiles({ q, page, limit: PAGE_LIMIT }),
    enabled: q.trim().length > 0,
    retry: false,
  });

  function commit(value: string) {
    const next = new URLSearchParams();
    if (value.trim()) next.set('q', value.trim());
    setParams(next, { replace: false });
  }

  function setPage(nextPage: number) {
    const next = new URLSearchParams(params);
    next.set('page', String(nextPage));
    setParams(next, { replace: false });
  }

  const total = query.data?.total ?? 0;
  const profiles = query.data?.data ?? [];
  const totalPages = query.data?.total_pages ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">
          Ask in natural language: gender, age, age group, country.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              commit(draft);
            }}
          >
            <SearchIcon className="size-4 text-muted-foreground" />
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. female adults from Nigeria"
              className="border-0 shadow-none focus-visible:ring-0"
            />
            <Button type="submit" disabled={!draft.trim()}>
              Search
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" />
            <span>Try:</span>
            {examples.map((example) => (
              <button
                key={example}
                onClick={() => {
                  setDraft(example);
                  commit(example);
                }}
                className="rounded-full border bg-muted/40 px-2 py-0.5 hover:bg-accent"
              >
                {example}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {q.trim() === '' ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Enter a query to start searching.
          </CardContent>
        </Card>
      ) : query.isError ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {(query.error as ApiError).message}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="px-4 py-2 text-sm text-muted-foreground border-b">
            {query.isLoading
              ? 'Searching…'
              : `${total.toLocaleString()} result${total === 1 ? '' : 's'} for "${q}"`}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Country</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : profiles.length === 0
                  ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-sm text-muted-foreground py-12"
                      >
                        No matches.
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
                            variant={
                              profile.gender === 'male' ? 'default' : 'secondary'
                            }
                            className="capitalize"
                          >
                            {profile.gender}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {profile.age}{' '}
                          <span className="text-muted-foreground capitalize text-xs">
                            ({profile.age_group})
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground mr-2">
                            {profile.country_id}
                          </span>
                          {profile.country_name}
                        </TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          )}
        </Card>
      )}
    </div>
  );
}

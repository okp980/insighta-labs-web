import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const safeTotal = Math.max(totalPages, 1);
  return (
    <div className="flex items-center justify-between gap-4 border-t bg-card px-3 py-2 text-sm">
      <p className="text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of{' '}
        <span className="font-medium text-foreground">{safeTotal}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.min(safeTotal, page + 1))}
          disabled={page >= safeTotal}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

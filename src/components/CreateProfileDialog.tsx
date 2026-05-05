import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';
import { createProfile } from '@/lib/profiles';

export default function CreateProfileDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const mutation = useMutation({
    mutationFn: (value: string) => createProfile(value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setOpen(false);
      setName('');
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!mutation.isPending) setOpen(next);
      }}
    >
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New profile
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a profile</DialogTitle>
          <DialogDescription>
            Enter a first name. We will enrich it with gender, age and country
            estimates from the upstream services.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || mutation.isPending) return;
            mutation.mutate(name.trim());
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada"
              autoFocus
              disabled={mutation.isPending}
            />
          </div>
          {mutation.error ? (
            <p className="text-sm text-destructive">
              {(mutation.error as ApiError).message ?? 'Failed to create profile.'}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create profile'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

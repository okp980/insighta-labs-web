import { api } from './api';
import type { CurrentUser, CurrentUserResponse } from '@/types/api';

export async function fetchMe(): Promise<CurrentUser> {
  const res = await api.get<CurrentUserResponse>('/auth/me');
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post<{ message: string }>('/auth/logout');
}

export function startGitHubLogin(): void {
  window.location.href = '/auth/github/login';
}

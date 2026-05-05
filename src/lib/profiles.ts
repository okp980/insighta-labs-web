import { api } from './api';
import type {
  Profile,
  ProfileFilters,
  ProfileResponse,
  ProfilesPage,
} from '@/types/api';

export function fetchProfiles(filters: ProfileFilters): Promise<ProfilesPage> {
  return api.get<ProfilesPage>('/api/profiles/', {
    query: { ...filters } as Record<string, string | number | undefined>,
  });
}

export function searchProfiles(params: {
  q: string;
  page?: number;
  limit?: number;
}): Promise<ProfilesPage> {
  return api.get<ProfilesPage>('/api/profiles/search', { query: params });
}

export async function fetchProfile(id: string): Promise<Profile> {
  const res = await api.get<ProfileResponse>(`/api/profiles/${id}`);
  return res.data;
}

export function deleteProfile(id: string): Promise<void> {
  return api.delete<void>(`/api/profiles/${id}`);
}

export async function createProfile(name: string): Promise<Profile> {
  const res = await api.post<ProfileResponse>('/api/profiles/', {
    body: { name },
  });
  return res.data;
}

export type Gender = 'male' | 'female';

export type AgeGroup = 'child' | 'teenager' | 'adult' | 'senior';

export type Role = 'admin' | 'analyst';

export interface PaginationLinks {
  self: string;
  next: string | null;
  prev: string | null;
}

export interface Profile {
  id: string;
  name: string;
  gender: Gender;
  gender_probability: number;
  age: number;
  age_group: AgeGroup;
  country_id: string;
  country_name: string;
  country_probability: number;
  created_at: string;
}

export interface ProfilesPage {
  status: 'success' | 'error';
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  links: PaginationLinks;
  data: Profile[];
}

export interface ProfileResponse {
  status: 'success' | 'error';
  data: Profile;
  message?: string;
}

export interface CurrentUser {
  id: string;
  github_id: number;
  username: string;
  email: string;
  avatar_url: string;
  role: Role;
  is_active: boolean;
}

export interface CurrentUserResponse {
  status: 'success' | 'error';
  data: CurrentUser;
}

export interface ApiError {
  status: 'error';
  message: string;
}

export interface ProfileFilters {
  page?: number;
  limit?: number;
  gender?: Gender;
  age_group?: AgeGroup;
  country_id?: string;
  min_age?: number;
  max_age?: number;
  min_gender_probability?: number;
  min_country_probability?: number;
  order?: 'asc' | 'desc';
  sort_by?: 'age' | 'created_at' | 'gender_probability';
}

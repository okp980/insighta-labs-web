import axios from 'axios';

const API_VERSION = (import.meta.env.VITE_API_VERSION as string | undefined) ?? '1';

const sharedConfig: Parameters<typeof axios.create>[0] = {
  baseURL: '',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-API-Version': API_VERSION,
  },
};

/** Main client — interceptors are registered in `api.ts`. */
export const http = axios.create(sharedConfig);

/** Same defaults, no interceptors — used for `/auth/refresh` to avoid retry loops. */
export const refreshHttp = axios.create(sharedConfig);

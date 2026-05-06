import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { AxiosHeaders } from 'axios';
import { CSRF_HEADER_NAME, ensureCsrfToken, readCsrfToken } from './csrf';
import { http, refreshHttp } from './http';

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const csrf = (await ensureCsrfToken()) ?? '';
        const res = await refreshHttp.post('/auth/refresh', undefined, {
          headers: {
            [CSRF_HEADER_NAME]: csrf,
          },
        });
        return res.status >= 200 && res.status < 300;
      } catch {
        return false;
      } finally {
        setTimeout(() => {
          refreshInFlight = null;
        }, 0);
      }
    })();
  }
  return refreshInFlight;
}

function dispatchAuthExpired() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('auth:expired'));
}

function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0;
  const data = error.response?.data;
  const message =
    data && typeof data === 'object' && data !== null && 'message' in data
      ? String((data as { message?: unknown }).message ?? '')
      : error.message || 'Request failed';
  return new ApiError(status || 500, message || 'Request failed', data);
}

function isRefreshRequest(config: InternalAxiosRequestConfig | undefined): boolean {
  const u = config?.url ?? '';
  return u.includes('/auth/refresh');
}

http.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase() ?? 'GET';
  if (UNSAFE_METHODS.has(method)) {
    const csrf = readCsrfToken() ?? (await ensureCsrfToken());
    if (csrf) {
      const next = AxiosHeaders.from(config.headers);
      next.set(CSRF_HEADER_NAME, csrf);
      config.headers = next;
    }
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshRequest(originalRequest)
    ) {
      originalRequest._retry = true;
      const refreshed = await tryRefresh();
      if (refreshed) {
        return http.request(originalRequest);
      }
      dispatchAuthExpired();
    }

    return Promise.reject(toApiError(error));
  },
);

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { query, body, headers: extraHeaders, method = 'GET' } = options;
  const upper = method.toUpperCase();

  const headers = AxiosHeaders.from(extraHeaders ?? {});

  const data: unknown = body;
  if (data !== undefined && data !== null) {
    if (!(data instanceof FormData) && !(data instanceof Blob)) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }
  }

  const config: AxiosRequestConfig = {
    url: buildUrl(path, query),
    method: upper,
    headers,
    data:
      data === undefined || data === null
        ? undefined
        : data instanceof FormData || data instanceof Blob
          ? data
          : data,
  };

  const response = await http.request<T>(config);

  if (response.status === 204) {
    return undefined as T;
  }

  return response.data as T;
}

export const api = {
  get: <T,>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T,>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST' }),
  delete: <T,>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

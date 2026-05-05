import { CSRF_HEADER_NAME, ensureCsrfToken, readCsrfToken } from './csrf';

const API_VERSION = (import.meta.env.VITE_API_VERSION as string | undefined) ?? '1';

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

export interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Internal: prevents an infinite refresh loop. */
  _retried?: boolean;
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
        const res = await fetch('/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'X-API-Version': API_VERSION,
            [CSRF_HEADER_NAME]: csrf,
          },
        });
        return res.ok;
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

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { query, body, headers: extraHeaders, _retried, ...rest } = options;

  const method = (rest.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-API-Version': API_VERSION,
    ...(extraHeaders ?? {}),
  };

  let serializedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData || body instanceof Blob) {
      serializedBody = body;
    } else {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
      serializedBody = JSON.stringify(body);
    }
  }

  if (UNSAFE_METHODS.has(method)) {
    const csrf = readCsrfToken() ?? (await ensureCsrfToken());
    if (csrf) headers[CSRF_HEADER_NAME] = csrf;
  }

  const url = buildUrl(path, query);
  const response = await fetch(url, {
    ...rest,
    method,
    credentials: 'include',
    headers,
    body: serializedBody,
  });

  if (response.status === 401 && !_retried && !path.startsWith('/auth/refresh')) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...options, _retried: true });
    }
    dispatchAuthExpired();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload: unknown = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const message =
      (isJson && payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message ?? '')
        : '') || `${response.status} ${response.statusText}`;
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

export const api = {
  get: <T,>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T,>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST' }),
  delete: <T,>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

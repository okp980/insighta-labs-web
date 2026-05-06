import { http } from './http';

export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Reads the CSRF token from the non-HttpOnly cookie set by the backend.
 * Returns null when the cookie has not been issued yet (first-ever request).
 */
export function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]+)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Issue a no-op GET so the backend can attach the csrf_token cookie if missing.
 * Useful before the very first mutation made from a fresh browser session.
 */
export async function ensureCsrfToken(): Promise<string | null> {
  let token = readCsrfToken();
  if (token) return token;
  try {
    await http.get('/');
  } catch {
    // Network failures fall through; the next request will surface the error.
  }
  token = readCsrfToken();
  return token;
}

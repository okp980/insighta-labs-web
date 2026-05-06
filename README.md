# Insighta Labs Web

Web portal for the Insighta Labs API. Built with **Vite + React + TypeScript + Tailwind v4 + shadcn/ui**.

## Pages

- `/login` – Sign in with GitHub OAuth
- `/auth/callback` – Backend redirects here after OAuth and the SPA loads `/auth/me`
- `/dashboard` – Live KPI cards and breakdowns (auto-refreshed every 15 s)
- `/profiles` – Filterable, paginated profiles table; admin-only "New profile"
- `/profiles/:id` – Profile detail with confidence bars; admin-only delete
- `/search` – Natural-language search powered by `GET /api/profiles/search`
- `/account` – Current user info and sign out

## Authentication

- **HTTP-only cookies** for `access_token` and `refresh_token`. Never read from JavaScript.
- **CSRF double-submit** — backend issues a non-HttpOnly `csrf_token` cookie. The API client echoes it back via the `X-CSRF-Token` header on every state-changing request.
- **Silent refresh** — on a 401 the client calls `/auth/refresh` once and replays the request. If refresh fails it dispatches an `auth:expired` event and the router redirects to `/login`.
- **Axios** — shared instance in [`src/lib/http.ts`](src/lib/http.ts); CSRF + 401 handling and `ApiError` in [`src/lib/api.ts`](src/lib/api.ts). TanStack Query still uses `auth.ts` / `profiles.ts` helpers.

## Local development

You need the FastAPI backend running on `http://localhost:8000`.

```bash
cp .env.example .env
npm install
npm run dev
```

Vite dev server runs on `http://localhost:5173` and proxies `/api` and `/auth` to the backend, so the browser sees a single origin and the cookies stay first-party.

## CI

Pull requests to `main` run **Lint** (`eslint`), **Tests** (`vitest run`), and **Build** (`tsc` + `vite build`) via [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

Locally: `npm run lint`, `npm test`, `npm run build`.

## Project layout

```
src/
  components/
    ui/          # shadcn/ui primitives (Button, Card, Dialog, ...)
    Layout.tsx
    ProtectedRoute.tsx
    RoleGate.tsx
    Pagination.tsx
    CreateProfileDialog.tsx
  hooks/
    useAuth.ts
  lib/
    http.ts       # axios instances (main + refresh, no circular import with csrf)
    api.ts        # interceptors, request(), api.get/post/delete, ApiError
    auth.ts      # /auth/me, /auth/logout, GitHub login redirect
    csrf.ts      # read csrf_token cookie
    profiles.ts  # /api/profiles/* helpers
  pages/         # one file per route
  types/api.ts   # shared types matching the backend OpenAPI
```

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_VERSION` | `1` | Sent as `X-API-Version` on every API request. |
| `VITE_API_PROXY_TARGET` | `http://localhost:8000` | Backend upstream for the dev proxy. |

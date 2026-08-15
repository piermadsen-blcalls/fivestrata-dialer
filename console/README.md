# AICC Console (W8)

Next.js control panel for the AI call center. Scope, phases, and decisions:
`../docs/architecture/control-panel-scope.md` (Vercel build, no look-only tier —
Sean 2026-08-14).

## Local dev

```
cd console
npm install
npm run dev        # http://localhost:3000  (use localhost, NOT 127.0.0.1)
```

Port 3000 + the `localhost` hostname are load-bearing: neither Sean's dashboard role nor
the Management API (403) can edit the shared project's Auth redirect allowlist, so magic
links ride the `site_url` fallback (`http://localhost:3000`) and the middleware hands the
`?code=` at the root to `/auth/confirm`. Collision note: the engine's Fastify dev server
also uses 3000 — don't run both at once. Proper allowlisting (incl. the Vercel URL) is a
Pier ask (C7 in the scope doc).

Create `console/.env.local` (gitignored; Sean pastes values — never committed):

```
SUPABASE_URL=            # same project as the engine (wcftuethlcgeasopayed)
SUPABASE_SERVICE_ROLE_KEY=
```

The service key is server-only (`lib/supabase-server.ts` is `server-only`-guarded); nothing
secret ships to the browser. Writes go through RPCs / Edge Functions exclusively.

## Vercel

- Project root directory: `console/` (monorepo setting)
- Env vars: the two above, set as **server** env vars (not NEXT_PUBLIC)
- Team plan: Pro (Hobby bars commercial use)
- Auto-deploy needs the Vercel GitHub App installed on `piermadsen-blcalls` (Pier);
  until then: CLI token deploys

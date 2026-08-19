# Peptide South Africa — Tracker App

Research-peptide protocol tracker for [peptide-south-africa.co.za](https://peptide-south-africa.co.za),
with an Android build via Capacitor.

**Stack:** Vite · React 18 · TypeScript · Tailwind + shadcn/ui · Supabase (Postgres,
Auth, Storage, Edge Functions) · Vercel · Capacitor

This project was originally built on Lovable and has been migrated to run
independently. See [`docs/MIGRATION.md`](docs/MIGRATION.md) for what changed and
what still needs configuring.

---

## Local development

Requires Node.js 20+ (`nvm` recommended).

```sh
git clone https://github.com/Lutho8/peptide-south-africa-coza.git
cd peptide-south-africa-coza
npm install

cp .env.example .env.local   # then fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev                  # http://localhost:8080
```

`.env*` files are gitignored. Real values live in the Vercel dashboard
(client vars) and in Supabase Edge Function secrets (server vars).

### Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 8080 (regenerates the sitemap first) |
| `npm run build` | Production build + prerender of all static routes |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run build:native` | Native build + `cap sync` for the Android app |

---

## Backend — Supabase

The project is linked to Supabase project `eutszmrsukoqqeilzrbv`
(see `supabase/config.toml`).

```sh
npm i -g supabase
supabase login
supabase link --project-ref eutszmrsukoqqeilzrbv

supabase db push                    # apply migrations in supabase/migrations
supabase functions deploy           # deploy all edge functions
supabase functions deploy safety-check   # …or just one
```

### Edge functions

| Function | Purpose | JWT |
|---|---|---|
| `peptide-ai-agent` | Research / stack-analysis assistant | no |
| `safety-check` | AI safety review of a peptide against a user profile | yes |
| `analyze-lab-report` | Bloodwork PDF/image extraction and analysis | no |
| `mcp` | Public MCP server exposing the peptide catalogue | no |
| `process-email-queue` | Drains the transactional email queue | yes |
| `gsc-status` | Search Console sitemap + search-analytics status | yes |
| `gsc-resubmit-sitemap` | Resubmits the sitemap to Search Console | no |
| `gsc-verify-live` | Live URL verification | no |
| `nocobase-sync` | NocoBase sync | no |

### Required secrets

Set these under **Edge Functions → Secrets**, or:

```sh
supabase secrets set OPENROUTER_API_KEY=...
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat service-account.json)"
supabase secrets set RESEND_API_KEY=...
```

`.env.example` documents every secret, what uses it, and its default.

---

## Deployment — Vercel

Pushes to `main` deploy automatically. `vercel.json` handles the SPA rewrite so
OAuth callbacks don't 404, and sets immutable caching on hashed assets.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under **Project
Settings → Environment Variables** for the Production environment, then
redeploy — Vercel does not inject new variables into existing builds.

---

## Authentication

Google and Apple sign-in go through Supabase Auth directly
(`src/integrations/auth/oauth.ts`). Both providers need their own credentials in
**Supabase → Authentication → Providers**, and the production domain must be
listed under **Authentication → URL Configuration** as both the Site URL and an
allowed redirect URL.

`AUTH_MIGRATION_CHECKLIST.md` has the full step-by-step for domain changes.

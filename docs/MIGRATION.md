# Migration off Lovable

This project was built on Lovable and ran against **Lovable Cloud** — a Supabase
project provisioned inside the previous platform's organisation,
which meant the database could not be administered directly from the Supabase
dashboard.

This document records what was changed to make the project stand on its own, and
what still has to be configured outside the codebase.

---

## What the project depended on

| Lovable service | Used by | Replaced with |
|---|---|---|
| `@lovable.dev/cloud-auth-js` | Google / Apple sign-in | Native `supabase.auth.signInWithOAuth` |
| `ai.gateway.lovable.dev` + `LOVABLE_API_KEY` | AI guidance and analysis | Local privacy engine for profile guidance; OpenRouter only for approved safety and bloodwork analysis |
| `connector-gateway.lovable.dev/google_search_console` | `gsc-status`, `gsc-resubmit-sitemap` | Google service account, signed JWT (`_shared/google.ts`) |
| `@lovable.dev/email-js` | `process-email-queue` | Provider-agnostic sender (`_shared/email.ts`), Resend-ready |
| `@lovable.dev/mcp-js` (Vite plugin + runtime) | `supabase/functions/mcp` | Official `@modelcontextprotocol/sdk`, hand-written |
| `lovable-tagger` | Dev-mode component tagging | Removed |
| Platform-managed Postgres | Everything | Company-owned Supabase project |

---

## Code changes

**Frontend**

- `src/integrations/lovable/` deleted; `src/integrations/auth/oauth.ts` added.
  It calls `supabase.auth.signInWithOAuth` and lets Supabase handle the redirect
  and session pickup, rather than exchanging tokens through Lovable's broker.
- `src/contexts/AuthContext.tsx` updated to use it. The public
  `signInWithOAuth(provider)` API is unchanged, so `AuthModal` needed no edits.
- `vite.config.ts`: `componentTagger()` and `mcpPlugin()` removed. The MCP edge
  function is no longer regenerated on every build — it is now source you own.
- `src/lib/mcp/types.ts` added with local `defineTool` / `defineMcp` helpers,
  replacing the imports from `@lovable.dev/mcp-js`. Tool logic is unchanged.
- `package.json`: three Lovable packages removed. `bun.lock` was deleted in
  favour of `package-lock.json` — it still pinned the removed packages, and
  Vercel would have preferred it during install.

**Edge functions**

- `_shared/ai.ts` — one OpenRouter client for safety and bloodwork analysis. Model ids
  come from `AI_MODEL_DEFAULT` / `AI_MODEL_VISION` so the catalogue can move
  without a code change. OpenRouter uses the same OpenAI-shaped request and the
  same 429 / 402 status codes as the old gateway, so error handling remains
  consistent. `peptide-ai-agent` keeps profiles, goals, and stacks inside the
  owned Supabase function and returns deterministic, privacy-first guidance.
- `_shared/google.ts` — mints a Google access token from a service-account JSON
  key by signing a JWT with WebCrypto (RS256) and exchanging it at
  `oauth2.googleapis.com`. Tokens are cached in memory until 60s before expiry.
  Search Console calls now go straight to `www.googleapis.com/webmasters/v3`.
- `_shared/email.ts` — `sendEmail()` behind a provider switch. Resend is the
  production default and fails closed if `RESEND_API_KEY` is missing, so queued
  mail is never reported as delivered when it was only logged. `EMAIL_PROVIDER=none`
  remains available for explicit local testing. `EmailSendError`
  carries the upstream status so the existing 429 back-off still works.
- `crm-capture` / `crm-admin` — replaces the external CRM integration
  with server-only `tracker.crm_leads` and `tracker.crm_activities` tables.
  Capture is rate-limited and validated at the Edge; CRM reads and status
  changes require the tracker administrator role.
- `supabase/functions/mcp/` — rewritten on the official MCP SDK, stateless
  Streamable HTTP. 438 lines across `index.ts` + `data.ts`, down from a
  5,812-line generated bundle. The peptide catalogue is inlined in `data.ts`
  because Deno functions cannot import from `src/`; that file has regeneration
  instructions at the top.

**Repo hygiene**

- `.env` and `.env.native` were committed to git. Both are now untracked and
  `.gitignore` covers `.env*` except `.env.example`. The keys in them were
  publishable/anon keys, not secrets, but they should not have been in history.
- `supabase/config.toml` uses a non-sensitive local project name; deployments
  are linked explicitly with `supabase link --project-ref <owned-project-ref>`.

---

## Production cutover gates

1. **Import the Lovable database.** The export is generated from Lovable →
   Cloud → Advanced settings → *Export project data*, and is delivered by email
   and into Cloud storage. Download it **before** disabling Lovable Cloud — once
   Cloud is removed the exports become unreachable. Storage buckets
   (`lab-reports`, `progress-photos`) download separately from the storage view.
2. **Import tracker data into the existing `tracker` schema.** The owned project
   already contains the tracker schema and tables. Migration
   `20260822134000_tracker_schema_api_cutover.sql` exposes that schema through
   PostgREST and installs owner-scoped RLS policies; it must be applied before
   the independent frontend is promoted.
3. **Merge auth users.** Reconcile the legacy and owned-project account exports. Check for
   email collisions with the target project before importing — `auth.users.email`
   is unique, and a collision silently orphans that user's data.
4. **Set the edge function secrets** listed in `.env.example`, then deploy the
   tracker Edge Functions. AI and bloodwork require `OPENROUTER_API_KEY`;
   transactional email requires `RESEND_API_KEY`.
5. **Configure OAuth providers** in the owned Supabase project with your own Google and Apple
   credentials, and add both production domains to the allowed redirect URLs.
6. **Promote and verify** the frontend only after the account/data counts match,
   smoke-test sign-in, cloud sync, bloodwork upload/analysis, email, and confirm
   that neither live site makes any request to `*.lovable.dev`.

The repository can be Lovable-independent before these operational gates are
complete; the live application cannot be called fully cut over until all six
checks pass.

# OAuth Deployment Checklist: Supabase → Vercel/Cloudflare

Use this checklist when deploying the independent app to Vercel (or Cloudflare Pages) to ensure Google / Apple OAuth sign-in continues to work.

---

## 1. `vercel.json` is present and correct

- [ ] File exists at project root: `vercel.json`
- [ ] Contains SPA rewrite rules so OAuth callbacks don't 404:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

---

## 2. Supabase environment variables are set in the hosting dashboard

> **Do NOT commit `.env` to git.** These values must be added in the platform dashboard.

### Vercel Dashboard
1. Go to **Project Settings → Environment Variables**
2. Add the following **Production** variables:

| Variable Name | Example Value | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://<project-id>.supabase.co` | Must match the Supabase project you want users to auth against |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGci...` | Found in Supabase → Project Settings → API → `anon public` |

3. **Redeploy** after adding variables (Vercel does not auto-inject into existing builds).

### Cloudflare Pages (if applicable)
1. Go to **Pages → Project → Settings → Environment Variables**
2. Add the same two variables under **Production** environment.
3. Trigger a new deployment.

### Verify in the browser
- Open DevTools → Console
- If `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` are missing, you will see a `[Supabase Config]` warning logged by `src/integrations/supabase/client.ts`.

---

## 3. Google Cloud Console redirect URLs updated

1. Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Find the **OAuth 2.0 Client ID** used by your Supabase project
3. Under **Authorized redirect URIs**, ensure both are present:
   - `https://<your-new-domain>/auth/callback`
   - `https://<your-new-domain>`
4. Under **Authorized JavaScript origins**, add:
   - `https://<your-new-domain>`
   - `https://<your-new-domain>/auth/callback`

> Replace `<your-new-domain>` with your actual Vercel/Cloudflare domain (e.g. `peptide-mastery.vercel.app` or `peptide-south-africa.co.za`).

---

## 4. Supabase Auth URL settings updated

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **Authentication → URL Configuration**
3. Update the following fields to your new domain:

| Setting | Value |
|---|---|
| Site URL | `https://<your-new-domain>` |
| Redirect URL | `https://<your-new-domain>/auth/callback` |

4. Go to **Authentication → Providers → Google**
   - Ensure **Enable Sign in with Google** is toggled on
   - Verify the **Client ID** and **Client Secret** match the ones from Google Cloud Console
5. Repeat for **Apple** provider if applicable.

---

## 5. Test the login flow

### Local dev test (optional but recommended)
```bash
# 1. Ensure .env.local has the correct Supabase vars
cp .env.example .env.local
# 2. Edit .env.local with real values
# 3. Start dev server
npm run dev
```
- Click **Sign In with Google**
- Browser should redirect to Google consent screen
- After consent, should redirect to `http://localhost:5173/auth/callback?code=...`
- Should land on app dashboard with user logged in

### Production test
- [ ] Open the live site in an incognito window
- [ ] Click **Sign In with Google**
- [ ] Complete OAuth flow
- [ ] Verify user avatar/name appears in UI
- [ ] Verify `localStorage` contains a `sb-<project-id>-auth-token` key (Supabase session)
- [ ] Verify `localStorage` contains namespaced app data under `peptide_app_*::<user_id>`
- [ ] Sign out and sign back in — session should restore correctly

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| 404 on `/auth/callback` | `vercel.json` missing or incorrect | Add SPA rewrite rules |
| Console: `[Supabase Config] VITE_SUPABASE_URL is missing` | Env vars not set in Vercel/Cloudflare dashboard | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` and redeploy |
| Google "redirect_uri_mismatch" error | Google Cloud Console redirect URI doesn't match new domain | Update Authorized redirect URIs in Google Cloud Console |
| "Invalid login credentials" after redirect | Wrong Supabase project or missing provider config | Verify Supabase Auth URL settings and provider secrets |
| User data appears empty after login | Old data is under a different `user_id` namespace | Use the **Data Migration Helper** (modal should appear automatically if legacy data is detected) |

---

## Domain-specific note

All canonical and OAuth return URLs must use `https://peptide-south-africa.co.za` in production.

// Google API auth, replacing Lovable's connector gateway
// (https://connector-gateway.lovable.dev/google_search_console), which held the
// Google credentials on Lovable's side and proxied requests for us.
//
// We now hold our own credentials: a Google Cloud **service account** whose
// email has been added as an owner/full user on the Search Console property.
//
// Required Supabase secret:
//   GOOGLE_SERVICE_ACCOUNT_JSON – the full service-account JSON key, verbatim
//
// Setup (once):
//   1. Google Cloud Console -> IAM & Admin -> Service Accounts -> create one.
//   2. Keys -> Add key -> JSON. Keep the file out of git.
//   3. Enable the "Google Search Console API" for the project.
//   4. Search Console -> Settings -> Users and permissions -> add the service
//      account's client_email as an Owner (Full user cannot submit sitemaps).
//   5. supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat key.json)"

export const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters";
export const GOOGLE_API_BASE = "https://www.googleapis.com";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type CachedToken = { token: string; expiresAt: number };

const tokenCache = new Map<string, CachedToken>();

function loadServiceAccount(): ServiceAccount {
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured");
  }
  let parsed: ServiceAccount;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key");
  }
  return parsed;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlEncodeJson(value: unknown): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

/** Converts a PEM PKCS#8 private key into a WebCrypto RSASSA-PKCS1-v1_5 signing key. */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/**
 * Returns a Google OAuth2 access token for the given scope, minted from the
 * service account via the JWT bearer grant. Tokens are cached in memory for
 * the life of the function instance and refreshed 60s before they expire.
 */
export async function getGoogleAccessToken(scope: string = GSC_SCOPE): Promise<string> {
  const cached = tokenCache.get(scope);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const sa = loadServiceAccount();
  const tokenUri = sa.token_uri ?? "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncodeJson({ alg: "RS256", typ: "JWT" });
  const claims = base64UrlEncodeJson({
    iss: sa.client_email,
    scope,
    aud: tokenUri,
    exp: now + 3600,
    iat: now,
  });

  const signingInput = `${header}.${claims}`;
  const key = await importPrivateKey(sa.private_key.replace(/\\n/g, "\n"));
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[google] token exchange failed", { status: res.status, detail });
    throw new Error(`Google token exchange failed (${res.status})`);
  }

  const json = await res.json() as { access_token: string; expires_in: number };
  tokenCache.set(scope, {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  });
  return json.access_token;
}

/** Authorization headers for a direct call to a Google REST API. */
export async function googleAuthHeaders(scope: string = GSC_SCOPE): Promise<Record<string, string>> {
  return { Authorization: `Bearer ${await getGoogleAccessToken(scope)}` };
}

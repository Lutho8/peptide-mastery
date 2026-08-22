import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { googleAuthHeaders, GOOGLE_API_BASE } from "../_shared/google.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GSC_API = `${GOOGLE_API_BASE}/webmasters/v3`;
const SITE_URL = "https://peptide-south-africa.co.za/";
const SITEMAP_URL = "https://peptide-south-africa.co.za/sitemap.xml";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Verify caller is admin (mirrors gsc-status)
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: "tracker" },
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let gscHeaders: Record<string, string>;
  try {
    gscHeaders = await googleAuthHeaders();
  } catch (err) {
    console.error("[gsc-resubmit-sitemap] Google auth failed", String(err));
    return new Response(JSON.stringify({ error: "Google Search Console credentials are not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let source = "manual";
  try { const body = await req.json(); if (body?.source) source = String(body.source); } catch {}

  const encSite = encodeURIComponent(SITE_URL);
  const encSitemap = encodeURIComponent(SITEMAP_URL);

  const putRes = await fetch(`${GSC_API}/sites/${encSite}/sitemaps/${encSitemap}`, {
    method: "PUT",
    headers: gscHeaders,
  });

  let getJson: any = null;
  if (putRes.ok || putRes.status === 204) {
    const getRes = await fetch(`${GSC_API}/sites/${encSite}/sitemaps/${encSitemap}`, {
      headers: gscHeaders,
    });
    if (getRes.ok) getJson = await getRes.json().catch(() => null);
  }

  const status = (putRes.ok || putRes.status === 204) ? "success" : "error";
  const errorsArr = getJson?.errors != null ? [{ count: getJson.errors }] : [];
  const warnings = typeof getJson?.warnings === "number" ? getJson.warnings : 0;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { db: { schema: "tracker" } });
  await admin.from("gsc_submissions").insert({
    site_url: SITE_URL,
    sitemap_url: SITEMAP_URL,
    status,
    http_status: putRes.status,
    errors: errorsArr,
    warnings,
    source,
  });

  // Snapshot coverage at the same time
  if (getJson) {
    const contents = Array.isArray(getJson.contents) ? getJson.contents : [];
    const submitted = contents.reduce((s: number, c: any) => s + (Number(c.submitted) || 0), 0);
    const indexed = contents.reduce((s: number, c: any) => s + (Number(c.indexed) || 0), 0);
    await admin.from("gsc_coverage_snapshots").insert({
      site_url: SITE_URL,
      submitted,
      indexed,
      errors: Number(getJson.errors) || 0,
      warnings,
      raw: getJson,
    });
  }

  return new Response(JSON.stringify({ status, http_status: putRes.status, sitemap: getJson }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

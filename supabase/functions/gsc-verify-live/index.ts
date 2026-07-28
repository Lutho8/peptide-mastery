import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_HOSTS = new Set([
  "peptide-south-africa.co.za",
  "peptide-south-africa.co.za",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Admin auth
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

  let url = "https://peptide-south-africa.co.za/";
  try { const body = await req.json(); if (body?.url) url = String(body.url); } catch {}
  if (!/^https?:\/\//.test(url)) url = "https://" + url;

  // Restrict fetched origin to prevent SSRF
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid URL" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!ALLOWED_HOSTS.has(parsedUrl.hostname) || (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:")) {
    return new Response(JSON.stringify({ ok: false, error: "Host not allowed" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let html = "";
  let status = 0;
  try {
    const res = await fetch(parsedUrl.toString(), { headers: { "User-Agent": "PeptideSA-SEO-Check/1.0" } });
    status = res.status;
    html = await res.text();
  } catch (e) {
    console.error("gsc-verify-live fetch error:", e);
    return new Response(JSON.stringify({ ok: false, error: "Upstream fetch failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const findAll = (re: RegExp) => [...html.matchAll(re)];
  const head = html.split(/<\/head>/i)[0] || html;

  const verification = head.match(/<meta\s+name=["']google-site-verification["']\s+content=["']([^"']+)["']/i);
  const title = head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;
  const description = head.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] ?? null;
  const canonical = head.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] ?? null;

  const hreflangs = findAll(/<link\s+rel=["']alternate["']\s+hreflang=["']([^"']+)["']\s+href=["']([^"']+)["']/gi)
    .map((m) => ({ hreflang: m[1], href: m[2] }));

  const ogTags = findAll(/<meta\s+property=["'](og:[^"']+)["']\s+content=["']([^"']+)["']/gi)
    .map((m) => ({ property: m[1], content: m[2] }));

  const jsonLdBlocks = findAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    .map((m) => {
      try { return JSON.parse(m[1]); } catch { return { __invalid: true }; }
    });

  const required = ["en-za", "de-de", "x-default"];
  const hreflangCodes = hreflangs.map((h) => h.hreflang.toLowerCase());
  const missingHreflang = required.filter((r) => !hreflangCodes.includes(r));

  const checks = {
    http_ok: status >= 200 && status < 400,
    google_verification: !!verification,
    title: !!title,
    description: !!description,
    canonical: !!canonical,
    hreflang_complete: missingHreflang.length === 0,
    has_jsonld: jsonLdBlocks.length > 0,
    og_tags: ogTags.length > 0,
  };
  const ready = Object.values(checks).every(Boolean);

  return new Response(JSON.stringify({
    ok: true, url, http_status: status, ready, checks,
    found: {
      verification_token: verification?.[1] ?? null,
      title, description, canonical,
      hreflangs, og_tags: ogTags,
      jsonld_count: jsonLdBlocks.length,
      jsonld_types: jsonLdBlocks.map((b: any) => b?.["@type"] ?? "unknown"),
      missing_hreflang: missingHreflang,
    },
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { googleAuthHeaders, GOOGLE_API_BASE } from "../_shared/google.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GSC_API = `${GOOGLE_API_BASE}/webmasters/v3`;
const SITE_URL = "https://peptide-south-africa.co.za/";
const SITEMAP_URL = "https://peptide-south-africa.co.za/sitemap.xml";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    db: { schema: "tracker" },
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const encSite = encodeURIComponent(SITE_URL);
  const encSitemap = encodeURIComponent(SITEMAP_URL);

  let gscHeaders: Record<string, string>;
  try {
    gscHeaders = await googleAuthHeaders();
  } catch (err) {
    console.error("[gsc-status] Google auth failed", String(err));
    return new Response(JSON.stringify({ error: "Google Search Console credentials are not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const [sitemapRes, saRes] = await Promise.all([
    fetch(`${GSC_API}/sites/${encSite}/sitemaps/${encSitemap}`, { headers: gscHeaders }),
    (async () => {
      const end = new Date();
      const start = new Date(); start.setDate(end.getDate() - 28);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      return fetch(`${GSC_API}/sites/${encSite}/searchAnalytics/query`, {
        method: "POST",
        headers: { ...gscHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: fmt(start), endDate: fmt(end),
          dimensions: ["date"], rowLimit: 1000,
        }),
      });
    })(),
  ]);

  const sitemap = sitemapRes.ok ? await sitemapRes.json().catch(() => null) : null;
  const searchAnalytics = saRes.ok ? await saRes.json().catch(() => null) : null;

  // Recent submissions + coverage trend from our DB
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { db: { schema: "tracker" } });
  const [{ data: submissions }, { data: coverage }] = await Promise.all([
    admin.from("gsc_submissions").select("*").order("submitted_at", { ascending: false }).limit(20),
    admin.from("gsc_coverage_snapshots").select("*").order("captured_at", { ascending: true }).limit(60),
  ]);

  return new Response(JSON.stringify({
    sitemap,
    searchAnalytics,
    submissions: submissions ?? [],
    coverage: coverage ?? [],
    site_url: SITE_URL,
    sitemap_url: SITEMAP_URL,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});

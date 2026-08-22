import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const ALLOWED_ORIGINS = new Set([
  "https://peptide-south-africa.co.za",
  "https://www.peptide-south-africa.co.za",
  "capacitor://localhost",
  "http://localhost:5173",
]);

function cors(origin: string | null) {
  return {
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://peptide-south-africa.co.za",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  };
};

function json(origin: string | null, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(origin, { error: "Origin not allowed" }, 403);
  if (req.method !== "POST") return json(origin, { error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const userClient = createClient(supabaseUrl, anonKey, {
    db: { schema: "tracker" },
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser(token);
  if (userError || !user) return json(origin, { error: "Unauthorized" }, 401);
  const { data: isAdmin, error: roleError } = await userClient.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (roleError || !isAdmin) return json(origin, { error: "Forbidden" }, 403);

  let body: { action?: string; leadId?: string; status?: string } = {};
  try { body = await req.json(); } catch { return json(origin, { error: "Invalid JSON" }, 400); }
  const admin = createClient(supabaseUrl, serviceKey, { db: { schema: "tracker" } });

  if (body.action === "update_status") {
    if (!body.leadId || !["new", "nurturing", "qualified", "converted"].includes(body.status ?? "")) {
      return json(origin, { error: "Invalid status update" }, 400);
    }
    const { error } = await admin.from("crm_leads")
      .update({ lead_status: body.status, updated_at: new Date().toISOString() })
      .eq("id", body.leadId);
    if (error) return json(origin, { error: "Update failed" }, 500);
    return json(origin, { ok: true });
  }

  const [{ data: leads, error: leadsError }, { data: activities, error: activitiesError }] = await Promise.all([
    admin.from("crm_leads").select("id,email,first_name,last_name,phone,source,plan_interest,lead_status,lead_score,last_activity_at,created_at").order("last_activity_at", { ascending: false }).limit(500),
    admin.from("crm_activities").select("id,lead_id,activity_type,created_at").order("created_at", { ascending: false }).limit(1_000),
  ]);
  if (leadsError || activitiesError) {
    console.error("crm-admin read failed", leadsError?.message, activitiesError?.message);
    return json(origin, { error: "CRM read failed" }, 500);
  }

  const activityCounts: Record<string, number> = {};
  for (const activity of activities ?? []) {
    activityCounts[activity.lead_id] = (activityCounts[activity.lead_id] ?? 0) + 1;
  }
  const enriched = (leads ?? []).map((lead) => ({ ...lead, activity_count: activityCounts[lead.id] ?? 0 }));
  return json(origin, {
    leads: enriched,
    stats: {
      total: enriched.length,
      qualified: enriched.filter((lead) => lead.lead_status === "qualified").length,
      converted: enriched.filter((lead) => lead.lead_status === "converted").length,
      premium: enriched.filter((lead) => lead.plan_interest === "premium").length,
    },
  });
});

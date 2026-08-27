import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const ALLOWED_ORIGINS = new Set([
  "https://peptide-south-africa.co.za",
  "https://www.peptide-south-africa.co.za",
  "https://www.peptide-south-africa.com",
  "https://peptide-south-africa.com",
  "https://capetownpeptideclub.co.za",
  "https://pets.peptide-south-africa.com",
  "capacitor://localhost",
  "http://localhost",
  "http://localhost:5173",
]);

const ACTIVITY_TYPES = new Set([
  "page_view", "qa_signup", "course_start", "calculator_use",
  "premium_click", "pricing_view", "peptide_search", "email_open",
  "consultation_booked", "store_click", "account_created",
]);
const PLAN_INTERESTS = new Set(["free", "premium", "undecided"]);
const SCORE_TABLE: Record<string, number> = {
  page_view: 1, pricing_view: 10, qa_signup: 15, course_start: 10,
  calculator_use: 5, peptide_search: 3, premium_click: 25,
  email_open: 2, consultation_booked: 40, store_click: 20,
  account_created: 15,
};
const HIGH_INTENT = new Set(["qa_signup", "course_start", "premium_click", "consultation_booked"]);
const MAX_BODY_BYTES = 16_384;
const MAX_CAPTURES_PER_MINUTE = 20;

type Payload = {
  action?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  source?: string;
  planInterest?: string;
  activityType?: string;
  activityData?: Record<string, unknown>;
  pageUrl?: string;
  sessionId?: string;
  placement?: string;
  destination?: string;
};

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://peptide-south-africa.co.za",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(origin: string | null, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function bounded(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean ? clean.slice(0, max) : null;
}

function safePageUrl(value: unknown): string | null {
  const raw = bounded(value, 1_000);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!ALLOWED_ORIGINS.has(url.origin)) return null;
    return `${url.origin}${url.pathname}`.slice(0, 1_000);
  } catch {
    return null;
  }
}

function safeStoreDestination(value: unknown): URL | null {
  const raw = bounded(value, 1_000);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    if (url.hostname !== "peptide-south-africa.com" && url.hostname !== "www.peptide-south-africa.com") return null;
    return url;
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char]!));
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json(origin, { ok: false, error: "Method not allowed" }, 405);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(origin, { ok: false, error: "Origin not allowed" }, 403);

  const declaredLength = Number(req.headers.get("content-length") || "0");
  if (declaredLength > MAX_BODY_BYTES) return json(origin, { ok: false, error: "Payload too large" }, 413);

  let payload: Payload;
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return json(origin, { ok: false, error: "Payload too large" }, 413);
    }
    payload = JSON.parse(raw);
  } catch {
    return json(origin, { ok: false, error: "Invalid JSON" }, 400);
  }

  const email = bounded(payload.email, 320)?.toLowerCase() ?? "";
  const source = bounded(payload.source, 120);
  const activityType = bounded(payload.activityType, 40);
  const planInterest = bounded(payload.planInterest, 20) ?? "undecided";
  const sessionId = bounded(payload.sessionId, 100);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const crm = createClient(supabaseUrl, serviceKey, { db: { schema: "tracker" } });

  if (payload.action === "track_store_cta") {
    const placement = bounded(payload.placement, 80);
    const destination = safeStoreDestination(payload.destination);
    if (!placement || !destination) {
      return json(origin, { ok: false, error: "Invalid store CTA event" }, 400);
    }

    if (sessionId) {
      const since = new Date(Date.now() - 60_000).toISOString();
      const { count, error } = await crm.from("commerce_events")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId).gte("created_at", since);
      if (error) {
        console.error("store CTA rate-limit query failed", error.message);
        return json(origin, { ok: false, error: "Commerce analytics temporarily unavailable" }, 503);
      }
      if ((count ?? 0) >= MAX_CAPTURES_PER_MINUTE) {
        return json(origin, { ok: false, error: "Too many requests" }, 429);
      }
    }

    let userId: string | null = null;
    let verifiedEmail = "";
    const authorization = req.headers.get("Authorization");
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (token) {
      const { data: authData } = await crm.auth.getUser(token);
      userId = authData.user?.id ?? null;
      verifiedEmail = authData.user?.email?.trim().toLowerCase() ?? "";
    }

    const activityEmail = verifiedEmail || email;
    let leadId: string | null = null;
    if (activityEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(activityEmail)) {
      const { data, error } = await crm.rpc("capture_crm_activity", {
        p_email: activityEmail,
        p_first_name: null,
        p_last_name: null,
        p_phone: null,
        p_source: source ?? `store_cta_${placement}`,
        p_plan_interest: "undecided",
        p_activity_type: "store_click",
        p_score_delta: SCORE_TABLE.store_click,
        p_activity_data: { placement, destination_path: destination.pathname },
        p_page_url: safePageUrl(payload.pageUrl),
        p_session_id: sessionId,
      });
      if (error) {
        console.error("store CTA CRM link failed", error.message);
      } else {
        leadId = typeof data?.lead_id === "string" ? data.lead_id : null;
      }
    }

    const { error: insertError } = await crm.from("commerce_events").insert({
      event_name: "buy_peptides_cta_clicked",
      placement,
      destination_host: destination.hostname,
      destination_path: destination.pathname,
      user_id: userId,
      lead_id: leadId,
      session_id: sessionId,
      page_url: safePageUrl(payload.pageUrl),
    });
    if (insertError) {
      console.error("store CTA capture failed", insertError.message);
      return json(origin, { ok: false, error: "Commerce analytics temporarily unavailable" }, 503);
    }

    return json(origin, { ok: true, linkedUser: Boolean(userId), linkedLead: Boolean(leadId) });
  }

  if (payload.action !== "capture_lead" || !source || !activityType || !ACTIVITY_TYPES.has(activityType)) {
    return json(origin, { ok: false, error: "Invalid CRM event" }, 400);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(origin, { ok: true, skipped: "no-email" });
  }
  if (!PLAN_INTERESTS.has(planInterest)) return json(origin, { ok: false, error: "Invalid plan interest" }, 400);

  const activityData = payload.activityData && typeof payload.activityData === "object" && !Array.isArray(payload.activityData)
    ? payload.activityData : null;
  if (activityData && JSON.stringify(activityData).length > 4_096) {
    return json(origin, { ok: false, error: "Activity data too large" }, 413);
  }

  if (sessionId) {
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count, error } = await crm.from("crm_activities")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId).gte("created_at", since);
    if (error) {
      console.error("crm-capture rate-limit query failed", error.message);
      return json(origin, { ok: false, error: "CRM temporarily unavailable" }, 503);
    }
    if ((count ?? 0) >= MAX_CAPTURES_PER_MINUTE) {
      return json(origin, { ok: false, error: "Too many requests" }, 429);
    }
  }

  const { data, error } = await crm.rpc("capture_crm_activity", {
    p_email: email,
    p_first_name: bounded(payload.firstName, 100),
    p_last_name: bounded(payload.lastName, 100),
    p_phone: bounded(payload.phone, 40),
    p_source: source,
    p_plan_interest: planInterest,
    p_activity_type: activityType,
    p_score_delta: SCORE_TABLE[activityType] ?? 0,
    p_activity_data: activityData,
    p_page_url: safePageUrl(payload.pageUrl),
    p_session_id: sessionId,
  });
  if (error) {
    console.error("crm-capture transaction failed", error.message);
    return json(origin, { ok: false, error: "CRM temporarily unavailable" }, 503);
  }

  if (HIGH_INTENT.has(activityType)) {
    const adminEmail = Deno.env.get("CRM_ADMIN_EMAIL");
    const from = Deno.env.get("EMAIL_FROM");
    if (!adminEmail || !from) {
      console.warn("crm-capture notification skipped: CRM_ADMIN_EMAIL or EMAIL_FROM is not configured");
      return json(origin, { ok: true, leadId: data?.lead_id, status: data?.lead_status, notification: "not-configured" });
    }
    const activityId = String(data?.activity_id ?? crypto.randomUUID());
    const subject = `Peptide SA CRM: ${activityType.replaceAll("_", " ")}`;
    const summary = `Lead: ${email}\nSource: ${source}\nPlan: ${planInterest}\nActivity: ${activityType}\nScore: ${data?.lead_score ?? "—"}`;
    const queue = createClient(supabaseUrl, serviceKey);
    const { error: queueError } = await queue.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: adminEmail,
        from,
        subject,
        text: summary,
        html: `<h2>${escapeHtml(subject)}</h2><pre>${escapeHtml(summary)}</pre>`,
        purpose: "transactional",
        label: "crm-lead",
        message_id: `crm-${activityId}`,
        idempotency_key: `crm-${activityId}`,
        queued_at: new Date().toISOString(),
      },
    });
    if (queueError) console.error("crm-capture notification queue failed", queueError.message);
  }

  return json(origin, { ok: true, leadId: data?.lead_id, status: data?.lead_status });
});

// Lovable AI-assisted safety check for a peptide against a user safety profile.
// Caches the result per (user_id, peptide_id, profile_hash) in public.safety_checks for 7 days.
// Disclaimer: research-only summary. Not medical advice.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SafetyProfile = {
  medications?: string[];
  conditions?: string[];
  allergies?: string[];
  is_pregnant?: boolean;
  age?: number;
  sex?: string | null;
  weight_kg?: number | null;
  kidney_status?: string | null;
  liver_status?: string | null;
  oncology_history?: boolean;
};

type SafetyResult = {
  status: "safe" | "caution" | "contraindicated" | "unknown";
  severity: "info" | "warning" | "danger";
  warnings: string[];
  contraindications: string[];
  reasoning: string;
};

async function hashProfile(profile: SafetyProfile): Promise<string> {
  const stable = JSON.stringify({
    m: (profile.medications ?? []).slice().sort(),
    c: (profile.conditions ?? []).slice().sort(),
    a: (profile.allergies ?? []).slice().sort(),
    p: !!profile.is_pregnant,
    age: profile.age ?? null,
    sex: profile.sex ?? null,
    w: profile.weight_kg ?? null,
    k: profile.kidney_status ?? null,
    l: profile.liver_status ?? null,
    o: !!profile.oncology_history,
  });
  const data = new TextEncoder().encode(stable);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function buildPrompt(peptideId: string, peptideName: string, profile: SafetyProfile): string {
  return `You are a clinical safety reviewer producing a research-only summary (not medical advice).

Peptide: ${peptideName} (id: ${peptideId})

User profile:
- Age: ${profile.age ?? "unknown"}
- Sex: ${profile.sex ?? "unknown"}
- Weight: ${profile.weight_kg ?? "unknown"} kg
- Pregnant: ${profile.is_pregnant ? "YES" : "no"}
- Oncology history: ${profile.oncology_history ? "YES" : "no"}
- Kidney status: ${profile.kidney_status ?? "normal"}
- Liver status: ${profile.liver_status ?? "normal"}
- Current medications: ${(profile.medications ?? []).join(", ") || "none"}
- Medical conditions: ${(profile.conditions ?? []).join(", ") || "none"}
- Allergies: ${(profile.allergies ?? []).join(", ") || "none"}

Return JSON only with this exact shape:
{
  "status": "safe" | "caution" | "contraindicated",
  "severity": "info" | "warning" | "danger",
  "warnings": string[],   // plain-language warnings, each <120 chars
  "contraindications": string[], // hard contraindications, each <120 chars
  "reasoning": string     // 2-4 sentences explaining the assessment with mechanism
}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const { peptideId, peptideName, profile } = body as { peptideId: string; peptideName: string; profile: SafetyProfile };
    if (!peptideId || !peptideName || !profile) {
      return new Response(JSON.stringify({ error: "Missing peptideId, peptideName or profile" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const profileHash = await hashProfile(profile);

    // Cache lookup
    const { data: cached } = await supabase
      .from("safety_checks")
      .select("*")
      .eq("user_id", userId)
      .eq("peptide_id", peptideId)
      .eq("profile_hash", profileHash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({
        status: cached.status,
        severity: cached.severity,
        warnings: cached.warnings,
        contraindications: cached.contraindications,
        reasoning: cached.reasoning,
        cached: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": lovableKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a clinical safety reviewer for research peptides. Reply with strict JSON only — no markdown fences." },
          { role: "user", content: buildPrompt(peptideId, peptideName, profile) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("[safety-check] AI gateway error", { status: aiRes.status, body: t });
      return new Response(JSON.stringify({ error: "AI service error. Please try again." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiRes.json();
    const content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: SafetyResult;
    try {
      parsed = JSON.parse(content.replace(/^```json\s*|\s*```$/g, ""));
    } catch {
      return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const normalized: SafetyResult = {
      status: ["safe", "caution", "contraindicated"].includes(parsed.status) ? parsed.status : "unknown",
      severity: ["info", "warning", "danger"].includes(parsed.severity) ? parsed.severity : "info",
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.slice(0, 10) : [],
      contraindications: Array.isArray(parsed.contraindications) ? parsed.contraindications.slice(0, 10) : [],
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning.slice(0, 1000) : "",
    };

    await supabase.from("safety_checks").upsert({
      user_id: userId,
      peptide_id: peptideId,
      profile_hash: profileHash,
      status: normalized.status,
      severity: normalized.severity,
      warnings: normalized.warnings,
      contraindications: normalized.contraindications,
      reasoning: normalized.reasoning,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "user_id,peptide_id,profile_hash" });

    return new Response(JSON.stringify({ ...normalized, cached: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("safety-check error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

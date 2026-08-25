import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RequestBody = {
  type?: "research";
  peptideId?: string;
  peptideName?: string;
  query?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function researchContent(name: string, query?: string) {
  return `## ${name}: research review checklist

Use this checklist to review the catalogue entry and its linked primary sources. Do not treat a catalogue summary as a substitute for the underlying study or patient-specific advice.

${query ? `Your question was: **${query.slice(0, 300)}**\n\n` : ""}### A simple review checklist
1. Separate human evidence from animal or laboratory research.
2. Check whether the intended goal matches the studied outcome.
3. Identify limitations, uncertainty and conflicts of interest.
4. Verify each citation and distinguish source-backed facts from catalogue labels.
5. Route personal suitability, treatment and monitoring decisions to a qualified healthcare professional.

This is educational information, not a diagnosis or prescription.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await client.auth.getUser(token);
  if (!user) return json({ success: false, error: "Authentication required" }, 401);

  let body: RequestBody;
  try { body = await req.json(); } catch { return json({ success: false, error: "Invalid JSON" }, 400); }

  let content: string;
  if (body.type === "research") {
    const name = (body.peptideName || body.peptideId || "Peptide").trim().slice(0, 100);
    content = researchContent(name, typeof body.query === "string" ? body.query : undefined);
  } else {
    return json({ success: false, error: "Only sourced research summaries are supported" }, 400);
  }

  return json({ success: true, content, type: body.type, provider: "local-privacy-engine", timestamp: new Date().toISOString() });
});

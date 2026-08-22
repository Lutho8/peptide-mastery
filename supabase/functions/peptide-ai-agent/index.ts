import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type UserProfile = { goals?: string[]; experienceLevel?: string };
type RequestBody = {
  type?: "research" | "recommend" | "optimize";
  peptideId?: string;
  peptideName?: string;
  userProfile?: UserProfile;
  currentStack?: string[];
  query?: string;
};

const GOAL_GUIDES: Array<{ terms: string[]; options: string[]; note: string }> = [
  { terms: ["weight", "fat", "metabolic"], options: ["Semaglutide", "Tirzepatide", "Retatrutide"], note: "metabolic and appetite research" },
  { terms: ["heal", "recovery", "injury"], options: ["BPC-157", "TB-500", "GHK-Cu"], note: "tissue-repair research" },
  { terms: ["cognitive", "focus", "anxiety"], options: ["Semax", "Selank", "DSIP"], note: "cognitive and stress-response research" },
  { terms: ["longevity", "energy", "aging"], options: ["Epitalon", "SS-31", "MOTS-c"], note: "mitochondrial and longevity research" },
  { terms: ["muscle", "performance", "sleep"], options: ["CJC-1295", "Ipamorelin", "DSIP"], note: "recovery and performance research" },
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function cleanList(values: unknown, max = 12) {
  return Array.isArray(values)
    ? values.filter((value): value is string => typeof value === "string").map((value) => value.trim().slice(0, 80)).filter(Boolean).slice(0, max)
    : [];
}

function recommendationContent(profile?: UserProfile) {
  const goals = cleanList(profile?.goals, 8);
  const searchable = goals.join(" ").toLowerCase();
  const matched = GOAL_GUIDES.filter((guide) => guide.terms.some((term) => searchable.includes(term)));
  const guides = matched.length ? matched : [GOAL_GUIDES[0]];
  const unique = [...new Set(guides.flatMap((guide) => guide.options))].slice(0, 5);
  return `## Your research starting point

Your selected goals: **${goals.length ? goals.join(", ") : "general wellbeing"}**.

Peptides commonly discussed in the relevant research categories include:
${unique.map((name, index) => `${index + 1}. **${name}**`).join("\n")}

### Why these appeared
${guides.map((guide) => `- ${guide.options.slice(0, 2).join(" and ")} relate to ${guide.note}.`).join("\n")}

### Your next safe step
Open each peptide in the Research Library, review contraindications, and take the shortlist to a qualified healthcare professional. This guide intentionally does not calculate a personal prescription or change a clinician’s plan.`;
}

function researchContent(name: string, query?: string) {
  return `## ${name}: guided research overview

Use the ${name} entry in the Peptide South Africa Research Library as the source of truth for mechanism, evidence level, administration route, storage, and known cautions.

${query ? `Your question was: **${query.slice(0, 300)}**\n\n` : ""}### A simple review checklist
1. Separate human evidence from animal or laboratory research.
2. Check whether the intended goal matches the studied outcome.
3. Review interactions, contraindications, and required monitoring.
4. Confirm product identity and certificate-of-analysis details.
5. Discuss personal suitability with a qualified healthcare professional.

This is educational information, not a diagnosis or prescription.`;
}

function optimizationContent(stack: string[], profile?: UserProfile, query?: string) {
  const goals = cleanList(profile?.goals, 8);
  return `## Stack review

**Current stack:** ${stack.length ? stack.join(", ") : "No compounds supplied"}
**Goals:** ${goals.length ? goals.join(", ") : "Not supplied"}

### Simplify before adding
- Confirm that every compound has one clear job linked to a stated goal.
- Avoid adding compounds to correct side effects from another compound.
- Review overlapping mechanisms and monitoring requirements in the Safety Centre.
- Log one change at a time so response and adverse effects remain attributable.
${query ? `\n**Specific concern:** ${query.slice(0, 300)}\n` : ""}
Use the Stack Compatibility tool for known catalogue interactions, then have a qualified healthcare professional review the final plan. No personal dose or schedule is generated here.`;
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
  } else if (body.type === "recommend") {
    content = recommendationContent(body.userProfile);
  } else if (body.type === "optimize") {
    content = optimizationContent(cleanList(body.currentStack), body.userProfile, typeof body.query === "string" ? body.query : undefined);
  } else {
    return json({ success: false, error: "Unsupported guidance request" }, 400);
  }

  return json({ success: true, content, type: body.type, provider: "local-privacy-engine", timestamp: new Date().toISOString() });
});

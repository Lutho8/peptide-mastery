import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EvidenceSource = {
  id?: string;
  label?: string;
  title?: string;
  url?: string;
  year?: number;
  findings?: string[];
  studiedProtocol?: string;
};

type EvidencePacket = {
  peptideId?: string;
  peptideName?: string;
  evidenceLabel?: string;
  evidenceNote?: string;
  lastReviewed?: string;
  sources?: EvidenceSource[];
};

type MeasurementContext = {
  vialAmountMg?: number;
  diluentMl?: number;
  recordedAmount?: string;
  schedule?: string;
  syringe?: string;
  calculatedUnits?: number;
  calculatedVolumeMl?: number;
};

type RequestBody = {
  type?: "research" | "evidence_question";
  peptideId?: string;
  peptideName?: string;
  query?: string;
  question?: string;
  evidence?: EvidencePacket;
  measurementContext?: MeasurementContext;
};

const SAFE_SOURCE_HOSTS = new Set([
  "pubmed.ncbi.nlm.nih.gov",
  "www.fda.gov",
  "fda.gov",
  "www.nejm.org",
  "nejm.org",
  "www.nature.com",
  "nature.com",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && SAFE_SOURCE_HOSTS.has(url.hostname.toLowerCase())
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function sanitizeSources(sources: unknown): EvidenceSource[] {
  if (!Array.isArray(sources)) return [];
  return sources.slice(0, 8).flatMap((candidate, index) => {
    if (!candidate || typeof candidate !== "object") return [];
    const source = candidate as EvidenceSource;
    const url = safeUrl(source.url);
    const title = cleanText(source.title, 300);
    if (!url || !title) return [];
    return [{
      id: cleanText(source.id, 80) || `source-${index + 1}`,
      label: cleanText(source.label, 120) || `Source ${index + 1}`,
      title,
      url,
      year: cleanNumber(source.year),
      findings: Array.isArray(source.findings)
        ? source.findings.map((finding) => cleanText(finding, 400)).filter(Boolean).slice(0, 6)
        : [],
      studiedProtocol: cleanText(source.studiedProtocol, 240) || undefined,
    }];
  });
}

function requestsPersonalDose(question: string): boolean {
  const normalized = question.toLowerCase();
  return [
    /\bwhat (dose|dosage|amount) should i\b/,
    /\bhow much should i\b/,
    /\brecommend(?:ed)? (?:a )?(dose|dosage|protocol|cycle)\b/,
    /\b(starting|starter|ideal|best|optimal) (dose|dosage|protocol|cycle)\b/,
    /\bfor me\b.*\b(dose|dosage|protocol|cycle)\b/,
    /\bmy (weight|age|condition|medication|bloodwork)\b/,
  ].some((pattern) => pattern.test(normalized));
}

function requestsMeasurementExplanation(question: string): boolean {
  return /\b(my|recorded|calculator|calculation|measurement|syringe|units?|diluent|vial)\b/i.test(question);
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

function sourceSummary(sources: EvidenceSource[]): string {
  if (!sources.length) {
    return "No app-verified primary source is linked yet, so the assistant will not fill the gap with a guessed dose, route, population, or outcome.";
  }
  return sources.map((source, index) => {
    const protocol = source.studiedProtocol
      ? `\n- **Study protocol recorded in the source library:** ${source.studiedProtocol}`
      : "\n- **Study protocol:** not recorded in the app’s verified source library.";
    const findings = (source.findings ?? []).slice(0, 3).map((finding) => `\n- ${finding}`).join("");
    return `### [S${index + 1}] ${source.title}${protocol}${findings}`;
  }).join("\n\n");
}

function localEvidenceAnswer(
  question: string,
  peptideName: string,
  evidenceLabel: string,
  evidenceNote: string,
  sources: EvidenceSource[],
  declined: boolean,
  context?: MeasurementContext,
): string {
  const normalized = question.toLowerCase();
  const asksProtocol = /\b(dose|dosage|route|population|protocol|studied|paper|trial)\b/.test(normalized);
  const asksGaps = /\b(gap|limitation|uncertain|safety|risk|weak|quality)\b/.test(normalized);
  const asksMeasurement = requestsMeasurementExplanation(question);
  const sections: string[] = [];

  if (declined) {
    sections.push("I can’t choose or recommend a personal dose, schedule, cycle, route, syringe, stack, or treatment. I can show what named sources studied and explain an already-recorded calculation without changing it.");
  }

  sections.push(`## ${peptideName}\n\n**Evidence floor:** ${evidenceLabel}. ${evidenceNote}`);

  if (asksMeasurement) {
    sections.push(`### Your recorded calculator context\n${measurementSummary(context)}\n\nThese are the values already supplied to the deterministic calculator. They are not a new amount or protocol recommendation.`);
  }

  if (asksProtocol || !asksMeasurement || declined) {
    sections.push(`### What the linked sources report\n${sourceSummary(sources)}\n\nA reported study protocol describes that study and population; it is not a recommendation for you.`);
  }

  if (asksGaps || sources.length === 0) {
    sections.push("### Evidence gaps\nTreat unrecorded details as unknown. Check whether each source is human or preclinical, whether its population matches the question, how outcomes were measured, and whether safety follow-up was long enough. The app will not infer missing facts.");
  }

  sections.push("For a personal decision, take the linked sources and your recorded plan to a qualified healthcare professional.");
  return sections.join("\n\n").slice(0, 6000);
}

function measurementSummary(context?: MeasurementContext): string {
  if (!context) return "No completed calculator context was supplied.";
  const rows = [
    context.recordedAmount ? `Recorded amount: ${cleanText(context.recordedAmount, 80)}` : "",
    context.schedule ? `Recorded schedule: ${cleanText(context.schedule, 100)}` : "",
    cleanNumber(context.vialAmountMg) !== undefined ? `Vial label: ${context.vialAmountMg} mg` : "",
    cleanNumber(context.diluentMl) !== undefined ? `Diluent entered: ${context.diluentMl} mL` : "",
    context.syringe ? `Selected physical syringe: ${cleanText(context.syringe, 40)}` : "",
    cleanNumber(context.calculatedUnits) !== undefined ? `Deterministic calculator result: ${context.calculatedUnits} units` : "",
    cleanNumber(context.calculatedVolumeMl) !== undefined ? `Deterministic calculator volume: ${context.calculatedVolumeMl} mL` : "",
  ].filter(Boolean);
  return rows.length ? rows.join("\n") : "No completed calculator context was supplied.";
}

async function answerEvidenceQuestion(
  userClient: ReturnType<typeof createClient>,
  userId: string,
  body: RequestBody,
) {
  const question = cleanText(body.question ?? body.query, 1200);
  if (question.length < 4) return json({ success: false, error: "Enter a complete question" }, 400);

  const peptideId = cleanText(body.evidence?.peptideId ?? body.peptideId, 100);
  const peptideName = cleanText(body.evidence?.peptideName ?? body.peptideName, 120) || "Selected compound";
  if (!peptideId) return json({ success: false, error: "Select a compound first" }, 400);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await userClient
    .from("ai_request_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (countError) return json({ success: false, error: "Question history is temporarily unavailable" }, 503);
  if ((count ?? 0) >= 20) {
    return json({ success: false, error: "Daily question limit reached. Try again after the oldest question resets.", remainingToday: 0 }, 429);
  }

  const { error: usageError } = await userClient.from("ai_request_usage").insert({
    user_id: userId,
    peptide_id: peptideId,
  });
  if (usageError) return json({ success: false, error: "Question could not be recorded" }, 503);

  const sources = sanitizeSources(body.evidence?.sources);
  const evidenceLabel = cleanText(body.evidence?.evidenceLabel, 140) || "Evidence classification unavailable";
  const evidenceNote = cleanText(body.evidence?.evidenceNote, 600) || "No app-verified evidence summary is available.";
  const declined = requestsPersonalDose(question);
  const calculatorContext = requestsMeasurementExplanation(question) ? body.measurementContext : undefined;
  let answer = localEvidenceAnswer(question, peptideName, evidenceLabel, evidenceNote, sources, declined, calculatorContext);
  answer = answer.replace(/\[S(\d+)\]/g, (marker, value) => {
    const index = Number(value);
    return index >= 1 && index <= sources.length ? marker : "";
  });
  if (declined && !/can(?:not|'t) (?:choose|recommend)|cannot provide/i.test(answer)) {
    answer = `I can’t choose or recommend a personal dose, schedule or treatment.\n\n${answer}`;
  }

  return json({
    success: true,
    answer,
    citations: sources,
    personalRecommendationDeclined: declined,
    remainingToday: Math.max(0, 19 - (count ?? 0)),
    provider: "private-source-grounded-engine",
    timestamp: new Date().toISOString(),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    db: { schema: "tracker" },
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await client.auth.getUser(token);
  if (!user) return json({ success: false, error: "Authentication required" }, 401);

  let body: RequestBody;
  try { body = await req.json(); } catch { return json({ success: false, error: "Invalid JSON" }, 400); }

  if (body.type === "evidence_question") {
    return await answerEvidenceQuestion(client, user.id, body);
  }

  if (body.type === "research") {
    const name = cleanText(body.peptideName || body.peptideId || "Peptide", 100);
    return json({
      success: true,
      content: researchContent(name, typeof body.query === "string" ? body.query : undefined),
      type: body.type,
      provider: "local-privacy-engine",
      timestamp: new Date().toISOString(),
    });
  }

  return json({ success: false, error: "Only sourced research questions are supported" }, 400);
});

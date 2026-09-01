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
  beginner?: BeginnerContext;
};

type BeginnerContext = {
  simpleExplanation?: string;
  discussedFor?: string[];
  safetyFlags?: string[];
  status?: string;
  administration?: string;
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
  "www.niddk.nih.gov",
  "niddk.nih.gov",
  "www.thyroid.org",
  "thyroid.org",
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

function sanitizeBeginnerContext(value: unknown): Required<BeginnerContext> {
  const context = value && typeof value === "object" ? value as BeginnerContext : {};
  const cleanList = (items: unknown, limit: number) => Array.isArray(items)
    ? items.map((item) => cleanText(item, 280)).filter(Boolean).slice(0, limit)
    : [];
  return {
    simpleExplanation: cleanText(context.simpleExplanation, 700),
    discussedFor: cleanList(context.discussedFor, 5),
    safetyFlags: cleanList(context.safetyFlags, 8),
    status: cleanText(context.status, 220),
    administration: cleanText(context.administration, 160),
  };
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

function isThyroidTopic(question: string): boolean {
  return /\b(hashimoto'?s?|autoimmune thyroid|thyroid (?:issues?|problems?|antibod(?:y|ies)|condition|disease)|anti[- ]?tpo|tpo antibod(?:y|ies)|thyroglobulin antibod(?:y|ies)|hypothyroid)\b/i.test(question);
}

function thyroidTopicAnswer(): string {
  return [
    "**Short answer:** There is no peptide I can honestly recommend as a proven treatment for Hashimoto’s. Current thyroid guidance does not list thymosin alpha-1, KPV, BPC-157, MOTS-c, TB-500, retatrutide—or a combination of them—as an established Hashimoto’s treatment. [S1] [S2]",
    "### About the antibody-drop story\nA 30% antibody reduction is a real lab change and it is reasonable to feel encouraged by it. But because several compounds and a nicotine patch were added across a few weeks, that result cannot show which item caused the change—or whether the change came from the stack at all. Antibody levels, weight, thyroid medication, illness, supplements, timing and normal test variation can all move during the same period. A second similar confession makes this a useful question to study; it still does not make the protocol proven or safe to copy.",
    "### What we can say about those compounds\n- **Thymosin alpha-1:** it changes immune signalling, but I could not verify a reliable controlled human trial showing that it treats Hashimoto’s or improves thyroid function.\n- **KPV, BPC-157 and TB-500:** evidence for Hashimoto’s treatment is absent or preclinical; community use is not clinical proof.\n- **MOTS-c:** a 2026 cross-sectional study found an association between Hashimoto’s and lower circulating MOTS-c. Researchers did **not** give people MOTS-c, so the study does not show that taking it lowers antibodies or treats Hashimoto’s. [S3]\n- **Retatrutide:** an investigational obesity medicine, not a Hashimoto’s treatment. Weight and metabolic changes can happen alongside thyroid-lab changes without proving a direct thyroid effect.\n- **Nicotine patch:** not a peptide and not an established thyroid treatment; it has its own cardiovascular, sleep and dependence risks.",
    "### What matters more than chasing the antibody number\nFor someone already diagnosed, the American Thyroid Association says repeating thyroid-antibody levels is generally not needed; **TSH and free T4**, symptoms and medication needs are more useful for follow-up. If hypothyroidism is present, levothyroxine is the standard replacement treatment. [S1] [S2]",
    "### A sensible next step\nTake the full timeline to an endocrinologist: baseline and follow-up TSH, free T4, antibody values, symptoms, weight change, thyroid-medication dose, supplements and when each compound started. Ask: “Did my thyroid function improve, or did only the antibody number move?” Do not stop or alter prescribed thyroid medicine from a confession or app answer. Seek prompt medical advice for a new neck swelling, trouble swallowing, marked palpitations, fainting, severe weakness, or if pregnant or trying to conceive.",
    "The confession is valuable as a **signal for a research question**, not as a dosing template. PepSA can help organise the timeline and questions, but it should not turn this stack into a recommendation.",
  ].join("\n\n");
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

function bullets(items: string[], empty: string): string {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : empty;
}

function studyDoseSummary(sources: EvidenceSource[]): string {
  const withProtocols = sources.filter((source) => source.studiedProtocol);
  if (!withProtocols.length) {
    return "The app does not have a verified human study dose linked for this compound. That means I should not turn catalogue text or community posts into a dosing instruction.";
  }
  return withProtocols.map((source) => {
    const index = sources.indexOf(source) + 1;
    return `- **[S${index}] reported:** ${source.studiedProtocol}`;
  }).join("\n");
}

function sourceResultSummary(sources: EvidenceSource[]): string {
  if (!sources.length) {
    return "There is no app-verified human source linked yet, so there is no honest percentage, timeline or guaranteed result I can give you.";
  }
  return sources.map((source, index) => {
    const findings = (source.findings ?? []).slice(0, 4);
    return `**[S${index + 1}] ${source.title}**\n${bullets(findings, "- No plain-language result has been recorded from this source yet.")}`;
  }).join("\n\n");
}

function localEvidenceAnswer(
  question: string,
  peptideName: string,
  evidenceLabel: string,
  evidenceNote: string,
  sources: EvidenceSource[],
  declined: boolean,
  beginner: Required<BeginnerContext>,
  context?: MeasurementContext,
): string {
  if (isThyroidTopic(question)) return thyroidTopicAnswer().slice(0, 6000);

  const normalized = question.toLowerCase();
  const asksWhat = /\b(what is|what does|how does|function|work|simple|beginner)\b/.test(normalized);
  const asksProtocol = /\b(dose|dosage|route|how often|frequency|titration|protocol|studied dose)\b/.test(normalized);
  const asksResults = /\b(results?|expect|timeline|weight|fat loss|benefit|effective|work|notice|how long)\b/.test(normalized);
  const asksSideEffects = /\b(side effects?|risk|safe|safety|nausea|vomit|constipation|diarrh|headache|adverse)\b/.test(normalized);
  const asksGaps = /\b(gap|limitation|uncertain|weak|quality|evidence)\b/.test(normalized);
  const asksStacking = /\b(stack|stacking|combine|combination|pair|mix|switch|together)\b/.test(normalized);
  const asksStopping = /\b(stop|stopping|come off|regain|rebound|withdraw)\b/.test(normalized);
  const asksLivedConcern = /\b(tired|fatigue|cold|emotion|joy|depress|libido|sex|appetite|eat enough|weak|muscle loss|skin hurts)\b/.test(normalized);
  const asksMeasurement = requestsMeasurementExplanation(question);
  const sections: string[] = [];

  if (declined) {
    sections.push("I can’t choose or recommend a personal dose, schedule, cycle, route, syringe, stack, or treatment. I can show what named sources studied and explain an already-recorded calculation without changing it.");
  }

  const simple = beginner.simpleExplanation || `${peptideName} is listed for research education, but its beginner summary is still being reviewed.`;
  sections.push(`**Short answer:** ${simple}\n\n**Where it stands:** ${beginner.status || evidenceLabel}.`);

  if (asksWhat || (!asksProtocol && !asksResults && !asksSideEffects && !asksStacking && !asksStopping && !asksLivedConcern && !asksMeasurement)) {
    sections.push(`### What people usually discuss it for\n${bullets(beginner.discussedFor, "The app has not yet verified a clear human use for this compound.")}\n\nThese are discussion or catalogue points, not proof that it works for every person.`);
  }

  if (asksMeasurement) {
    sections.push(`### Your recorded calculation, in plain terms\n${measurementSummary(context)}\n\nThose values came from the calculator information already entered. I have not changed the amount or created a new protocol.`);
  }

  if (asksProtocol || declined) {
    sections.push(`### Doses researchers studied\n${studyDoseSummary(sources)}\n\nThat answers “what did the trial use?”, not “what should I take?”. Study participants were screened and monitored, and an investigational trial dose is not an approved dose.`);
  }

  if (asksResults || (!asksWhat && !asksProtocol && !asksSideEffects && !asksStacking && !asksStopping && !asksLivedConcern && !asksMeasurement)) {
    sections.push(`### What results were actually reported\n${sourceResultSummary(sources)}\n\nA group average is not a promise. Results can differ, and early changes are not always reported even when a study has a later endpoint.`);
  }

  if (asksSideEffects || asksLivedConcern || (!asksWhat && !asksProtocol && !asksResults && !asksStacking && !asksStopping && !asksMeasurement)) {
    sections.push(`### Side effects and warning signs\n${bullets(beginner.safetyFlags, "The app does not yet have a verified safety summary for this compound. Unknown does not mean safe.")}\n\nFeeling exhausted, unusually cold, emotionally flat, weak, dizzy, unable to eat or drink enough, or noticeably losing strength is **not something to chase as proof it is working**. Pause the guesswork and contact a qualified clinician. Seek urgent care for fainting, severe or persistent abdominal pain, repeated vomiting, dehydration, chest pain, breathing difficulty, confusion, or thoughts of self-harm.`);
  }

  if (asksStacking) {
    sections.push("### About stacking or switching\nCombining compounds can change side effects, appetite, hydration, blood sugar, heart rate and how clearly you can identify the cause of a problem. Unless a linked source studied the exact combination, the evidence for each ingredient does **not** prove that the stack is effective or safe. I won’t invent a crossover schedule.");
  }

  if (asksStopping) {
    sections.push("### About stopping\nA trial’s on-treatment result does not tell us exactly what will happen to one person after stopping. Appetite and weight can change again when the drug effect ends, while side effects may take time to settle. The safest next step is a clinician-led plan that considers nutrition, hydration, mood, other medicines and the reason for stopping.");
  }

  if (asksGaps || sources.length === 0) {
    sections.push(`### The honest limitation\n**${evidenceLabel}.** ${evidenceNote}\n\nCommunity stories can reveal useful questions—such as low mood, fatigue, food aversion, muscle loss or rebound—but they cannot tell us how common a problem is or prove what caused it.`);
  }

  if (!asksProtocol && sources.length > 0) {
    sections.push(`### Evidence used\n${sourceSummary(sources)}`);
  }

  sections.push("If this is about what is happening to you now, share the compound, timing, symptoms, medicines and relevant medical history with a qualified healthcare professional. You do not need to wait for symptoms to become severe before asking for help.");
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
  const beginner = sanitizeBeginnerContext(body.evidence?.beginner);
  const evidenceLabel = cleanText(body.evidence?.evidenceLabel, 140) || "Evidence classification unavailable";
  const evidenceNote = cleanText(body.evidence?.evidenceNote, 600) || "No app-verified evidence summary is available.";
  const declined = requestsPersonalDose(question);
  const calculatorContext = requestsMeasurementExplanation(question) ? body.measurementContext : undefined;
  let answer = localEvidenceAnswer(question, peptideName, evidenceLabel, evidenceNote, sources, declined, beginner, calculatorContext);
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
    provider: "private-beginner-evidence-engine",
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

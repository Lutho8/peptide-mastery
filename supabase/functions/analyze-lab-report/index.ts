import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Biomarker = {
  name: string;
  name_de?: string;
  short_name?: string;
  value: number;
  unit: string;
  reference_range: string;
  status: "normal" | "high" | "low" | "critical";
  category: string;
  layman_explanation?: string;
  layman_explanation_de?: string;
};

const CATEGORY_BY_NAME: Record<string, string> = {
  leukozyten: "inflammation",
  erythrozyten: "other",
  hämoglobin: "other",
  haemoglobin: "other",
  hämatokrit: "other",
  haematokrit: "other",
  mcv: "other",
  mch: "other",
  mchc: "other",
  thrombozyten: "other",
  neutrophile: "inflammation",
  lymphozyten: "inflammation",
  monozyten: "inflammation",
  eosinophile: "inflammation",
  basophile: "inflammation",
  "gpt (alt)": "liver",
  alt: "liver",
  "g-gt": "liver",
  lipase: "metabolic",
  glukose: "metabolic",
  glucose: "metabolic",
  cholesterin: "lipid",
  cholesterol: "lipid",
  triglycende: "lipid",
  triglyceride: "lipid",
  "hdl-cholesterin": "lipid",
  "ldl-cholesterin": "lipid",
  "ldl/hdl-quotient": "lipid",
  kreatinin: "kidney",
  creatinine: "kidney",
  egfr: "kidney",
  ferritin: "other",
  crp: "inflammation",
  "tsh basal": "thyroid",
  tsh: "thyroid",
};

const EN_NAMES: Record<string, string> = {
  leukozyten: "Leukocytes",
  erythrozyten: "Erythrocytes",
  hämoglobin: "Hemoglobin",
  hämatokrit: "Hematocrit",
  thrombozyten: "Platelets",
  neutrophile: "Neutrophils",
  lymphozyten: "Lymphocytes",
  monozyten: "Monocytes",
  eosinophile: "Eosinophils",
  basophile: "Basophils",
  "gpt (alt)": "ALT",
  "g-gt": "GGT",
  glukose: "Glucose",
  cholesterin: "Total cholesterol",
  triglycende: "Triglycerides",
  "hdl-cholesterin": "HDL cholesterol",
  "ldl-cholesterin": "LDL cholesterol",
  "ldl/hdl-quotient": "LDL/HDL ratio",
  kreatinin: "Creatinine",
  "egfr nach ckd-epi-formel": "eGFR",
  ferritin: "Ferritin",
  "crp (hochsensitiv)": "High-sensitivity CRP",
  "tsh basal": "TSH",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function bytesToBase64(buf: Uint8Array) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    bin += String.fromCharCode(...buf.slice(i, i + chunk));
  }
  return btoa(bin);
}

function normalizeText(value: string) {
  return value
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/[▲▼<>]/g, "").replace(/,/g, ".").trim();
  const m = cleaned.match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function statusFrom(value: number, rawValue: string, reference: string): Biomarker["status"] {
  if (/▲|hoch|high/i.test(rawValue)) return "high";
  if (/▼|niedrig|low/i.test(rawValue)) return "low";
  const ref = reference.replace(/,/g, ".");
  const range = ref.match(/(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/);
  if (range) {
    const low = Number(range[1]);
    const high = Number(range[2]);
    if (value < low) return "low";
    if (value > high) return "high";
  }
  const upper = ref.match(/(?:bis|<=?|<)\s*(-?\d+(?:\.\d+)?)/i);
  if (upper && value > Number(upper[1])) return "high";
  const lower = ref.match(/(?:ab|>=?|>)\s*(-?\d+(?:\.\d+)?)/i);
  if (lower && value < Number(lower[1])) return "low";
  return "normal";
}

function categoryFor(name: string) {
  const key = name.toLowerCase().trim();
  const found = Object.entries(CATEGORY_BY_NAME).find(([needle]) => key.includes(needle));
  return found?.[1] || "other";
}

function englishName(name: string) {
  const key = name.toLowerCase().trim();
  const found = Object.entries(EN_NAMES).find(([needle]) => key.includes(needle));
  return found?.[1] || name;
}

function extractDateFromText(text: string): string | null {
  const m = text.match(/(?:Entnahme|ENDBEFUND vom|vom)\D*(\d{2})\.(\d{2})\.(\d{4})/i);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function detectLanguage(text: string): "en" | "de" {
  return /\b(Untersuchung|Referenzbereich|Entnahme|Blutbild|Leukozyten|Cholesterin|Kreatinin|Geschlecht)\b/i.test(text) ? "de" : "en";
}

function biomarkerExplanation(bm: Biomarker, lang: "en" | "de") {
  if (lang === "de") {
    if (bm.status === "high") return `${bm.name_de || bm.name} liegt über dem Referenzbereich und sollte im Kontext der gesamten Untersuchung bewertet werden.`;
    if (bm.status === "low") return `${bm.name_de || bm.name} liegt unter dem Referenzbereich und sollte beobachtet oder ärztlich eingeordnet werden.`;
    return `${bm.name_de || bm.name} liegt innerhalb des angegebenen Referenzbereichs.`;
  }
  if (bm.status === "high") return `${bm.name} is above the reference range and should be interpreted in context.`;
  if (bm.status === "low") return `${bm.name} is below the reference range and may be worth monitoring.`;
  return `${bm.name} is within the supplied reference range.`;
}

function parseBiomarkersFromText(text: string): Biomarker[] {
  const rows = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const out: Biomarker[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const cells = row
      .split(/\s{2,}|\t+|\|/)
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length >= 4) {
      const valueIndex = cells.findIndex((c, i) => i > 0 && /^[<>]?\s*\d+[.,]?\d*\s*[▲▼]?$/.test(c));
      if (valueIndex > 0) {
        const name = cells.slice(0, valueIndex).join(" ").replace(/\s+[ES]$/, "").trim();
        const rawValue = cells[valueIndex];
        const value = parseNumber(rawValue);
        const reference = cells[valueIndex + 1] || "";
        const unit = cells[valueIndex + 2] || "";
        if (value !== null && name.length > 2 && !/^(normal|grenzwertig|erhöht|risiko|referenz|nach esc|kof)$/i.test(name)) {
          const key = `${name.toLowerCase()}-${value}-${unit}`;
          if (!seen.has(key)) {
            const bm: Biomarker = {
              name: englishName(name),
              name_de: name,
              short_name: name.match(/\(([^)]+)\)/)?.[1] || name.split(/\s+/)[0],
              value,
              unit,
              reference_range: reference,
              status: statusFrom(value, rawValue, reference),
              category: categoryFor(name),
            };
            bm.layman_explanation = biomarkerExplanation(bm, "en");
            bm.layman_explanation_de = biomarkerExplanation(bm, "de");
            out.push(bm);
            seen.add(key);
          }
        }
      }
    }

    const loose = row.match(/^([A-Za-zÄÖÜäöüß().\/\-\s]{3,}?)\s+[ES]?\s*([<>]?\d+[.,]?\d*\s*[▲▼]?)\s+((?:bis|ab|<|>|\d)[^\s]*(?:\s*-\s*\d+[.,]?\d*)?)\s+([A-Za-zµμ%\/^0-9,.²-]+)/);
    if (loose) {
      const name = loose[1].trim();
      const rawValue = loose[2];
      const value = parseNumber(rawValue);
      if (value === null) continue;
      const key = `${name.toLowerCase()}-${value}-${loose[4]}`;
      if (seen.has(key)) continue;
      const bm: Biomarker = {
        name: englishName(name),
        name_de: name,
        short_name: name.match(/\(([^)]+)\)/)?.[1] || name.split(/\s+/)[0],
        value,
        unit: loose[4],
        reference_range: loose[3],
        status: statusFrom(value, rawValue, loose[3]),
        category: categoryFor(name),
      };
      bm.layman_explanation = biomarkerExplanation(bm, "en");
      bm.layman_explanation_de = biomarkerExplanation(bm, "de");
      out.push(bm);
      seen.add(key);
    }
  }

  return out.slice(0, 48);
}

function buildFallbackResult(text: string, scanType: string, detectedLanguage?: "en" | "de") {
  const biomarkers = parseBiomarkersFromText(text);
  const abnormal = biomarkers.filter((b) => b.status !== "normal");
  const lang = detectedLanguage || detectLanguage(text);
  const reportDate = extractDateFromText(text);
  const score = biomarkers.length
    ? Math.max(55, Math.min(95, 92 - abnormal.length * 5))
    : null;
  const abnormalNames = abnormal.slice(0, 5).map((b) => b.name).join(", ");
  const abnormalNamesDe = abnormal.slice(0, 5).map((b) => b.name_de || b.name).join(", ");

  return {
    summary: biomarkers.length
      ? `We extracted ${biomarkers.length} biomarkers from this lab report. ${abnormal.length ? `Out-of-range markers include ${abnormalNames}.` : "Most extracted markers sit inside their supplied reference ranges."}`
      : "The upload was processed, but no reliable biomarker rows could be extracted automatically.",
    summary_de: biomarkers.length
      ? `Aus diesem Laborbericht wurden ${biomarkers.length} Biomarker extrahiert. ${abnormal.length ? `Außerhalb des Referenzbereichs liegen unter anderem ${abnormalNamesDe}.` : "Die meisten erkannten Werte liegen innerhalb der angegebenen Referenzbereiche."}`
      : "Der Upload wurde verarbeitet, aber es konnten keine zuverlässigen Biomarker-Zeilen automatisch extrahiert werden.",
    report_date: reportDate,
    detected_language: lang,
    health_score: score,
    biomarkers,
    insights: [
      biomarkers.length ? `${biomarkers.length} biomarker rows were extracted from the report.` : "No structured biomarker rows were extracted.",
      abnormal.length ? `${abnormal.length} marker(s) are outside the supplied reference ranges.` : "No extracted marker was clearly outside range.",
      "Use this as an educational review and confirm clinical interpretation with a qualified healthcare professional.",
    ],
    insights_de: [
      biomarkers.length ? `${biomarkers.length} Biomarker-Zeilen wurden aus dem Bericht extrahiert.` : "Es wurden keine strukturierten Biomarker-Zeilen extrahiert.",
      abnormal.length ? `${abnormal.length} Wert(e) liegen außerhalb der angegebenen Referenzbereiche.` : "Kein extrahierter Wert lag eindeutig außerhalb des Referenzbereichs.",
      "Nutzen Sie dies als edukative Übersicht und klären Sie die klinische Einordnung mit qualifiziertem Fachpersonal.",
    ],
    protocol: {
      stack_summary: "Protocol generation used the extracted biomarker pattern and remains research-only.",
      stack: [],
      supplements: [],
      nutrition: [],
      exercise: [],
      stress: [],
      environment: [],
      retest: [{ marker: "Key abnormal markers", when: scanType === "deep" ? "8-12 weeks" : "8 weeks", why: "Confirm whether the pattern is improving." }],
    },
    recommended_stack_peptides: [],
  };
}

async function extractTextWithGateway(base64: string, fileName: string, apiKey: string): Promise<string | null> {
  const prompt = "Extract all readable text and lab table rows from this PDF. Return plain text only, preserving biomarker rows as: name | result | reference range | unit. Do not summarize.";
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "file", file: { filename: fileName, file_data: `data:application/pdf;base64,${base64}` } },
        ],
      }],
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) return null;
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim().length > 100 ? normalizeText(content) : null;
}

function parseJsonContent(content: string) {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/) || [null, content];
  return JSON.parse(jsonMatch[1]!.trim());
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const {
      reportId,
      imageBase64: incomingBase64,
      fileName,
      mimeType,
      languageHint,
      scanType = "baseline",
      age,
      sex,
      goals = [],
      peptideHistoryUsed,
      peptideHistoryNotes,
    } = body || {};

    if (!reportId) {
      return jsonResponse({ ok: false, code: "BAD_REQUEST", retryable: false, message: "Missing report id." });
    }

    const { data: reportRow, error: reportErr } = await supabase
      .from("lab_reports")
      .select("file_url, file_name")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single();
    if (reportErr || !reportRow) {
      return jsonResponse({ ok: false, code: "REPORT_NOT_FOUND", retryable: false, message: "Couldn't find the uploaded report." });
    }

    let base64: string;
    let fileBytes: Uint8Array | null = null;
    const effectiveFileName = fileName || reportRow.file_name || "report.pdf";
    if (incomingBase64) {
      base64 = incomingBase64;
      fileBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    } else {
      const downloadStart = Date.now();
      const { data: blob, error: dlErr } = await supabase.storage.from("lab-reports").download(reportRow.file_url);
      if (dlErr || !blob) {
        console.error("[analyze-lab-report] storage download failed", { dlErr });
        return jsonResponse({ ok: false, code: "STORAGE_DOWNLOAD_FAILED", retryable: true, message: "Couldn't load your uploaded file. Please retry." });
      }
      fileBytes = new Uint8Array(await blob.arrayBuffer());
      const head = new TextDecoder().decode(fileBytes.slice(0, Math.min(fileBytes.length, 4096)));
      if (head.includes("/Encrypt")) {
        return jsonResponse({ ok: false, code: "ENCRYPTED_PDF", retryable: false, message: "This PDF is password-protected. Please re-export it without encryption." });
      }
      base64 = bytesToBase64(fileBytes);
      console.log("[analyze-lab-report] downloaded from storage", { bytes: fileBytes.length, durationMs: Date.now() - downloadStart });
    }

    const lowerName = effectiveFileName.toLowerCase();
    let resolvedMime = mimeType as string | undefined;
    try {
      const headBytes = fileBytes || Uint8Array.from(atob(base64.slice(0, 64)), (c) => c.charCodeAt(0));
      const asAscii = new TextDecoder().decode(headBytes.slice(0, 32));
      if (asAscii.startsWith("%PDF")) resolvedMime = "application/pdf";
      else if (headBytes[0] === 0xff && headBytes[1] === 0xd8 && headBytes[2] === 0xff) resolvedMime = "image/jpeg";
      else if (headBytes[0] === 0x89 && asAscii.slice(1, 4) === "PNG") resolvedMime = "image/png";
      else if (asAscii.startsWith("RIFF") && asAscii.slice(8, 12) === "WEBP") resolvedMime = "image/webp";
      else if (asAscii.slice(4, 12).includes("ftypheic") || asAscii.slice(4, 12).includes("ftypheix") || asAscii.slice(4, 12).includes("ftypmif1")) resolvedMime = "image/heic";
      else if (!resolvedMime) {
        if (lowerName.endsWith(".pdf")) resolvedMime = "application/pdf";
        else if (lowerName.endsWith(".png")) resolvedMime = "image/png";
        else if (lowerName.endsWith(".webp")) resolvedMime = "image/webp";
        else if (lowerName.endsWith(".heic") || lowerName.endsWith(".heif")) resolvedMime = "image/heic";
        else resolvedMime = "image/jpeg";
      }
    } catch { /* fallback below */ }

    const ALLOWED_MIMES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
    if (!ALLOWED_MIMES.has(resolvedMime!)) {
      return jsonResponse({ ok: false, code: "UNSUPPORTED_CONTENT", retryable: false, message: "This file doesn't look like a valid PDF or image. Please re-export your lab report as a PDF, JPG, or PNG." });
    }

    await supabase
      .from("lab_reports")
      .update({
        status: "processing",
        scan_type: scanType === "deep" ? "deep" : "baseline",
        patient_age: age ? Number(age) : null,
        patient_sex: sex || null,
        goals: Array.isArray(goals) ? goals : [],
        peptide_history_used: typeof peptideHistoryUsed === "boolean" ? peptideHistoryUsed : null,
        peptide_history_notes: peptideHistoryNotes || null,
      })
      .eq("id", reportId)
      .eq("user_id", user.id);

    const isDeep = scanType === "deep";
    let extractedText: string | null = null;
    let deterministicFallback: ReturnType<typeof buildFallbackResult> | null = null;

    if (resolvedMime === "application/pdf") {
      try {
        const textStart = Date.now();
        extractedText = await extractTextWithGateway(base64, effectiveFileName, LOVABLE_API_KEY);
        if (extractedText) {
          deterministicFallback = buildFallbackResult(extractedText, scanType, languageHint === "de" || languageHint === "en" ? languageHint : undefined);
          console.log("[analyze-lab-report] extracted pdf text", { chars: extractedText.length, biomarkers: deterministicFallback.biomarkers.length, durationMs: Date.now() - textStart });
        }
      } catch (e) {
        console.warn("[analyze-lab-report] pdf text extraction fallback failed", { error: String(e) });
      }
    }

    const systemPrompt = `You analyze lab reports for Peptide South Africa. Return ONLY valid JSON. Lab reports may be English or German; always output English and German fields. Dosing units must be mg, IU, or units only.

JSON shape: {"summary":"English overview","summary_de":"German overview","report_date":"YYYY-MM-DD or null","detected_language":"en|de","health_score":0-100,"biomarkers":[{"name":"English name","name_de":"German name","short_name":"abbr","value":1.2,"unit":"unit","reference_range":"range","status":"normal|high|low|critical","category":"hormone|liver|kidney|lipid|metabolic|thyroid|inflammation|other","layman_explanation":"English","layman_explanation_de":"German"}],"insights":["English findings"],"insights_de":["German findings"],"protocol":{"stack_summary":"research-only summary","stack":[],"supplements":[],"nutrition":[],"exercise":[],"stress":[],"environment":[],"retest":[]},"recommended_stack_peptides":[]}

Interpret abnormal values conservatively. Include all readable biomarkers. If text extraction already supplied biomarkers, preserve them and improve names/explanations without dropping rows.`;

    const userText = [
      `Analyze this lab report (${effectiveFileName}).`,
      `Scan type: ${isDeep ? "Deep Decode" : "Baseline"}.`,
      age ? `Patient age: ${age}.` : "",
      sex && sex !== "na" ? `Patient sex: ${sex}.` : "",
      Array.isArray(goals) && goals.length ? `Goals: ${goals.join(", ")}.` : "",
      typeof peptideHistoryUsed === "boolean" ? (peptideHistoryUsed ? `Prior peptide use: yes${peptideHistoryNotes ? ` — ${peptideHistoryNotes}` : ""}.` : "Prior peptide use: no.") : "",
      languageHint === "en" || languageHint === "de" ? `Document language confirmed: ${languageHint === "de" ? "German" : "English"}.` : "",
      extractedText
        ? `Extracted lab text follows. Use it as the source of truth and return structured JSON.\n\n${extractedText.slice(0, 14000)}`
        : "No text extraction was available; read the attached file/image and return structured JSON.",
    ].filter(Boolean).join("\n");

    const aiStart = Date.now();
    let parsed: any | null = null;
    let response: Response | null = null;
    try {
      const content = extractedText
        ? [{ type: "text", text: userText }]
        : [
          { type: "text", text: userText },
          resolvedMime === "application/pdf"
            ? { type: "file", file: { filename: effectiveFileName, file_data: `data:application/pdf;base64,${base64}` } }
            : { type: "image_url", image_url: { url: `data:${resolvedMime};base64,${base64}` } },
        ];

      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: extractedText ? "google/gemini-3-flash-preview" : "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content },
          ],
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(extractedText ? 35_000 : 55_000),
      });
    } catch (e) {
      const isTimeout = (e as Error)?.name === "TimeoutError" || /timeout|abort/i.test(String(e));
      console.error("[analyze-lab-report] AI call failed", { durationMs: Date.now() - aiStart, error: String(e), fallback: !!deterministicFallback });
      if (!deterministicFallback || deterministicFallback.biomarkers.length === 0) {
        await supabase.from("lab_reports").update({ status: "failed", ai_summary: isTimeout ? "AI scan timed out." : "AI scan failed." }).eq("id", reportId);
        return jsonResponse({
          ok: false,
          code: isTimeout ? "TIMEOUT" : "AI_NETWORK_ERROR",
          retryable: true,
          message: isTimeout ? "Scan timed out. This file may be scanned or complex; retry, upload a clearer export, or enter values manually." : "Couldn't reach the AI service. Check your connection and retry.",
        });
      }
      parsed = deterministicFallback;
    }

    if (!parsed && response) {
      console.log("[analyze-lab-report] AI ok", { status: response.status, durationMs: Date.now() - aiStart, fallback: !!deterministicFallback });
      if (!response.ok) {
        const errText = await response.text();
        console.error("[analyze-lab-report] AI non-2xx", { status: response.status, body: errText.slice(0, 500), fallback: !!deterministicFallback });
        if (deterministicFallback && deterministicFallback.biomarkers.length > 0) {
          parsed = deterministicFallback;
        } else if (response.status === 429) {
          await supabase.from("lab_reports").update({ status: "failed", ai_summary: "Rate limited. Please try again in a moment." }).eq("id", reportId);
          return jsonResponse({ ok: false, code: "RATE_LIMITED", retryable: true, message: "Too many scans right now. Wait 30 seconds and retry." });
        } else if (response.status === 402) {
          await supabase.from("lab_reports").update({ status: "failed", ai_summary: "AI credits exhausted." }).eq("id", reportId);
          return jsonResponse({ ok: false, code: "CREDITS_EXHAUSTED", retryable: false, message: "Scan credits exhausted. Try again later or use manual entry." });
        } else {
          return jsonResponse({ ok: false, code: "AI_GATEWAY_ERROR", retryable: true, message: `AI gateway error (${response.status}). Retry in a moment.` });
        }
      } else {
        const aiData = await response.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        try {
          parsed = parseJsonContent(content);
        } catch (e) {
          console.warn("[analyze-lab-report] AI JSON parse failed", { error: String(e), fallback: !!deterministicFallback });
          parsed = deterministicFallback || buildFallbackResult(content || extractedText || "", scanType);
        }
      }
    }

    if (!parsed) parsed = deterministicFallback || buildFallbackResult(extractedText || "", scanType);

    const fallbackForMerge = deterministicFallback;
    if ((!Array.isArray(parsed.biomarkers) || parsed.biomarkers.length === 0) && fallbackForMerge?.biomarkers.length) {
      parsed.biomarkers = fallbackForMerge.biomarkers;
    }
    if (!parsed.summary && fallbackForMerge?.summary) parsed.summary = fallbackForMerge.summary;
    if (!parsed.summary_de && fallbackForMerge?.summary_de) parsed.summary_de = fallbackForMerge.summary_de;
    if (!parsed.report_date && fallbackForMerge?.report_date) parsed.report_date = fallbackForMerge.report_date;

    let insightsArr: string[] = [];
    if (Array.isArray(parsed.insights)) insightsArr = parsed.insights.map((s: any) => String(s));
    else if (typeof parsed.insights === "string") insightsArr = parsed.insights.split(/\n+/).map((s: string) => s.trim()).filter(Boolean);
    if (!insightsArr.length && fallbackForMerge?.insights) insightsArr = fallbackForMerge.insights;

    let insightsDeArr: string[] = [];
    if (Array.isArray(parsed.insights_de)) insightsDeArr = parsed.insights_de.map((s: any) => String(s));
    else if (typeof parsed.insights_de === "string") insightsDeArr = parsed.insights_de.split(/\n+/).map((s: string) => s.trim()).filter(Boolean);
    if (!insightsDeArr.length && fallbackForMerge?.insights_de) insightsDeArr = fallbackForMerge.insights_de;

    const healthScore = typeof parsed.health_score === "number" && parsed.health_score >= 0 && parsed.health_score <= 100 ? Math.round(parsed.health_score) : (fallbackForMerge?.health_score ?? null);
    const detectedLang = parsed.detected_language === "de" || fallbackForMerge?.detected_language === "de" ? "de" : "en";
    const biomarkers = Array.isArray(parsed.biomarkers) ? parsed.biomarkers : [];
    const protocol = parsed.protocol || fallbackForMerge?.protocol || { stack: [], supplements: [], nutrition: [], exercise: [], stress: [], environment: [], retest: [] };

    await supabase
      .from("lab_reports")
      .update({
        status: "completed",
        ai_summary: parsed.summary || null,
        ai_summary_de: parsed.summary_de || null,
        extracted_biomarkers: biomarkers,
        ai_insights: insightsArr.join("\n"),
        ai_insights_de: insightsDeArr.join("\n"),
        detected_language: detectedLang,
        report_date: parsed.report_date || null,
        health_score: healthScore,
        protocol,
        recommended_stack_peptides: Array.isArray(parsed.recommended_stack_peptides) ? parsed.recommended_stack_peptides : [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("user_id", user.id);

    return jsonResponse({ success: true, data: { ...parsed, biomarkers, insights: insightsArr, insights_de: insightsDeArr, detected_language: detectedLang, health_score: healthScore, protocol } });
  } catch (e) {
    console.error("[analyze-lab-report] unhandled error:", e);
    return jsonResponse({ ok: false, code: "INTERNAL_ERROR", retryable: true, message: "Unexpected error. Please retry." });
  }
});
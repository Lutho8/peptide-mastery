import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { chatCompletion, requireApiKey } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UserProfile {
  weight?: number;
  bodyFat?: number;
  goals?: string[];
  currentStack?: string[];
  experienceLevel?: string;
}

interface AIRequest {
  type: "research" | "recommend" | "optimize";
  peptideId?: string;
  peptideName?: string;
  userProfile?: UserProfile;
  currentStack?: string[];
  query?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    requireApiKey();

    const { type, peptideId, peptideName, userProfile, currentStack, query }: AIRequest = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "research") {
      systemPrompt = `You are an expert peptide research analyst with deep knowledge of biochemistry, pharmacology, and clinical research. Your role is to provide accurate, evidence-based information about peptides for research and educational purposes.

IMPORTANT DISCLAIMER: Always remind users that peptides are for research purposes only and are not FDA-approved for human consumption. Any information provided is for educational purposes.

When discussing peptide research:
- Cite relevant studies and mechanisms of action
- Explain molecular pathways and receptor interactions
- Discuss clinical trial findings where available
- Note potential synergies with other compounds
- Highlight current research directions and gaps

Be scientific, precise, and thorough. Use proper terminology while remaining accessible.`;

      userPrompt = `Provide the latest research insights and findings about ${peptideName || peptideId}. Include:

1. **Recent Research Developments** - Any new studies or findings in the past 2 years
2. **Mechanism of Action** - Detailed explanation of how it works at the molecular level
3. **Clinical Evidence** - Summary of human or animal studies
4. **Optimal Protocols** - Research-backed dosing and timing considerations
5. **Synergies & Interactions** - How it may interact with other peptides or compounds
6. **Safety Considerations** - Known contraindications and precautions from research

${query ? `Additional context: ${query}` : ""}`;

    } else if (type === "recommend") {
      systemPrompt = `You are an AI peptide protocol consultant with expertise in biohacking, sports science, and longevity research. You analyze user profiles and goals to suggest optimal peptide protocols for research and educational purposes.

IMPORTANT DISCLAIMER: All recommendations are for educational/research purposes only. Peptides are not FDA-approved for human consumption. Users should consult healthcare professionals before any protocol.

Consider when making recommendations:
- User's current body composition and goals
- Experience level with peptides
- Potential synergies between compounds
- Proper cycling and timing protocols
- Safety margins and risk mitigation

CRITICAL: Begin your response by acknowledging the user's selected goals verbatim (e.g., "Based on your goals of Fat Loss and Recovery..."), then explain how each recommendation maps directly to those specific goals. Reference the goals by name throughout your response.`;

      const profileContext = userProfile ? `
User Profile:
- Weight: ${userProfile.weight || "Not specified"} kg
- Body Fat: ${userProfile.bodyFat || "Not specified"}%
- Goals: ${userProfile.goals?.join(", ") || "General wellness"}
- Experience Level: ${userProfile.experienceLevel || "Beginner"}
- Current Stack: ${userProfile.currentStack?.join(", ") || "None"}
` : "No profile data available";

      userPrompt = `Based on the following user profile, recommend optimal peptides for their goals:

${profileContext}

Provide:
1. **Top 3 Recommended Peptides** - Best matches for their profile and goals
2. **Rationale** - Why each peptide suits their needs
3. **Suggested Protocol** - Dosing, timing, and cycle length
4. **Stack Synergies** - How recommendations work together
5. **Expected Timeline** - Realistic expectations by week
6. **Important Precautions** - Safety considerations for their profile`;

    } else if (type === "optimize") {
      systemPrompt = `You are an advanced peptide stack optimization AI. You analyze current protocols and suggest improvements based on synergy data, timing optimization, and user goals.

IMPORTANT DISCLAIMER: All suggestions are for educational/research purposes only. Peptides are not FDA-approved for human consumption.

When optimizing stacks:
- Identify potential synergies and conflicts
- Suggest optimal timing for each compound
- Consider half-lives and receptor interactions
- Balance effectiveness with safety margins
- Account for individual response patterns

CRITICAL: Reference the user's stated goals throughout your analysis. For each suggestion or change you propose, explicitly name which goal (e.g., Fat Loss, Recovery, Longevity) it advances. Open by restating the user's goals verbatim so they know the analysis is tailored to them.`;

      const stackContext = currentStack?.length 
        ? `Current Stack: ${currentStack.join(", ")}`
        : "No current stack specified";

      const profileContext = userProfile ? `
User Profile:
- Weight: ${userProfile.weight || "Not specified"} kg
- Body Fat: ${userProfile.bodyFat || "Not specified"}%
- Goals: ${userProfile.goals?.join(", ") || "General optimization"}
- Experience: ${userProfile.experienceLevel || "Intermediate"}
` : "";

      userPrompt = `Analyze and optimize this peptide protocol:

${stackContext}
${profileContext}

Provide:
1. **Stack Analysis** - How current peptides work together
2. **Synergy Score** - Rate the current stack compatibility (1-10)
3. **Timing Optimization** - Best times to administer each compound
4. **Suggested Additions** - Peptides that would enhance the stack
5. **Potential Conflicts** - Any compounds that may not work well together
6. **Optimized Protocol** - A refined daily/weekly schedule

${query ? `Specific concern: ${query}` : ""}`;
    }

    const response = await chatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI provider error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return new Response(
      JSON.stringify({ 
        success: true, 
        content,
        type,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Peptide AI agent error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

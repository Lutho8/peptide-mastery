import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { peptides } from "../../../data/peptides";
import { goalToCategories, goalLabels } from "../../../data/goalMap";

const goalIds = Object.keys(goalToCategories) as [string, ...string[]];

export default defineTool({
  name: "recommend_peptides_for_goal",
  title: "Recommend peptides for a goal",
  description:
    "Return peptides from the Peptide South Africa catalog that map to a user goal (fat-loss, muscle-gain, recovery, longevity, cognitive, energy, sleep, metabolic), sorted by longevity score.",
  inputSchema: {
    goal: z.enum(goalIds).describe("User goal id."),
    limit: z.number().int().min(1).max(20).optional().describe("Max results (default 8)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ goal, limit }) => {
    const cats = new Set(goalToCategories[goal] ?? []);
    const matches = peptides
      .filter((p) => cats.has(p.category))
      .sort((a, b) => (b.longevityScore ?? 0) - (a.longevityScore ?? 0))
      .slice(0, limit ?? 8)
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        longevityScore: p.longevityScore,
        mechanism: p.mechanism,
        dosingBeginner: p.dosing.beginner,
      }));
    return {
      content: [
        {
          type: "text",
          text: `Top peptides for goal "${goalLabels[goal] ?? goal}":\n\n${matches
            .map((m) => `• ${m.name} (${m.id}) — score ${m.longevityScore}`)
            .join("\n")}\n\nResearch use only. Not medical advice.`,
        },
      ],
      structuredContent: { goal, peptides: matches },
    };
  },
});

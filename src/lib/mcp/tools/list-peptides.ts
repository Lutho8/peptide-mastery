import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { peptides, categoryConfig, type PeptideCategory } from "../../../data/peptides";

const categoryValues = Object.keys(categoryConfig) as [PeptideCategory, ...PeptideCategory[]];

export default defineTool({
  name: "list_peptides",
  title: "List peptides",
  description:
    "Browse the Peptide South Africa peptide research catalog. Optionally filter by category or search term (matches name, short name, or mechanism).",
  inputSchema: {
    category: z
      .enum(categoryValues)
      .optional()
      .describe("Filter by peptide category (e.g. 'weight-loss', 'healing', 'cognitive')."),
    search: z.string().trim().min(1).optional().describe("Free-text search across name, short name and mechanism."),
    limit: z.number().int().min(1).max(100).optional().describe("Max results to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ category, search, limit }) => {
    const q = search?.toLowerCase();
    const filtered = peptides.filter((p) => {
      if (category && p.category !== category) return false;
      if (q) {
        const hay = `${p.name} ${p.shortName} ${p.mechanism}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const capped = filtered.slice(0, limit ?? 25);
    const rows = capped.map((p) => ({
      id: p.id,
      name: p.name,
      shortName: p.shortName,
      category: p.category,
      halfLife: p.halfLife,
      longevityScore: p.longevityScore,
      mechanism: p.mechanism,
    }));
    return {
      content: [
        {
          type: "text",
          text: `Found ${filtered.length} peptides${
            filtered.length > capped.length ? ` (showing first ${capped.length})` : ""
          }.\n\n${rows.map((r) => `• ${r.name} (${r.id}) — ${r.category}`).join("\n")}`,
        },
      ],
      structuredContent: { total: filtered.length, returned: capped.length, peptides: rows },
    };
  },
});

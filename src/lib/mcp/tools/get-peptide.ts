import { defineTool } from "../types";
import { z } from "zod";
import { peptides } from "../../../data/peptides";

export default defineTool({
  name: "get_peptide",
  title: "Get peptide details",
  description:
    "Return the full research profile for a single peptide: mechanism, benefits, dosing by experience level, expected results, risks and references.",
  inputSchema: {
    id: z
      .string()
      .trim()
      .min(1)
      .describe("Peptide id (e.g. 'bpc157', 'ipamorelin', 'retatrutide'). Use list_peptides to discover ids."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ id }) => {
    const needle = id.toLowerCase().replace(/[-_\s]/g, "");
    const peptide = peptides.find(
      (p) =>
        p.id.toLowerCase() === id.toLowerCase() ||
        p.id.toLowerCase().replace(/[-_\s]/g, "") === needle ||
        p.shortName.toLowerCase() === id.toLowerCase() ||
        p.name.toLowerCase() === id.toLowerCase(),
    );
    if (!peptide) {
      return {
        content: [{ type: "text", text: `No peptide found for id "${id}". Try list_peptides to browse.` }],
        isError: true,
      };
    }
    const summary = [
      `${peptide.name} (${peptide.shortName}) — ${peptide.category}`,
      peptide.halfLife ? `Half-life: ${peptide.halfLife}` : null,
      `Mechanism: ${peptide.mechanism}`,
      `Administration: ${peptide.administration}`,
      `Frequency: ${peptide.frequency}`,
      "",
      "Dosing:",
      `  Beginner: ${peptide.dosing.beginner}`,
      `  Intermediate: ${peptide.dosing.intermediate}`,
      `  Advanced: ${peptide.dosing.advanced}`,
      `  Athlete: ${peptide.dosing.athlete}`,
      "",
      `Benefits: ${peptide.benefits.join("; ")}`,
      `Risks: ${peptide.risks.join("; ")}`,
      "",
      "Research use only. Not FDA approved for human consumption.",
    ]
      .filter(Boolean)
      .join("\n");
    return {
      content: [{ type: "text", text: summary }],
      structuredContent: { peptide },
    };
  },
});

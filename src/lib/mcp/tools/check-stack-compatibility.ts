import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { stackingInteractions } from "../../../data/stackingMatrix";

export default defineTool({
  name: "check_stack_compatibility",
  title: "Check peptide stack compatibility",
  description:
    "Check the compatibility (synergistic, compatible, caution, avoid) between two peptides using the Peptide South Africa stacking matrix.",
  inputSchema: {
    peptideId1: z.string().trim().min(1).describe("First peptide id (e.g. 'bpc157')."),
    peptideId2: z.string().trim().min(1).describe("Second peptide id (e.g. 'tb500')."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ peptideId1, peptideId2 }) => {
    const a = peptideId1.toLowerCase();
    const b = peptideId2.toLowerCase();
    const match = stackingInteractions.find(
      (i) =>
        (i.peptideId1.toLowerCase() === a && i.peptideId2.toLowerCase() === b) ||
        (i.peptideId1.toLowerCase() === b && i.peptideId2.toLowerCase() === a),
    );
    if (!match) {
      return {
        content: [
          {
            type: "text",
            text: `No documented interaction between ${peptideId1} and ${peptideId2}. Absence of data is not a safety guarantee — consult a qualified clinician.`,
          },
        ],
        structuredContent: { found: false },
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `${peptideId1} + ${peptideId2}: ${match.compatibility.toUpperCase()}\n\n${match.notes}${
            match.timing ? `\n\nTiming: ${match.timing}` : ""
          }`,
        },
      ],
      structuredContent: { found: true, interaction: match },
    };
  },
});

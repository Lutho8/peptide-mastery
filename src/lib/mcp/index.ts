import { defineMcp } from "@lovable.dev/mcp-js";
import listPeptides from "./tools/list-peptides";
import getPeptide from "./tools/get-peptide";
import checkStackCompatibility from "./tools/check-stack-compatibility";
import recommendForGoal from "./tools/recommend-for-goal";

export default defineMcp({
  name: "peptide-south-africa-mcp",
  title: "Peptide South Africa — Peptide Research",
  version: "0.1.0",
  instructions:
    "Tools for exploring the Peptide South Africa peptide research catalog: browse peptides, get full research profiles, check stacking compatibility, and get goal-based recommendations. All information is for research and educational purposes only — peptides are not FDA approved for human consumption.",
  tools: [listPeptides, getPeptide, checkStackCompatibility, recommendForGoal],
});

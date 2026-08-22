// Build-time SSR entry (used only by scripts/prerender.mjs).
//
// The live app lazy-loads its routes, which is great for the client but means
// renderToString would only capture Suspense spinners. So for prerendering we
// import the SEO-critical pages EAGERLY here and render them under StaticRouter,
// producing real HTML + JSON-LD for crawlers. The client bundle is unaffected
// and still hydrates via the normal lazy-loaded App.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";

// Eager imports — only the public, SEO-relevant routes.
import Index from "./pages/Index";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Disclaimer from "./pages/Disclaimer";
import TermsOfService from "./pages/TermsOfService";
import COAVerification from "./pages/COAVerification";
import LiveQnA from "./pages/LiveQnA";
import PeptideEntityPage from "./pages/PeptideEntityPage";
import CategoryHubPage from "./pages/CategoryHubPage";
import GuidePage from "./pages/GuidePage";
import BlogIndexPage from "./pages/BlogIndexPage";
import BlogPostPage from "./pages/BlogPostPage";
import FAQPage from "./pages/FAQPage";
import WeightLossPeptidesSA from "./pages/goals/WeightLossPeptidesSA";
import HealingPeptidesSA from "./pages/goals/HealingPeptidesSA";
import AntiAgingPeptidesSA from "./pages/goals/AntiAgingPeptidesSA";
import CognitivePeptidesSA from "./pages/goals/CognitivePeptidesSA";
import GrowthHormonePeptidesSA from "./pages/goals/GrowthHormonePeptidesSA";
import LibidoPeptidesSA from "./pages/goals/LibidoPeptidesSA";
import Bpc157VsTb500 from "./pages/comparisons/Bpc157VsTb500";
import PeptidesForWomenSA from "./pages/goals/PeptidesForWomenSA";
import PeptidesDiabetesFattyLiver from "./pages/goals/PeptidesDiabetesFattyLiver";
import PeptideStorageReconstitutionGuide from "./pages/guides/PeptideStorageReconstitutionGuide";
import Bpc157DosageGuideSA from "./pages/guides/Bpc157DosageGuideSA";

export interface RenderResult {
  html: string;
  head: { title: string; meta: string; link: string; script: string };
}

export function render(url: string): RenderResult {
  const helmetContext: { helmet?: HelmetServerState } = {};
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

  const html = renderToString(
    <QueryClientProvider client={queryClient}>
      <HelmetProvider context={helmetContext}>
        <AuthProvider>
          <TooltipProvider>
            <StaticRouter location={url}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/free-course" element={<Navigate to="/" replace />} />
                <Route path="/coa-verification" element={<COAVerification />} />
                <Route path="/live-qna" element={<LiveQnA />} />
                <Route path="/peptides/:slug" element={<PeptideEntityPage />} />
                <Route path="/categories/:slug" element={<CategoryHubPage />} />
                <Route path="/guides/:slug" element={<GuidePage />} />
                <Route path="/blog" element={<BlogIndexPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/weight-loss-peptides-south-africa" element={<WeightLossPeptidesSA />} />
                <Route path="/healing-peptides-south-africa" element={<HealingPeptidesSA />} />
                <Route path="/anti-aging-peptides-south-africa" element={<AntiAgingPeptidesSA />} />
                <Route path="/cognitive-peptides-south-africa" element={<CognitivePeptidesSA />} />
                <Route path="/growth-hormone-peptides-south-africa" element={<GrowthHormonePeptidesSA />} />
                <Route path="/libido-peptides-south-africa" element={<LibidoPeptidesSA />} />
                <Route path="/bpc-157-vs-tb-500" element={<Bpc157VsTb500 />} />
                <Route path="/peptides-for-women-south-africa" element={<PeptidesForWomenSA />} />
                <Route path="/peptides-diabetes-fatty-liver" element={<PeptidesDiabetesFattyLiver />} />
                <Route path="/peptide-storage-reconstitution-guide" element={<PeptideStorageReconstitutionGuide />} />
                <Route path="/bpc-157-dosage-guide-south-africa" element={<Bpc157DosageGuideSA />} />
              </Routes>
            </StaticRouter>
          </TooltipProvider>
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>,
  );

  const h = helmetContext.helmet;
  return {
    html,
    head: {
      title: h?.title.toString() ?? "",
      meta: h?.meta.toString() ?? "",
      link: h?.link.toString() ?? "",
      script: h?.script.toString() ?? "",
    },
  };
}

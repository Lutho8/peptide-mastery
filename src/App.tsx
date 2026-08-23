import { useEffect, lazy, Suspense, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import AppRouter from "@/AppRouter";
import { AuthProvider } from "@/contexts/AuthContext";
import { startCycleNotificationChecker, stopCycleNotificationChecker } from "@/services/cycleNotifications";
import { Loader2 } from "lucide-react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// Lazy load all route pages for better code splitting
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const COAVerification = lazy(() => import("./pages/COAVerification"));
const LiveQnA = lazy(() => import("./pages/LiveQnA"));
const PeptideEntityPage = lazy(() => import("./pages/PeptideEntityPage"));
const CategoryHubPage = lazy(() => import("./pages/CategoryHubPage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const BloodworkPage = lazy(() => import("./pages/BloodworkPage"));
const TodayRemindersScreen = lazy(() => import("./screens/TodayRemindersScreen"));
const CycleManagementScreen = lazy(() => import("./screens/CycleManagementScreen"));
const SEODashboard = lazy(() => import("./pages/admin/SEODashboard"));
const SEOVerifyPage = lazy(() => import("./pages/admin/SEOVerifyPage"));
const Welcome = lazy(() => import("./pages/Welcome"));
const BlogIndexPage = lazy(() => import("./pages/BlogIndexPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const WeightLossPeptidesSA = lazy(() => import("./pages/goals/WeightLossPeptidesSA"));
const HealingPeptidesSA = lazy(() => import("./pages/goals/HealingPeptidesSA"));
const AntiAgingPeptidesSA = lazy(() => import("./pages/goals/AntiAgingPeptidesSA"));
const CognitivePeptidesSA = lazy(() => import("./pages/goals/CognitivePeptidesSA"));
const GrowthHormonePeptidesSA = lazy(() => import("./pages/goals/GrowthHormonePeptidesSA"));
const LibidoPeptidesSA = lazy(() => import("./pages/goals/LibidoPeptidesSA"));
const Bpc157VsTb500 = lazy(() => import("./pages/comparisons/Bpc157VsTb500"));
const PeptidesForWomenSA = lazy(() => import("./pages/goals/PeptidesForWomenSA"));
const PeptidesDiabetesFattyLiver = lazy(() => import("./pages/goals/PeptidesDiabetesFattyLiver"));
const PeptideStorageReconstitutionGuide = lazy(() => import("./pages/guides/PeptideStorageReconstitutionGuide"));
const Bpc157DosageGuideSA = lazy(() => import("./pages/guides/Bpc157DosageGuideSA"));

// NEW: Premium feature pages
const SafetyCenter = lazy(() => import("./pages/SafetyPage"));
const InjectionSites = lazy(() => import("./pages/InjectionSitesPage"));
const Analytics = lazy(() => import("./pages/AnalyticsPage"));
const Inventory = lazy(() => import("./pages/InventoryPage"));



// Initialize i18n
import '@/i18n';

const queryClient = new QueryClient();

/**
 * Detect if the current URL is an OAuth callback.
 * OAuth providers redirect to /auth/callback?code=xxx
 * We detect this BEFORE the router renders so the code exchange happens
 * immediately, regardless of whether the active router is Browser or Hash.
 */
function isOAuthCallback(): boolean {
  const pathname = window.location.pathname;
  const search = window.location.search;
  return (
    pathname === '/auth/callback' ||
    pathname === '/auth/callback/' ||
    (search.includes('code=') && search.includes('type='))
  );
}

const App = () => {
  const [isCallback, setIsCallback] = useState(() => isOAuthCallback());

  useEffect(() => {
    startCycleNotificationChecker();
    return () => stopCycleNotificationChecker();
  }, []);

  // If this is an OAuth callback, render the callback handler directly
  // bypassing the router so the code exchange can happen immediately.
  if (isCallback) {
    return (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
          <AuthCallback />
        </Suspense>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallbackTitle="App shell failed to load" boundaryName="AppShell">
        <AuthProvider>
          <TooltipProvider>
            <ErrorBoundary fallbackTitle="Notifications unavailable" boundaryName="Toasters">
              <Toaster />
              <Sonner />
            </ErrorBoundary>
            <AppRouter>
              <ErrorBoundary fallbackTitle="Page failed to load" boundaryName="Router">
                <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                  <Routes>
                    <Route path="/welcome" element={<Welcome />} />
                    <Route path="/" element={<Index />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/disclaimer" element={<Disclaimer />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/free-course" element={<Navigate to="/" replace />} />
                    <Route path="/coa-verification" element={<COAVerification />} />
                    <Route path="/live-qna" element={<LiveQnA />} />
                    <Route path="/peptides/:slug" element={<PeptideEntityPage />} />
                    <Route path="/categories/:slug" element={<CategoryHubPage />} />
                    <Route path="/guides/:slug" element={<GuidePage />} />
                    <Route path="/bloodwork" element={<BloodworkPage />} />
                    <Route path="/reminders/today" element={<TodayRemindersScreen />} />
                    <Route path="/cycles" element={<CycleManagementScreen />} />
                    <Route path="/blog" element={<BlogIndexPage />} />
                    <Route path="/blog/:slug" element={<BlogPostPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/install" element={<InstallPage />} />
                    {/* Goal-based SEO landing pages */}
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
                    {/* NEW: Premium feature routes */}
                    <Route path="/safety" element={<SafetyCenter />} />
                    <Route path="/injection-sites" element={<InjectionSites />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/inventory" element={<Inventory />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="/admin/seo" element={<SEODashboard />} />
                    <Route path="/admin/seo/verify" element={<SEOVerifyPage />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </AppRouter>

            <VercelAnalytics />
          </TooltipProvider>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;

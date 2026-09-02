import { useEffect, lazy, Suspense, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import AppRouter from "@/AppRouter";
import { AuthProvider } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { isAuthCallbackLocation } from "@/lib/authCallback";
import { AdminRoute, ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Lazy load all route pages for better code splitting
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const COAVerification = lazy(() => import("./pages/COAVerification"));
const PeptideEntityPage = lazy(() => import("./pages/PeptideEntityPage"));
const CategoryHubPage = lazy(() => import("./pages/CategoryHubPage"));
const BloodworkPage = lazy(() => import("./pages/BloodworkPage"));
const TodayRemindersScreen = lazy(() => import("./screens/TodayRemindersScreen"));
const SEODashboard = lazy(() => import("./pages/admin/SEODashboard"));
const SEOVerifyPage = lazy(() => import("./pages/admin/SEOVerifyPage"));
const Welcome = lazy(() => import("./pages/Welcome"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const ConfessionsPage = lazy(() => import("./pages/ConfessionsPage"));

// NEW: Premium feature pages
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
const App = () => {
  const [isCallback] = useState(() => isAuthCallbackLocation(window.location.pathname, window.location.search));

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
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/disclaimer" element={<Disclaimer />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/free-course" element={<Navigate to="/" replace />} />
                    <Route path="/coa-verification" element={<COAVerification />} />
                    <Route path="/live-qna" element={<Navigate to="/" replace />} />
                    <Route path="/peptides/:slug" element={<PeptideEntityPage />} />
                    <Route path="/categories/:slug" element={<CategoryHubPage />} />
                    <Route path="/guides/:slug" element={<Navigate to="/" replace />} />
                    <Route path="/bloodwork" element={<BloodworkPage />} />
                    <Route path="/cycles" element={<Navigate to="/" replace />} />
                    <Route path="/blog" element={<Navigate to="/" replace />} />
                    <Route path="/blog/:slug" element={<Navigate to="/" replace />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/confessions" element={<ConfessionsPage />} />
                    <Route path="/install" element={<InstallPage />} />
                    {/* Goal-based SEO landing pages */}
                    <Route path="/weight-loss-peptides-south-africa" element={<Navigate to="/" replace />} />
                    <Route path="/healing-peptides-south-africa" element={<Navigate to="/" replace />} />
                    <Route path="/anti-aging-peptides-south-africa" element={<Navigate to="/" replace />} />
                    <Route path="/cognitive-peptides-south-africa" element={<Navigate to="/" replace />} />
                    <Route path="/growth-hormone-peptides-south-africa" element={<Navigate to="/" replace />} />
                    <Route path="/libido-peptides-south-africa" element={<Navigate to="/" replace />} />
                    <Route path="/bpc-157-vs-tb-500" element={<Navigate to="/" replace />} />
                    <Route path="/peptides-for-women-south-africa" element={<Navigate to="/" replace />} />
                    <Route path="/peptides-diabetes-fatty-liver" element={<Navigate to="/" replace />} />
                    <Route path="/peptide-storage-reconstitution-guide" element={<Navigate to="/" replace />} />
                    <Route path="/bpc-157-dosage-guide-south-africa" element={<Navigate to="/peptides/bpc-157" replace />} />
                    {/* NEW: Premium feature routes */}
                    <Route path="/safety" element={<Navigate to="/" replace />} />
                    <Route path="/injection-sites" element={<Navigate to="/" replace />} />
                    <Route element={<ProtectedRoute />}>
                      <Route path="/dashboard" element={<Index dashboardRoute />} />
                      <Route path="/reminders/today" element={<TodayRemindersScreen />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/inventory" element={<Inventory />} />
                    </Route>
                    <Route element={<AdminRoute />}>
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/seo" element={<SEODashboard />} />
                      <Route path="/admin/seo/verify" element={<SEOVerifyPage />} />
                    </Route>
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

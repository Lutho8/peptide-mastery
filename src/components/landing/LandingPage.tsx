import { useState, lazy, Suspense } from 'react';
import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { SafeSection } from './SafeSection';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LANDING_SECTIONS } from '@/lib/landingSections';
import { SEOHead } from '@/components/seo/SEOHead';
import { JsonLd, buildOrganizationSchema, buildWebSiteSchema, buildFAQSchema, buildLocalBusinessSchema } from '@/components/seo/JsonLd';
import { faqCategories } from './FAQSection';

import { PeptideCategory } from '@/data/peptides';

// Below-the-fold sections — lazy load to improve LCP/TBT
const BentoFeatures = lazy(() => import('./BentoFeatures').then(m => ({ default: m.BentoFeatures })));
const PWAInstallJourney = lazy(() => import('./PWAInstallJourney').then(m => ({ default: m.PWAInstallJourney })));
const InstallVerification = lazy(() => import('@/components/pwa/InstallVerification').then(m => ({ default: m.InstallVerification })));
const Testimonials = lazy(() => import('./Testimonials').then(m => ({ default: m.Testimonials })));
const WhyFreeBand = lazy(() => import('./WhyFreeBand').then(m => ({ default: m.WhyFreeBand })));
const ResearchTools = lazy(() => import('./ResearchTools').then(m => ({ default: m.ResearchTools })));
const FeaturedPeptides = lazy(() => import('./FeaturedPeptides').then(m => ({ default: m.FeaturedPeptides })));
const PeptideCategories = lazy(() => import('./PeptideCategories').then(m => ({ default: m.PeptideCategories })));
const BlogSection = lazy(() => import('./BlogSection').then(m => ({ default: m.BlogSection })));
const CTASection = lazy(() => import('./CTASection').then(m => ({ default: m.CTASection })));
const LandingFooter = lazy(() => import('./LandingFooter').then(m => ({ default: m.LandingFooter })));
const FAQSection = lazy(() => import('./FAQSection').then(m => ({ default: m.FAQSection })));
const SafetyDisclaimerBand = lazy(() => import('./SafetyDisclaimerBand').then(m => ({ default: m.SafetyDisclaimerBand })));

// Lazy load modals - only loaded when opened
const AuthModal = lazy(() => import('@/components/auth/AuthModal').then(m => ({ default: m.AuthModal })));

const PeptideQuiz = lazy(() => import('./PeptideQuiz').then(m => ({ default: m.PeptideQuiz })));
const BlendsAndStacks = lazy(() => import('./BlendsAndStacks').then(m => ({ default: m.BlendsAndStacks })));
const PeptideSearch = lazy(() => import('./PeptideSearch').then(m => ({ default: m.PeptideSearch })));
const ReconstitutionCalculator = lazy(() => import('./ReconstitutionCalculator').then(m => ({ default: m.ReconstitutionCalculator })));

const SectionPlaceholder = ({ minH = 400 }: { minH?: number }) => (
  <div style={{ minHeight: minH }} aria-hidden="true" />
);

interface LandingPageProps {
  onBackToDashboard?: () => void;
}

export function LandingPage({ onBackToDashboard }: LandingPageProps) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [quizOpen, setQuizOpen] = useState(false);
  const [blendsStacksOpen, setBlendsStacksOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const handleSignInClick = () => { setAuthMode('signup'); setAuthModalOpen(true); };
  const handleCategoryClick = (_category: PeptideCategory) => { setSearchOpen(true); };

  const allFaqs = faqCategories.flatMap(cat => cat.faqs);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Peptide South Africa – Peptide Research & Protocol Tracking Platform"
        description="Research-backed peptide database with protocol tracking, reconstitution calculators, AI-powered biomarker analysis, and 50+ peptide profiles. Free tools for dosing, stacking, and bloodwork monitoring."
        canonical="https://peptide-south-africa.co.za"
      />
      <JsonLd data={buildOrganizationSchema()} id="org-schema" />
      <JsonLd data={buildLocalBusinessSchema()} id="localbusiness-schema" />
      <JsonLd data={buildWebSiteSchema()} id="website-schema" />
      <JsonLd data={buildFAQSchema(allFaqs)} id="faq-schema" />
      <LandingHeader
        onSignInClick={handleSignInClick}
        onSearch={() => setSearchOpen(true)}
        onBlendsClick={() => setBlendsStacksOpen(true)}
        onBackToDashboard={onBackToDashboard}
      />

      <ErrorBoundary fallbackTitle="The landing page hit a snag">
        <main>
          <HeroSection onCategoryClick={handleCategoryClick} onSignInClick={handleSignInClick} />

          <SafeSection name="PWA Install Journey" enabled={LANDING_SECTIONS.pwaJourney} minH={2200} component={PWAInstallJourney} />
          <SafeSection name="Install Verification" enabled={LANDING_SECTIONS.pwaJourney} minH={800} component={InstallVerification} />

          <SafeSection name="Testimonials" enabled={LANDING_SECTIONS.testimonials} minH={1600} component={Testimonials} />

          <SafeSection name="Why Free Band" enabled={LANDING_SECTIONS.whyFreeBand} minH={300}>
            <Suspense fallback={<SectionPlaceholder minH={300} />}>
              <WhyFreeBand onPrimaryClick={handleSignInClick} />
            </Suspense>
          </SafeSection>

          <SafeSection name="Research Tools" enabled={LANDING_SECTIONS.researchTools} minH={500}>
            <Suspense fallback={<SectionPlaceholder minH={500} />}>
              <ResearchTools
                onBlendsClick={() => setBlendsStacksOpen(true)}
                onQuizClick={() => setQuizOpen(true)}
                onSearchClick={() => setSearchOpen(true)}
                onStackClick={() => setBlendsStacksOpen(true)}
                onCalculatorClick={() => setCalculatorOpen(true)}
              />
            </Suspense>
          </SafeSection>

          <div id="featured-peptides" className="relative">
            <SafeSection name="Featured Peptides" enabled={LANDING_SECTIONS.featuredPeptides} minH={600} component={FeaturedPeptides} />
          </div>

          <SafeSection name="Peptide Categories" enabled={LANDING_SECTIONS.peptideCategories} minH={400}>
            <Suspense fallback={<SectionPlaceholder minH={400} />}>
              <PeptideCategories onCategoryClick={() => setSearchOpen(true)} />
            </Suspense>
          </SafeSection>

          <SafeSection name="Safety Disclaimer" enabled={LANDING_SECTIONS.safetyDisclaimer} minH={120} component={SafetyDisclaimerBand} />
          <SafeSection name="FAQ" enabled={LANDING_SECTIONS.faq} minH={1400} component={FAQSection} />

          <SafeSection name="CTA" enabled={LANDING_SECTIONS.cta} minH={300}>
            <Suspense fallback={<SectionPlaceholder minH={300} />}>
              <CTASection onSignInClick={handleSignInClick} />
            </Suspense>
          </SafeSection>

          {/* Blogs sit just above the footer */}
          <SafeSection name="Blogs" enabled={LANDING_SECTIONS.blog} minH={2000} component={BlogSection} />
        </main>
      </ErrorBoundary>

      <Suspense fallback={<SectionPlaceholder minH={300} />}>
        <LandingFooter />
      </Suspense>
      <Suspense fallback={null}>
        {authModalOpen && <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} defaultMode={authMode} />}
        {quizOpen && <PeptideQuiz open={quizOpen} onClose={() => setQuizOpen(false)} />}
        {blendsStacksOpen && <BlendsAndStacks open={blendsStacksOpen} onClose={() => setBlendsStacksOpen(false)} />}
        {searchOpen && <PeptideSearch open={searchOpen} onClose={() => setSearchOpen(false)} />}
        {calculatorOpen && <ReconstitutionCalculator open={calculatorOpen} onClose={() => setCalculatorOpen(false)} />}
      </Suspense>
    </div>
  );
}

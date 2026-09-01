import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { parseRecordedDose } from '@/lib/recordedDose';
import { BottomNav } from '@/components/layout/BottomNav';
import { AppHeader } from '@/components/layout/AppHeader';
import { useStorageInit } from '@/hooks/useStorageInit';
import { useDailyDoses } from '@/hooks/useDailyDoses';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useProfileSync } from '@/hooks/useProfileSync';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useScreenTransition } from '@/hooks/useScreenTransition';

import { HomeSkeleton, ListSkeleton, CardSkeleton } from '@/components/ui/ScreenSkeleton';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { CompanionSection } from '@/components/companion/CompanionNav';

// Lazy load screens for code splitting
const HomeScreen = lazy(() => import('@/screens/HomeScreen').then(m => ({ default: m.HomeScreen })));
const MyStackScreen = lazy(() => import('@/screens/MyStackScreen').then(m => ({ default: m.MyStackScreen })));
const DailyLogScreen = lazy(() => import('@/screens/DailyLogScreen').then(m => ({ default: m.DailyLogScreen })));
const ResearchLibraryScreen = lazy(() => import('@/screens/ResearchLibraryScreen').then(m => ({ default: m.ResearchLibraryScreen })));
const TransformationScreen = lazy(() => import('@/screens/TransformationScreen').then(m => ({ default: m.TransformationScreen })));
const MeasurementToolScreen = lazy(() => import('@/screens/MeasurementToolScreen').then(m => ({ default: m.MeasurementToolScreen })));
const SettingsScreen = lazy(() => import('@/screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const LandingPage = lazy(() => import('@/components/landing/LandingPage').then(m => ({ default: m.LandingPage })));


// Lazy load modals
const BodyCompositionModal = lazy(() => import('@/components/modals/BodyCompositionModal').then(m => ({ default: m.BodyCompositionModal })));
const NotificationActionModal = lazy(() => import('@/components/modals/NotificationActionModal').then(m => ({ default: m.NotificationActionModal })));
const InstallAppStep = lazy(() => import('@/components/onboarding/InstallAppStep').then(m => ({ default: m.InstallAppStep })));

const ScreenLoaderHome = () => <HomeSkeleton />;
const ScreenLoaderList = () => <ListSkeleton />;
const ScreenLoaderCards = () => <CardSkeleton />;

type TabId = 'home' | 'stack' | 'daily-log' | 'transformation' | 'measurement';

interface IndexProps {
  dashboardRoute?: boolean;
}

const Index = ({ dashboardRoute = false }: IndexProps) => {
  useStorageInit();
  const { addDose } = useDailyDoses();
  const { user, signOut, isLoading } = useAuth();
  const { isLoading: accessLoading } = useAccessControl();
  useProfileSync();
  // Mount cloud sync at the app shell so the stack (and other cloud data)
  // hydrates as soon as the user is authenticated, regardless of which tab
  // they happen to land on. Without this, hydration only ran when the user
  // opened the My Stack screen, causing the home preview to look empty.
  useCloudSync();
  const { getDirection, getTransitionVariants } = useScreenTransition();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [measurementSection, setMeasurementSection] = useState<CompanionSection>('measure');

  // Sync `?screen=` query param → activeTab so deep links from elsewhere in
  // the app (e.g. "Open in Daily Log" from the backdate conflict list) land
  // on the right tab.
  useEffect(() => {
    const applyFromQuery = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const screen = params.get('screen') as TabId | 'settings' | null;
        if (!screen) return;
        if (screen === 'settings') {
          setShowSettings(true);
          return;
        }
        if (['home', 'stack', 'daily-log', 'transformation', 'measurement'].includes(screen)) {
          setShowSettings(false);
          if (screen === 'measurement') {
            const tool = params.get('tool');
            setMeasurementSection(
              tool === 'ask' || tool === 'journal' || tool === 'confessions' ? tool : 'measure',
            );
          }
          setActiveTab(screen as TabId);
        }
      } catch { /* noop */ }
    };
    applyFromQuery();
    window.addEventListener('popstate', applyFromQuery);
    return () => window.removeEventListener('popstate', applyFromQuery);
  }, []);
  const [showSettings, setShowSettings] = useState(false);
  const [showResearch, setShowResearch] = useState(false);
  const [bodyCompositionOpen, setBodyCompositionOpen] = useState(false);
  const [installStepOpen, setInstallStepOpen] = useState(false);

  // Mark install_completed when user opens app from home screen (standalone)
  useEffect(() => {
    if (!user) return;
    import('@/lib/pwaInstall').then(({ isStandalone }) => {
      if (isStandalone()) {
        import('@/lib/onboardingProgress').then(({ markStep }) => {
          markStep('install_completed', { userId: user.id, meta: { source: 'standalone_launch' } });
          markStep('install_attempted', { userId: user.id });
        });
      }
    });
    import('@/lib/onboardingProgress').then(({ markStep }) => markStep('account_created', { userId: user.id }));
  }, [user]);

  // Show install onboarding once after signup, only on mobile and if not yet installed
  useEffect(() => {
    if (!user) return;
    try {
      const pending = localStorage.getItem('rtd-install-prompt-pending') === '1';
      if (!pending) return;
      const isStandaloneNow = window.matchMedia('(display-mode: standalone)').matches;
      const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
      if (isStandaloneNow || !isMobile) {
        localStorage.removeItem('rtd-install-prompt-pending');
        return;
      }
      const t = setTimeout(() => setInstallStepOpen(true), 800);
      return () => clearTimeout(t);
    } catch {
      // Storage and display-mode APIs can be unavailable in hardened browsers.
    }
  }, [user]);

  const handleMarkDoseAsTaken = useCallback((peptideName: string, dose: string, time: string) => {
    const recordedDose = parseRecordedDose(dose);
    if (!recordedDose) {
      toast.error('Open Daily Log to confirm the amount and unit before saving this entry.');
      setActiveTab('daily-log');
      return;
    }
    
    void addDose({
      date: format(new Date(), 'yyyy-MM-dd'),
      peptide_id: peptideName.toLowerCase().replace(/\s+/g, '-'),
      peptide_name: peptideName,
      dose: recordedDose.dose,
      unit: recordedDose.unit,
      time: time,
      notes: recordedDose.originalUnit === 'mcg'
        ? `Logged from reminder (${recordedDose.originalAmount} mcg)`
        : 'Logged from reminder',
    }).then(() => toast.success('Entry saved to your account history')).catch(() => {
      toast.error('Entry could not be saved. Open Daily Log to retry.');
    });
  }, [addDose]);

  const handleLogoClick = () => {
    setShowSettings(false);
    setShowResearch(false);
    setActiveTab('home');
  };

  const openDashboardTab = useCallback((tab: TabId) => {
    setShowResearch(false);
    setActiveTab(tab);
    if (tab !== 'measurement') setMeasurementSection('measure');
    try {
      const url = new URL(window.location.href);
      if (tab === 'home') url.searchParams.delete('screen');
      else url.searchParams.set('screen', tab);
      url.searchParams.delete('tool');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch { /* URL state is an optional enhancement. */ }
  }, []);

  const openMeasurementSection = useCallback((section: CompanionSection) => {
    setShowResearch(false);
    setMeasurementSection(section);
    setActiveTab('measurement');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('screen', 'measurement');
      if (section === 'measure') url.searchParams.delete('tool');
      else url.searchParams.set('tool', section);
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch { /* URL state is an optional enhancement. */ }
  }, []);

  const screenKey = showSettings ? 'settings' : showResearch ? 'research' : activeTab;
  const direction = getDirection(screenKey);
  const variants = getTransitionVariants(direction);

  const renderScreen = () => {
    if (showSettings) {
      return (
        <ErrorBoundary fallbackTitle="Settings failed to load">
          <Suspense fallback={<ScreenLoaderList />}>
            <SettingsScreen onBack={() => setShowSettings(false)} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (showResearch) {
      return (
        <ErrorBoundary fallbackTitle="Research Library failed to load">
          <Suspense fallback={<ScreenLoaderList />}>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResearch(false)}
                className="mb-4 gap-1 text-muted-foreground"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Button>
              <ResearchLibraryScreen />
            </div>
          </Suspense>
        </ErrorBoundary>
      );
    }

    const fallbacks: Record<TabId, JSX.Element> = {
      home: <ScreenLoaderHome />,
      stack: <ScreenLoaderList />,
      'daily-log': <ScreenLoaderList />,
      transformation: <ScreenLoaderCards />,
      measurement: <ScreenLoaderCards />,
    };

    const screenNames: Record<TabId, string> = {
      home: 'Dashboard',
      stack: 'My Stack',
      'daily-log': 'Daily Log',
      transformation: 'Transformation',
      measurement: 'Measurement Tool',
    };

    return (
      <ErrorBoundary fallbackTitle={`${screenNames[activeTab]} failed to load`}>
        <Suspense fallback={fallbacks[activeTab]}>
          {activeTab === 'home' && (
            <HomeScreen
              onOpenBodyComposition={() => setBodyCompositionOpen(true)}
              onOpenDoseTracker={() => setActiveTab('daily-log')}
              onOpenCycles={() => setActiveTab('stack')}
              onOpenBloodwork={() => navigate('/bloodwork')}
              onOpenInventory={() => navigate('/inventory')}
              onNavigatePeptides={() => setShowResearch(true)}
              onNavigateStack={() => setActiveTab('stack')}
              onOpenSettings={() => setShowSettings(true)}
              onNavigateResearch={() => setShowResearch(true)}
              onOpenCalculator={() => openMeasurementSection('measure')}
              onAskPepSA={() => openMeasurementSection('ask')}
            />
          )}
          {activeTab === 'stack' && <MyStackScreen />}
          {activeTab === 'daily-log' && <DailyLogScreen onOpenMeasurement={() => openMeasurementSection('measure')} />}
          {activeTab === 'transformation' && <TransformationScreen />}
          {activeTab === 'measurement' && (
            <MeasurementToolScreen
              initialSection={measurementSection}
              onSectionChange={setMeasurementSection}
            />
          )}
        </Suspense>
      </ErrorBoundary>
    );
  };

  // Loading state
  if (isLoading || (user && accessLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Unauthenticated visitors land directly on the landing page
  if (!user) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <LandingPage openSignInOnLoad={dashboardRoute} />
      </Suspense>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        onLogoClick={handleLogoClick}
        onSettingsClick={() => setShowSettings(true)}
        onSignOut={() => signOut()}
        userName={user.user_metadata?.display_name || 'User'}
        userEmail={user.email}
      />

      <main
        className="mx-auto w-full max-w-5xl px-3 py-4 pb-28 sm:px-4 sm:py-6 scroll-smooth-touch"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 5.5rem)' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={screenKey}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {!showSettings && !showResearch && (
        <BottomNav
          activeTab={activeTab}
          activeMeasurementSection={measurementSection}
          onTabChange={openDashboardTab}
          onAskPepSA={() => openMeasurementSection('ask')}
        />
      )}

      <InstallBanner />

      {/* Modals - lazy loaded */}
      <Suspense fallback={null}>
        {bodyCompositionOpen && <BodyCompositionModal open={bodyCompositionOpen} onOpenChange={setBodyCompositionOpen} />}
        <NotificationActionModal onMarkAsTaken={handleMarkDoseAsTaken} />
        {installStepOpen && (
          <InstallAppStep open={installStepOpen} onClose={() => setInstallStepOpen(false)} />
        )}
      </Suspense>
    </div>
  );
};

export default Index;

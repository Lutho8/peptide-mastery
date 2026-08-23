import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
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

// Lazy load screens for code splitting
const HomeScreen = lazy(() => import('@/screens/HomeScreen').then(m => ({ default: m.HomeScreen })));
const MyStackScreen = lazy(() => import('@/screens/MyStackScreen').then(m => ({ default: m.MyStackScreen })));
const DailyLogScreen = lazy(() => import('@/screens/DailyLogScreen').then(m => ({ default: m.DailyLogScreen })));
const DosageScreen = lazy(() => import('@/screens/DosageScreen').then(m => ({ default: m.DosageScreen })));
const ResearchLibraryScreen = lazy(() => import('@/screens/ResearchLibraryScreen').then(m => ({ default: m.ResearchLibraryScreen })));
const TransformationScreen = lazy(() => import('@/screens/TransformationScreen').then(m => ({ default: m.TransformationScreen })));
const SettingsScreen = lazy(() => import('@/screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const LandingPage = lazy(() => import('@/components/landing/LandingPage').then(m => ({ default: m.LandingPage })));


// Lazy load modals
const BodyCompositionModal = lazy(() => import('@/components/modals/BodyCompositionModal').then(m => ({ default: m.BodyCompositionModal })));
const DoseTrackerModal = lazy(() => import('@/components/modals/DoseTrackerModal').then(m => ({ default: m.DoseTrackerModal })));
const CycleManagementModal = lazy(() => import('@/components/modals/CycleManagementModal').then(m => ({ default: m.CycleManagementModal })));
const InventoryModal = lazy(() => import('@/components/modals/InventoryModal').then(m => ({ default: m.InventoryModal })));
const NotificationActionModal = lazy(() => import('@/components/modals/NotificationActionModal').then(m => ({ default: m.NotificationActionModal })));
const AuthModal = lazy(() => import('@/components/auth/AuthModal').then(m => ({ default: m.AuthModal })));
const ProfileSetupWizard = lazy(() => import('@/components/onboarding/ProfileSetupWizard').then(m => ({ default: m.ProfileSetupWizard })));
const InstallAppStep = lazy(() => import('@/components/onboarding/InstallAppStep').then(m => ({ default: m.InstallAppStep })));

const ScreenLoaderHome = () => <HomeSkeleton />;
const ScreenLoaderList = () => <ListSkeleton />;
const ScreenLoaderCards = () => <CardSkeleton />;

type TabId = 'home' | 'stack' | 'daily-log' | 'dosage' | 'transformation';

const Index = () => {
  useStorageInit();
  const { addDose } = useDailyDoses();
  const { user, signOut, isLoading } = useAuth();
  const { isLoading: accessLoading } = useAccessControl();
  const { hydrated: profileHydrated } = useProfileSync();
  // Mount cloud sync at the app shell so the stack (and other cloud data)
  // hydrates as soon as the user is authenticated, regardless of which tab
  // they happen to land on. Without this, hydration only ran when the user
  // opened the My Stack screen, causing the home preview to look empty.
  useCloudSync();
  const { getDirection, getTransitionVariants } = useScreenTransition();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>('home');

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
        if (['home', 'stack', 'daily-log', 'dosage', 'transformation'].includes(screen)) {
          setShowSettings(false);
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
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [bodyCompositionOpen, setBodyCompositionOpen] = useState(false);
  const [doseTrackerOpen, setDoseTrackerOpen] = useState(false);
  const [cycleManagementOpen, setCycleManagementOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);
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
    } catch {}
  }, [user]);

  // Auto-open the profile setup wizard once per user — wait for cloud hydration first
  // so we don't prompt a user who already has a profile saved on another device.
  useEffect(() => {
    if (!user || !profileHydrated) return;
    let cancelled = false;
    import('@/components/onboarding/ProfileSetupWizard').then(({ shouldShowProfileSetup }) => {
      if (cancelled) return;
      if (shouldShowProfileSetup(user.id)) {
        const t = setTimeout(() => setProfileSetupOpen(true), 600);
        return () => clearTimeout(t);
      }
    });
    return () => { cancelled = true; };
  }, [user, profileHydrated]);

  const handleMarkDoseAsTaken = useCallback((peptideName: string, dose: string, time: string) => {
    const doseMatch = dose.match(/^([\d.]+)(\w+)$/);
    const doseValue = doseMatch ? parseFloat(doseMatch[1]) : 0;
    const unit = (doseMatch ? doseMatch[2] : 'mg') as 'mg' | 'IU' | 'units';
    
    addDose({
      date: format(new Date(), 'yyyy-MM-dd'),
      peptide_id: peptideName.toLowerCase().replace(/\s+/g, '-'),
      peptide_name: peptideName,
      dose: doseValue,
      unit: unit,
      time: time,
      notes: 'Logged from notification',
    });
  }, [addDose]);

  const handleLogoClick = () => {
    setShowSettings(false);
    if (user) {
      setShowLandingPage(true);
    } else {
      setActiveTab('home');
    }
  };
  
  const handleBackToDashboard = () => {
    setShowLandingPage(false);
    setActiveTab('home');
  };

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
      dosage: <ScreenLoaderCards />,
      transformation: <ScreenLoaderCards />,
    };

    const screenNames: Record<TabId, string> = {
      home: 'Dashboard',
      stack: 'My Stack',
      'daily-log': 'Daily Log',
      dosage: 'Dosage Calculator',
      transformation: 'Transformation',
    };

    return (
      <ErrorBoundary fallbackTitle={`${screenNames[activeTab]} failed to load`}>
        <Suspense fallback={fallbacks[activeTab]}>
          {activeTab === 'home' && (
            <HomeScreen
              onOpenBodyComposition={() => setBodyCompositionOpen(true)}
              onOpenDoseTracker={() => setDoseTrackerOpen(true)}
              onOpenCycles={() => setCycleManagementOpen(true)}
              onOpenBloodwork={() => navigate('/bloodwork')}
              onOpenInventory={() => setInventoryOpen(true)}
              onNavigatePeptides={() => setShowResearch(true)}
              onNavigateStack={() => setActiveTab('stack')}
              onNavigateDosage={() => setActiveTab('dosage')}
              onOpenSettings={() => setShowSettings(true)}
              onNavigateResearch={() => setShowResearch(true)}
            />
          )}
          {activeTab === 'stack' && <MyStackScreen />}
          {activeTab === 'daily-log' && <DailyLogScreen />}
          {activeTab === 'dosage' && <DosageScreen />}
          {activeTab === 'transformation' && <TransformationScreen />}
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
        <LandingPage />
      </Suspense>
    );
  }

  // Landing page for authenticated users browsing public content
  if (showLandingPage) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <LandingPage onBackToDashboard={handleBackToDashboard} />
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
        <BottomNav activeTab={activeTab} onTabChange={(tab) => { setShowResearch(false); setActiveTab(tab); }} />
      )}

      <InstallBanner />

      {/* Modals - lazy loaded */}
      <Suspense fallback={null}>
        {bodyCompositionOpen && <BodyCompositionModal open={bodyCompositionOpen} onOpenChange={setBodyCompositionOpen} />}
        {doseTrackerOpen && <DoseTrackerModal open={doseTrackerOpen} onOpenChange={setDoseTrackerOpen} />}
        {cycleManagementOpen && <CycleManagementModal open={cycleManagementOpen} onOpenChange={setCycleManagementOpen} />}
        {inventoryOpen && <InventoryModal open={inventoryOpen} onOpenChange={setInventoryOpen} />}
        <NotificationActionModal onMarkAsTaken={handleMarkDoseAsTaken} />
        {authModalOpen && <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />}
        {profileSetupOpen && (
          <ProfileSetupWizard
            open={profileSetupOpen}
            onOpenChange={setProfileSetupOpen}
          />
        )}
        {installStepOpen && (
          <InstallAppStep open={installStepOpen} onClose={() => setInstallStepOpen(false)} />
        )}
      </Suspense>
    </div>
  );
};

export default Index;

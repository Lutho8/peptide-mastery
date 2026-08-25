import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NewsTicker } from '@/components/home/NewsTicker';
import { BodyCompositionCard } from '@/components/home/BodyCompositionCard';
import { TodaysDoses } from '@/components/home/TodaysDoses';
import { TodaysReminders } from '@/components/home/TodaysReminders';
import { WeeklyAdherenceReport } from '@/components/home/WeeklyAdherenceReport';
import { MissedDosesCard } from '@/components/home/MissedDosesCard';
import { AchievementsBadges } from '@/components/home/AchievementsBadges';
import { ActiveStackPreview } from '@/components/home/ActiveStackPreview';
import { QuickActions } from '@/components/home/QuickActions';
import { StackCategories } from '@/components/home/StackCategories';
import { SafetyDisclaimer } from '@/components/home/SafetyDisclaimer';
import { JourneyDashboard } from '@/components/home/JourneyDashboard';
import { OrderJourneyCard } from '@/components/home/OrderJourneyCard';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useDoseReminders } from '@/hooks/useDoseReminders';
import { useDailyDoses } from '@/hooks/useDailyDoses';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerJourney } from '@/hooks/useCustomerJourney';

interface HomeScreenProps {
  onOpenBodyComposition: () => void;
  onOpenDoseTracker: () => void;
  onOpenCycles: () => void;
  onOpenBloodwork: () => void;
  onOpenInventory: () => void;
  onNavigatePeptides: () => void;
  onNavigateStack: () => void;
  onOpenSettings: () => void;
  onNavigateResearch?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export function HomeScreen({
  onOpenBodyComposition,
  onOpenDoseTracker,
  onOpenCycles,
  onOpenBloodwork,
  onOpenInventory,
  onNavigatePeptides,
  onNavigateStack,
  onOpenSettings,
  onNavigateResearch
}: HomeScreenProps) {
  const { reminders, refreshReminders } = useDoseReminders();
  const { refreshDoses } = useDailyDoses();
  const { user } = useAuth();
  const journey = useCustomerJourney();
  const navigate = useNavigate();

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshDoses(), refreshReminders(), journey.refresh()]);
  }, [journey, refreshDoses, refreshReminders]);
  
  // Get display name from user metadata or fallback to email
  const displayName = user?.user_metadata?.display_name 
    || user?.email?.split('@')[0] 
    || 'Guest';
  
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const showAdvancedDashboard = journey.snapshot?.journey?.experience_mode === 'experienced';

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <motion.div 
        className="pb-24 space-y-4 sm:space-y-5"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        variants={itemVariants}
        data-tour="welcome-header"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back,</h1>
          <p className="text-lg text-primary font-medium">{displayName}</p>
        </div>
        <motion.div 
          className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg luxury-shimmer"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          {initials}
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <JourneyDashboard
          snapshot={journey.snapshot}
          isLoading={journey.isLoading}
          error={journey.error}
          onRetry={journey.refresh}
          onSelectExperience={journey.selectExperience}
          onSelectPathway={journey.selectPathway}
          onTrack={journey.trackEvent}
          onResearch={onNavigateResearch || onNavigatePeptides}
          onWorkspace={onNavigateStack}
        />
      </motion.div>

      {!journey.isLoading && journey.snapshot && (
        <motion.div variants={itemVariants}>
          <OrderJourneyCard
            journey={journey.snapshot.journey}
            commerce={journey.snapshot.commerce}
            onTrack={journey.trackEvent}
          />
        </motion.div>
      )}

      {showAdvancedDashboard ? (
        <>
          {/* Primary mobile actions stay above the fold for experienced users. */}
          <motion.div variants={itemVariants} data-tour="quick-actions">
            <QuickActions
              onBodyStats={onOpenBodyComposition}
              onCycles={onOpenCycles}
              onPeptides={onNavigatePeptides}
              onBloodwork={onOpenBloodwork}
              onInventory={onOpenInventory}
              onResearch={onNavigateResearch}
            />
          </motion.div>

      {/* News Ticker */}
      <motion.div variants={itemVariants}>
        <NewsTicker />
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        {/* Body Composition Dashboard */}
        <motion.div variants={itemVariants}>
          <BodyCompositionCard onViewDetails={onOpenBodyComposition} />
        </motion.div>

        {/* Today's Doses Summary */}
        <motion.div variants={itemVariants} data-tour="todays-doses">
          <TodaysDoses onViewTracker={onOpenDoseTracker} />
        </motion.div>
      </div>

      {/* Today's Reminders Preview */}
      <motion.div variants={itemVariants} data-tour="reminders">
        <TodaysReminders 
          reminders={reminders} 
          onViewSettings={() => navigate('/reminders/today')}
          onMarkAsTaken={(peptideName, dose, time) => {
            // Dispatch event to trigger dose logging via NotificationActionModal
            const event = new CustomEvent('doseNotificationClick', {
              detail: { peptideName, dose, time }
            });
            window.dispatchEvent(event);
          }}
        />
      </motion.div>

      {/* Weekly Adherence Report */}
      <motion.div variants={itemVariants}>
        <WeeklyAdherenceReport onViewSettings={onOpenSettings} />
      </motion.div>

      {/* Missed Doses Quick-Log */}
      <motion.div variants={itemVariants}>
        <MissedDosesCard />
      </motion.div>

      {/* Achievements & Badges */}
      <motion.div variants={itemVariants}>
        <AchievementsBadges />
      </motion.div>

      {/* Active Protocol Preview */}
      <motion.div variants={itemVariants} data-tour="active-stack">
        <ActiveStackPreview onViewStack={onNavigateStack} />
      </motion.div>

      {/* Stack Categories */}
      <motion.div variants={itemVariants}>
        <StackCategories />
      </motion.div>

      {/* Safety Disclaimer */}
      <motion.div variants={itemVariants}>
        <SafetyDisclaimer />
      </motion.div>
        </>
      ) : (
        <motion.div variants={itemVariants}>
          <SafetyDisclaimer />
        </motion.div>
      )}
      </motion.div>

    </PullToRefresh>
  );
}

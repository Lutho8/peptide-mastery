import { Home, Layers, CalendarDays, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type TabId = 'home' | 'stack' | 'daily-log' | 'transformation' | 'measurement';

interface BottomNavProps {
  activeTab: TabId;
  activeMeasurementSection?: 'measure' | 'ask' | 'journal' | 'confessions';
  onTabChange: (tab: TabId) => void;
  onAskPepSA: () => void;
  pendingReminders?: number;
}

const tabs = [
  { id: 'home' as const, icon: Home, label: 'Home' },
  { id: 'stack' as const, icon: Layers, label: 'Workspace' },
  { id: 'ask-pepsa' as const, icon: Sparkles, label: 'Ask PepSA', featured: true },
  { id: 'daily-log' as const, icon: CalendarDays, label: 'Daily Log' },
  { id: 'transformation' as const, icon: Trophy, label: 'Progress' },
];

export function BottomNav({
  activeTab,
  activeMeasurementSection,
  onTabChange,
  onAskPepSA,
  pendingReminders = 0,
}: BottomNavProps) {
  return (
    <nav data-tour="bottom-nav" className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg no-select" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="grid grid-cols-5 items-center py-1.5 px-1 w-full max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isAskPepSA = tab.id === 'ask-pepsa';
          const isActive = isAskPepSA
            ? activeTab === 'measurement' && activeMeasurementSection === 'ask'
            : activeTab === tab.id;
          const showBadge = tab.id === 'home' && pendingReminders > 0;
          
          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => isAskPepSA ? onAskPepSA() : onTabChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              whileTap={{ scale: 0.92 }}
              className={cn(
                "relative min-w-0 flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl transition-colors touch-target",
                tab.featured && "-mt-4 min-h-16 rounded-2xl border border-primary/30 bg-card shadow-lg",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground active:bg-muted/50"
              )}
            >
              <div className="relative">
                <Icon 
                  size={tab.featured ? 25 : 22}
                  className={cn(
                    "transition-transform duration-200",
                    isActive && "scale-110",
                    tab.featured && "text-primary",
                  )} 
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingReminders > 9 ? '9+' : pendingReminders}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all leading-tight",
                tab.featured && "font-bold text-primary",
                isActive && "text-primary"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

import { Syringe, BarChart3, Calendar, Database, Activity, Package, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  onDoseTracker: () => void;
  onBodyStats: () => void;
  onCycles: () => void;
  onPeptides: () => void;
  onBloodwork: () => void;
  onInventory: () => void;
  onResearch?: () => void;
}

const actions = [
  { 
    id: 'dose', 
    icon: Syringe, 
    label: 'Dose Tracker',
    hint: 'Log doses',
    gradient: 'from-violet-600 to-purple-700',
    onClick: 'onDoseTracker'
  },
  { 
    id: 'stats', 
    icon: BarChart3, 
    label: 'Body Stats',
    hint: 'Track weight',
    gradient: 'from-emerald-600 to-green-700',
    onClick: 'onBodyStats'
  },
  { 
    id: 'cycles', 
    icon: Calendar, 
    label: 'Cycles',
    hint: 'Plan protocols',
    gradient: 'from-red-600 to-rose-700',
    onClick: 'onCycles'
  },
  { 
    id: 'peptides', 
    icon: Database, 
    label: 'Peptides',
    hint: 'Full catalog',
    gradient: 'from-cyan-600 to-teal-700',
    onClick: 'onPeptides'
  },
  { 
    id: 'bloodwork', 
    icon: Activity, 
    label: 'Bloodwork',
    hint: 'Lab results',
    gradient: 'from-pink-600 to-rose-700',
    onClick: 'onBloodwork'
  },
  { 
    id: 'inventory', 
    icon: Package, 
    label: 'Inventory',
    hint: 'Stock levels',
    gradient: 'from-amber-600 to-orange-700',
    onClick: 'onInventory'
  },
  { 
    id: 'research', 
    icon: BookOpen, 
    label: 'Research',
    hint: 'Studies & refs',
    gradient: 'from-indigo-600 to-blue-700',
    onClick: 'onResearch'
  },
];

export function QuickActions({ 
  onDoseTracker, 
  onBodyStats, 
  onCycles, 
  onPeptides,
  onBloodwork,
  onInventory,
  onResearch
}: QuickActionsProps) {
  const handlers: Record<string, () => void> = {
    onDoseTracker,
    onBodyStats,
    onCycles,
    onPeptides,
    onBloodwork,
    onInventory,
    onResearch: onResearch || (() => {}),
  };

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={handlers[action.onClick]}
            className={cn(
              "min-h-[7.25rem] flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-br text-white sm:p-4",
              "hover:scale-[1.02] hover:shadow-lg transition-all duration-200",
              action.gradient
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Icon size={20} />
            </div>
            <span className="font-medium text-xs text-center leading-tight">{action.label}</span>
            <span className="text-[9px] text-white/70 -mt-1 leading-tight">{action.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

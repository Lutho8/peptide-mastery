import { BookLock, Calculator, MessageCircleHeart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CompanionSection = 'measure' | 'ask' | 'journal' | 'confessions';

interface CompanionNavProps {
  active: CompanionSection;
  onChange: (section: CompanionSection) => void;
}

const sections = [
  { id: 'measure' as const, label: 'Measure', icon: Calculator },
  { id: 'ask' as const, label: 'Ask PepSA', icon: Sparkles },
  { id: 'journal' as const, label: 'Journal', icon: BookLock },
  { id: 'confessions' as const, label: 'Confessions', icon: MessageCircleHeart },
];

export function CompanionNav({ active, onChange }: CompanionNavProps) {
  return (
    <nav aria-label="Measurement and evidence tools" className="grid grid-cols-4 gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
      {sections.map((section) => {
        const Icon = section.icon;
        const selected = active === section.id;
        return (
          <button
            key={section.id}
            type="button"
            aria-current={selected ? 'page' : undefined}
            onClick={() => onChange(section.id)}
            className={cn(
              'flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition sm:min-h-11 sm:flex-row sm:gap-2 sm:text-sm',
              selected ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{section.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

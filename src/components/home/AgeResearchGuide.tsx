import { useMemo } from 'react';
import { ArrowRight, BookOpen, Stethoscope } from 'lucide-react';
import { getAgeResearchGuide } from '@/data/ageResearchGuides';
import { getUserProfile } from '@/services/storage';

interface AgeResearchGuideProps {
  onOpenResearch?: () => void;
}

export function AgeResearchGuide({ onOpenResearch }: AgeResearchGuideProps) {
  const profile = useMemo(() => getUserProfile(), []);
  const age = Number(profile.age) || 30;
  const guide = getAgeResearchGuide(age);

  return (
    <section className="rounded-2xl border border-primary/20 bg-card/60 p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpen size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">New-user research path</p>
          <h2 className="mt-1 text-base font-semibold text-foreground">{guide.title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{guide.intro}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {guide.topics.map((topic) => (
          <div key={`${guide.id}-${topic.label}`} className="rounded-xl border border-border/60 bg-background/40 p-3">
            <p className="text-[11px] text-muted-foreground">{topic.label}</p>
            <p className="mt-0.5 text-xs font-semibold text-foreground">{topic.compounds}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <Stethoscope size={14} className="mt-0.5 shrink-0 text-amber-500" />
        <p>This is an age-organized reading list, not a recommended stack, diagnosis, prescription or dosing plan. Age alone cannot determine suitability. Use the evidence library and route patient-specific decisions to a qualified healthcare professional.</p>
      </div>

      {onOpenResearch && (
        <button type="button" onClick={onOpenResearch} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 sm:w-auto">
          Review evidence and limitations <ArrowRight size={14} />
        </button>
      )}
    </section>
  );
}

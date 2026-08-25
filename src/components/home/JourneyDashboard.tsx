import { ArrowRight, BookOpen, CheckCircle2, FlaskConical, Headphones, Loader2, Route, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GradientCard } from '@/components/ui/GradientCard';
import type { CustomerPathway, DashboardSnapshot, ExperienceMode, JourneyEventName } from '@/hooks/useCustomerJourney';
import type { Json } from '@/integrations/supabase/types';

interface JourneyDashboardProps {
  snapshot: DashboardSnapshot | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectExperience: (mode: ExperienceMode) => Promise<boolean>;
  onSelectPathway: (pathway: Exclude<CustomerPathway, 'undecided'>) => Promise<boolean>;
  onTrack: (event: JourneyEventName, context?: Record<string, Json>) => Promise<void>;
  onResearch: () => void;
  onWorkspace: () => void;
}

function ChoiceCard({ icon: Icon, title, body, cta, onClick }: {
  icon: typeof Sparkles;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="min-h-44 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 active:scale-[0.99]">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={22} /></span>
      <span className="block text-base font-semibold text-foreground">{title}</span>
      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{body}</span>
      <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">{cta} <ArrowRight size={15} /></span>
    </button>
  );
}

export function JourneyDashboard({
  snapshot,
  isLoading,
  error,
  onRetry,
  onSelectExperience,
  onSelectPathway,
  onTrack,
  onResearch,
  onWorkspace,
}: JourneyDashboardProps) {
  if (isLoading) {
    return <div className="flex min-h-52 items-center justify-center rounded-2xl border border-border bg-card"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (error) {
    return (
      <GradientCard className="space-y-3 border border-destructive/30">
        <p className="font-semibold text-foreground">Dashboard temporarily unavailable</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={onRetry}>Try again</Button>
      </GradientCard>
    );
  }

  const journey = snapshot?.journey;
  if (!journey?.experience_mode) {
    return (
      <section className="space-y-4" aria-labelledby="journey-start-title">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5">
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary">Start here</Badge>
          <h2 id="journey-start-title" className="text-2xl font-bold text-foreground">What best describes you today?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">This choice changes the dashboard layout only. It does not recommend a product, treatment or dose.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard icon={Route} title="I’m new to peptides" body="Show me the clearest next step and explain the guided and research paths." cta="Guide me" onClick={() => { void onSelectExperience('new_to_peptides'); }} />
          <ChoiceCard icon={FlaskConical} title="I already track or research" body="Open a compact workspace for plans I already have, logs, inventory and source material." cta="Open Advanced Workspace" onClick={() => { void onSelectExperience('experienced'); }} />
        </div>
      </section>
    );
  }

  if (journey.experience_mode === 'new_to_peptides' && journey.pathway === 'undecided') {
    return (
      <section className="space-y-4" aria-labelledby="pathway-title">
        <div className="rounded-2xl border border-primary/20 bg-card p-5">
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary">Step 2 of 2</Badge>
          <h2 id="pathway-title" className="text-2xl font-bold text-foreground">Choose the right kind of help</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Clinical questions belong in the guided path. Independent catalogue research and recording an existing plan belong in the research path.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard icon={ShieldCheck} title="Guided pathway" body="Get routed to qualified support for suitability, treatment, monitoring and other clinical decisions." cta="Choose guided" onClick={() => { void onSelectPathway('guided'); }} />
          <ChoiceCard icon={BookOpen} title="Research pathway" body="Browse source-led catalogue material and use the app to record information you already have." cta="Choose research" onClick={() => { void onSelectPathway('research'); }} />
        </div>
      </section>
    );
  }

  if (journey.pathway === 'guided') {
    return (
      <GradientCard variant="primary" className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Headphones size={21} /></span>
          <div>
            <Badge variant="secondary" className="mb-2">Your next step</Badge>
            <h2 className="text-xl font-bold text-foreground">Request guided support</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Tell support what you are trying to understand. Suitability, treatment and monitoring decisions are routed to an appropriate professional.</p>
          </div>
        </div>
        <Button className="min-h-12 w-full sm:w-auto" onClick={() => {
          void onTrack('guided_support_requested');
          window.dispatchEvent(new CustomEvent('psa-open-support'));
        }}>Open guided support <ArrowRight className="ml-2" size={16} /></Button>
        <div className="grid gap-2 border-t border-primary/20 pt-4 text-xs text-muted-foreground sm:grid-cols-3">
          {['Share your question', 'Get routed correctly', 'Return here to track progress'].map((label) => <div key={label} className="flex items-center gap-2"><CheckCircle2 size={15} className="text-primary" />{label}</div>)}
        </div>
      </GradientCard>
    );
  }

  const experienced = journey.experience_mode === 'experienced';
  return (
    <GradientCard className="space-y-4 border border-primary/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="outline" className="mb-2 border-primary/30 text-primary">{experienced ? 'Advanced Workspace' : 'Research pathway'}</Badge>
          <h2 className="text-xl font-bold text-foreground">{experienced ? 'Your research and tracking workspace' : 'Start with source-led research'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{experienced ? `${snapshot?.workspace.stack_items ?? 0} recorded plan item${snapshot?.workspace.stack_items === 1 ? '' : 's'} · controls stay with you.` : 'Browse the catalogue first, then record only a plan you already have.'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          void onTrack('support_opened', { source: 'workspace' });
          window.dispatchEvent(new CustomEvent('psa-open-support'));
        }}>Need guided help?</Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button className="min-h-12 justify-between" onClick={() => { void onTrack('next_action_started', { action: 'research_library' }); onResearch(); }}>Browse research library <BookOpen size={17} /></Button>
        <Button variant="outline" className="min-h-12 justify-between" onClick={() => { void onTrack('workspace_entry', { entry: 'recorded_plan' }); onWorkspace(); }}>Open my recorded plan <ArrowRight size={17} /></Button>
      </div>
    </GradientCard>
  );
}

import { ArrowRight, Sparkles, Layers, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  ready: boolean;
  running: 'baseline' | 'deep' | null;
  onRun: (tier: 'baseline' | 'deep') => void;
}

export function ScanTierCards({ ready, running, onRun }: Props) {
  return (
    <div className="space-y-4 lg:sticky lg:top-20">
      <TierCard
        eyebrow="Free for all researchers"
        title="Baseline Scan"
        icon={Sparkles}
        description="Biomarker extraction across readable panels with conservative educational observations. No diagnosis, prescription or product recommendation."
        cta="Run baseline scan"
        ready={ready}
        running={running === 'baseline'}
        disabled={running !== null}
        onClick={() => onRun('baseline')}
        accent="primary"
      />
      <TierCard
        eyebrow="Free · advanced scan"
        title="Deep Decode"
        icon={Layers}
        description="Expanded extraction and bilingual observations across readable panels, designed to help you prepare focused questions for a qualified clinician."
        cta="Run deep decode"
        ready={ready}
        running={running === 'deep'}
        disabled={running !== null}
        onClick={() => onRun('deep')}
        accent="gradient"
      />
      {!ready && (
        <p className="text-[11px] text-muted-foreground text-center">
          Upload bloodwork and select at least one goal to continue.
        </p>
      )}
    </div>
  );
}

function TierCard({
  eyebrow,
  title,
  icon: Icon,
  description,
  cta,
  ready,
  running,
  disabled,
  onClick,
  accent,
}: {
  eyebrow: string;
  title: string;
  icon: React.ElementType;
  description: string;
  cta: string;
  ready: boolean;
  running: boolean;
  disabled: boolean;
  onClick: () => void;
  accent: 'primary' | 'gradient';
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 transition-all',
        accent === 'gradient'
          ? 'border-primary/40 bg-gradient-to-br from-primary/10 via-card/60 to-card/40'
          : 'border-border/60 bg-card/50'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-primary" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{eyebrow}</span>
      </div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>

      <button
        type="button"
        disabled={!ready || disabled}
        onClick={onClick}
        className={cn(
          'mt-5 w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold uppercase tracking-wider transition-all',
          ready && !disabled
            ? accent === 'gradient'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
              : 'bg-foreground text-background hover:opacity-90'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        )}
      >
        {running ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Analyzing…
          </>
        ) : (
          <>
            {cta} <ArrowRight size={14} />
          </>
        )}
      </button>
    </div>
  );
}

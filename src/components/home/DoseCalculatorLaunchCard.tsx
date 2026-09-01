import { ArrowRight, Calculator, Droplets, FlaskConical, ShieldCheck, Sparkles, Syringe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DoseCalculatorLaunchCardProps {
  onOpenCalculator: () => void;
  onAskPepSA: () => void;
}

const calculationSteps = [
  { label: 'Vial strength', detail: 'mg on the label', icon: FlaskConical },
  { label: 'Diluent', detail: 'mL stated or added', icon: Droplets },
  { label: 'Known dose', detail: 'mg or mcg', icon: ShieldCheck },
  { label: 'Draw-up', detail: 'mL and syringe units', icon: Syringe },
] as const;

export function DoseCalculatorLaunchCard({ onOpenCalculator, onAskPepSA }: DoseCalculatorLaunchCardProps) {
  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-primary p-3 text-primary-foreground shadow-sm">
            <Calculator className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Essential peptide tool</p>
            <h2 className="mt-1 text-xl font-bold text-foreground">Dose &amp; Reconstitution Calculator</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Turn exact vial, diluent and established-dose values into concentration, mL and the matching syringe marking—with a beginner walkthrough or advanced tracking view.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Calculator inputs and result">
          {calculationSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="rounded-xl border border-border/80 bg-background/75 p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span>{index + 1}. {step.label}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{step.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button type="button" className="min-h-11 sm:flex-1" onClick={onOpenCalculator}>
            Open calculator <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" className="min-h-11 sm:flex-1" onClick={onAskPepSA}>
            <Sparkles className="mr-2 h-4 w-4 text-primary" /> Ask PepSA first
          </Button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          The calculator checks measurement maths. It does not choose a compound, personal dose, diluent or treatment plan.
        </p>
      </div>
    </Card>
  );
}

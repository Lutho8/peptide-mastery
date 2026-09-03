import { AlertTriangle, BookOpen, CheckCircle2, CircleHelp, Route, ShieldCheck } from 'lucide-react';
import type { Peptide } from '@/data/peptides';
import { buildEvidencePassport, type PassportTone } from '@/lib/evidencePassport';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const toneClasses: Record<PassportTone, string> = {
  strong: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  developing: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  early: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  unknown: 'border-border bg-muted/50 text-muted-foreground',
  caution: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
};

const icons = {
  'human-evidence': BookOpen,
  'development-status': CheckCircle2,
  'identity-match': ShieldCheck,
  'route-match': Route,
  'safety-record': AlertTriangle,
} as const;

export function EvidencePassportCard({ peptide, compact = false }: { peptide: Peptide; compact?: boolean }) {
  const passport = buildEvidencePassport(peptide);

  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Evidence Passport</p>
            <h2 className={cn('mt-1 font-bold text-foreground', compact ? 'text-lg' : 'text-xl')}>{peptide.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Evidence strength, status, identity, route and safety are scored separately.</p>
          </div>
          <Badge variant="outline">Reviewed {passport.reviewedAt}</Badge>
        </div>
      </div>

      <div className={cn('grid gap-3 p-4 sm:p-5', compact ? 'sm:grid-cols-2' : 'md:grid-cols-2')}>
        {passport.dimensions.map((dimension) => {
          const Icon = icons[dimension.id];
          return (
            <div key={dimension.id} className={cn('rounded-xl border p-3', toneClasses[dimension.tone])}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <p className="text-xs font-semibold uppercase tracking-wider">{dimension.label}</p>
              </div>
              <p className="mt-2 text-sm font-semibold">{dimension.value}</p>
              {!compact && <p className="mt-1 text-xs leading-relaxed opacity-90">{dimension.detail}</p>}
            </div>
          );
        })}
      </div>

      {!compact && (
        <div className="border-t border-border bg-muted/20 p-4 sm:px-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground"><CircleHelp className="h-4 w-4 text-primary" />What is still missing?</div>
          {passport.gaps.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              {passport.gaps.map((gap) => <li key={gap}>• {gap}</li>)}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">No major catalogue gap is flagged, but personal suitability and product quality remain separate.</p>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">{passport.sourceCount} app-verified source{passport.sourceCount === 1 ? '' : 's'} linked · Version {passport.version}</p>
        </div>
      )}
    </Card>
  );
}

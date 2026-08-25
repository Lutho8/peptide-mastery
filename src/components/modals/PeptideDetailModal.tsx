import { AlertTriangle, ExternalLink, FileText, FlaskConical, Shield } from 'lucide-react';
import { AIAgentPanel } from '@/components/ai/AIAgentPanel';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GradientCard } from '@/components/ui/GradientCard';
import type { Peptide } from '@/data/peptides';

interface PeptideDetailModalProps {
  peptide: Peptide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function referenceHref(reference: string) {
  const pmid = reference.match(/(?:PMID:\s*)?(\d{5,})/i)?.[1];
  return pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null;
}

export function PeptideDetailModal({ peptide, open, onOpenChange }: PeptideDetailModalProps) {
  return (
    <Dialog open={open && Boolean(peptide)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-background">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="text-foreground">{peptide?.name}</DialogTitle>
              {peptide && peptide.shortName !== peptide.name && (
                <p className="text-sm text-muted-foreground">Also known as {peptide.shortName}</p>
              )}
            </div>
            {peptide && <CategoryBadge category={peptide.category} showCount={false} />}
          </div>
        </DialogHeader>

        {peptide && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
              This is a catalogue record, not a product recommendation or personal plan. It deliberately omits dosage, timing and outcome predictions.
            </div>

            <GradientCard>
              <div className="mb-2 flex items-center gap-2">
                <FlaskConical size={16} className="text-primary" />
                <h3 className="font-medium text-foreground">Mechanism described in the catalogue</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{peptide.mechanism}</p>
            </GradientCard>

            <GradientCard>
              <div className="mb-2 flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <h3 className="font-medium text-foreground">Research topics</h3>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                These labels organise source material. They are not claimed benefits, expected results or suitability criteria.
              </p>
              <ul className="space-y-2">
                {peptide.benefits.slice(0, 6).map((topic) => (
                  <li key={topic} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1 text-primary">•</span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </GradientCard>

            <GradientCard>
              <div className="mb-2 flex items-center gap-2">
                <Shield size={16} className="text-amber-500" />
                <h3 className="font-medium text-foreground">Limitations and cautions in the record</h3>
              </div>
              <ul className="space-y-2">
                {[...(peptide.warnings ?? []), ...peptide.risks, ...(peptide.contraindications ?? [])]
                  .slice(0, 8)
                  .map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
                      <span>{item}</span>
                    </li>
                  ))}
              </ul>
            </GradientCard>

            {peptide.notableStudies && peptide.notableStudies.length > 0 && (
              <GradientCard>
                <div className="mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <h3 className="font-medium text-foreground">Catalogue study records</h3>
                </div>
                <div className="space-y-3">
                  {peptide.notableStudies.slice(0, 5).map((study) => (
                    <div key={`${study.title}-${study.year}`} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <p className="text-sm font-medium text-foreground">{study.title} ({study.year})</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{study.finding}</p>
                      {study.doi && (
                        <a
                          href={`https://doi.org/${study.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Open DOI <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </GradientCard>
            )}

            {peptide.references && peptide.references.length > 0 && (
              <GradientCard>
                <h3 className="mb-2 font-medium text-foreground">Reference identifiers</h3>
                <div className="flex flex-wrap gap-2">
                  {peptide.references.slice(0, 8).map((reference) => {
                    const href = referenceHref(reference);
                    return href ? (
                      <a
                        key={reference}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-primary/15 px-2 py-1 text-xs text-primary hover:bg-primary/25"
                      >
                        {reference} <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span key={reference} className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{reference}</span>
                    );
                  })}
                </div>
              </GradientCard>
            )}

            <AIAgentPanel peptideId={peptide.id} peptideName={peptide.name} />

            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Medical disclaimer:</strong> The app does not diagnose, prescribe, select a product or supply a dosage. Route patient-specific decisions to a qualified healthcare professional.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

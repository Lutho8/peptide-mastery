import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GradientCard } from '@/components/ui/GradientCard';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Peptide } from '@/data/peptides';
import { getCycleSuggestion } from '@/data/cycleSuggestions';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, FlaskConical, ShoppingCart, AlertTriangle, 
  Clock, Syringe, ExternalLink, Layers, FileText, 
  Calendar, Activity, Users, Brain, Scale, TestTube, Shield, Thermometer, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIAgentPanel } from '@/components/ai/AIAgentPanel';
import { RecommendedDoseDisplay } from '@/components/dosage/RecommendedDoseDisplay';
import { VialSizeSelector } from '@/components/peptide/VialSizeSelector';
import { getVialSizesFor } from '@/data/vialSizes';

interface PeptideDetailModalProps {
  peptide: Peptide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PeptideDetailModal({ peptide, open, onOpenChange }: PeptideDetailModalProps) {
  const cycleSuggestion = peptide ? getCycleSuggestion(peptide.id) : null;

  return (
    <Dialog open={open && !!peptide} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-foreground">{peptide?.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">({peptide?.shortName})</p>
            </div>
            {peptide && <CategoryBadge category={peptide.category} showCount={false} />}
          </div>
        </DialogHeader>

        {peptide && (
          <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-card border border-border">
              <Star size={18} className="mx-auto text-warning fill-warning mb-1" />
              <p className="text-lg font-bold text-foreground">{peptide.longevityScore}/10</p>
              <p className="text-xs text-muted-foreground">Longevity Score</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-card border border-border">
              <Clock size={18} className="mx-auto text-primary mb-1" />
              <p className="text-sm font-bold text-foreground">{peptide.halfLife || 'Varies'}</p>
              <p className="text-xs text-muted-foreground">Half-life</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-card border border-border">
              <Syringe size={18} className="mx-auto text-primary mb-1" />
              <p className="text-sm font-bold text-foreground">{peptide.frequency}</p>
              <p className="text-xs text-muted-foreground">Frequency</p>
            </div>
          </div>

          {/* Legal & Clinical Status */}
          {(peptide.legalStatus || peptide.clinicalStatus) && (
            <GradientCard>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-primary" />
                <h3 className="font-medium text-foreground">Legal & Clinical Status</h3>
              </div>
              <div className="space-y-3">
                {peptide.clinicalStatus && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Clinical Stage</span>
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full font-medium',
                      peptide.clinicalStatus === 'approved' && 'bg-green-500/20 text-green-400',
                      peptide.clinicalStatus === 'phase3' && 'bg-blue-500/20 text-blue-400',
                      peptide.clinicalStatus === 'phase2' && 'bg-yellow-500/20 text-yellow-400',
                      peptide.clinicalStatus === 'phase1' && 'bg-orange-500/20 text-orange-400',
                      peptide.clinicalStatus === 'preclinical' && 'bg-red-500/20 text-red-400'
                    )}>
                      {peptide.clinicalStatus === 'approved' ? 'FDA Approved' : peptide.clinicalStatus.replace('phase', 'Phase ')}
                    </span>
                  </div>
                )}
                {peptide.fdaApproved && peptide.fdaApprovalYear && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">FDA Approval</span>
                    <span className="text-sm text-green-400 font-medium">Approved ({peptide.fdaApprovalYear})</span>
                  </div>
                )}
                {peptide.legalStatus && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="p-2 rounded bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">USA</p>
                      <p className={cn(
                        'text-xs font-medium',
                        peptide.legalStatus.usa === 'approved' && 'text-green-400',
                        peptide.legalStatus.usa === 'prescription' && 'text-blue-400',
                        peptide.legalStatus.usa === 'research-only' && 'text-yellow-400',
                        peptide.legalStatus.usa === 'banned' && 'text-red-400'
                      )}>
                        {peptide.legalStatus.usa.replace('-', ' ')}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">EU</p>
                      <p className="text-xs text-foreground">{peptide.legalStatus.eu.slice(0, 15)}{peptide.legalStatus.eu.length > 15 ? '...' : ''}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Australia</p>
                      <p className="text-xs text-foreground">{peptide.legalStatus.australia.slice(0, 12)}{peptide.legalStatus.australia.length > 12 ? '...' : ''}</p>
                    </div>
                  </div>
                )}
              </div>
            </GradientCard>
          )}

          {/* Amino Acid Sequence */}
          {peptide.aminoAcidSequence && (
            <GradientCard>
              <div className="flex items-center gap-2 mb-2">
                <TestTube size={16} className="text-primary" />
                <h3 className="font-medium text-foreground">Amino Acid Sequence</h3>
              </div>
              <p className="text-xs font-mono text-muted-foreground bg-muted/50 p-2 rounded break-all">
                {peptide.aminoAcidSequence}
              </p>
            </GradientCard>
          )}

          {/* Storage & Bioavailability */}
          {(peptide.storageRequirements || peptide.bioavailability) && (
            <div className="grid grid-cols-2 gap-3">
              {peptide.bioavailability && (
                <div className="p-3 rounded-lg bg-card border border-border">
                  <Scale size={14} className="text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">Bioavailability</p>
                  <p className="text-sm text-foreground">{peptide.bioavailability}</p>
                </div>
              )}
              {peptide.storageRequirements && (
                <div className="p-3 rounded-lg bg-card border border-border">
                  <Thermometer size={14} className="text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">Storage</p>
                  <p className="text-sm text-foreground">{peptide.storageRequirements.slice(0, 40)}...</p>
                </div>
              )}
            </div>
          )}

          {/* AI Research Agent */}
          <AIAgentPanel
            mode="research"
            peptideId={peptide.id}
            peptideName={peptide.name}
          />

          {/* Notable Studies */}
          {peptide.notableStudies && peptide.notableStudies.length > 0 && (
            <GradientCard>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={16} className="text-primary" />
                <h3 className="font-medium text-foreground">Notable Studies</h3>
              </div>
              <div className="space-y-3">
                {peptide.notableStudies.map((study, i) => (
                  <div key={i} className="p-3 rounded bg-muted/50 border border-border/50">
                    <p className="text-sm font-medium text-foreground mb-1">{study.title}</p>
                    <p className="text-xs text-muted-foreground mb-2">{study.finding}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Year: {study.year}</span>
                      {study.doi && (
                        <a
                          href={`https://doi.org/${study.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          DOI <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GradientCard>
          )}

          {/* Warnings */}
          {peptide.warnings && peptide.warnings.length > 0 && (
            <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-orange-400" />
                <h3 className="font-medium text-orange-400">Important Warnings</h3>
              </div>
              <ul className="space-y-1">
                {peptide.warnings.map((warning, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-orange-400/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mechanism */}
          <GradientCard className="premium-border">
            <h3 className="font-medium text-foreground mb-2">Mechanism of Action</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{peptide.mechanism}</p>
          </GradientCard>

          {/* Benefits */}
          <GradientCard>
            <h3 className="font-medium text-foreground mb-2">Benefits</h3>
            <ul className="space-y-1">
              {peptide.benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </GradientCard>

          {/* Athlete Benefits */}
          <GradientCard variant="primary">
            <h3 className="font-medium text-foreground mb-2">Athlete-Specific Benefits</h3>
            <ul className="space-y-1">
              {peptide.athleteBenefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </GradientCard>

          {/* Cycle Suggestions */}
          {cycleSuggestion && (
            <GradientCard>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-primary" />
                <h3 className="font-medium text-foreground">Recommended Cycles</h3>
              </div>
              <Tabs defaultValue="intermediate" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50 mb-3">
                  <TabsTrigger value="beginner" className="text-xs">Beginner</TabsTrigger>
                  <TabsTrigger value="intermediate" className="text-xs">Inter</TabsTrigger>
                  <TabsTrigger value="advanced" className="text-xs">Adv</TabsTrigger>
                  <TabsTrigger value="athlete" className="text-xs">Athlete</TabsTrigger>
                </TabsList>
                {cycleSuggestion.protocols.map((protocol) => (
                  <TabsContent key={protocol.level} value={protocol.level} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Dose</p>
                        <p className="text-foreground font-medium">{protocol.dose}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Frequency</p>
                        <p className="text-foreground font-medium">{protocol.frequency}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Cycle Length</p>
                        <p className="text-foreground font-medium">{protocol.cycleDuration} days</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Break</p>
                        <p className="text-foreground font-medium">{protocol.breakDuration} days</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic">{protocol.notes}</p>
                    {protocol.bloodworkBefore.length > 0 && (
                      <div className="flex items-start gap-2 text-xs">
                        <Activity size={12} className="text-primary mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">Bloodwork before: </span>
                          <span className="text-foreground">{protocol.bloodworkBefore.join(', ').toUpperCase()}</span>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>

              {/* Stack Suggestions */}
              {cycleSuggestion.stackSuggestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={14} className="text-primary" />
                    <h4 className="text-sm font-medium text-foreground">Recommended Stacks</h4>
                  </div>
                  {cycleSuggestion.stackSuggestions.map((stack, i) => (
                    <div key={i} className="p-2 rounded bg-muted/30 mb-2">
                      <p className="text-xs text-foreground font-medium">{stack.rationale}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stack.synergy}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {cycleSuggestion.warnings.length > 0 && (
                <div className="mt-3 p-2 rounded bg-warning/10 border border-warning/30">
                  <div className="flex items-center gap-1 mb-1">
                    <AlertTriangle size={12} className="text-warning" />
                    <span className="text-xs font-medium text-warning">Important</span>
                  </div>
                  <ul className="space-y-0.5">
                    {cycleSuggestion.warnings.map((warning, i) => (
                      <li key={i} className="text-xs text-warning/80">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </GradientCard>
          )}

          {/* Expected Results Timeline */}
          <GradientCard>
            <h3 className="font-medium text-foreground mb-3">Expected Results Timeline</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-muted/50">
                <p className="text-primary font-medium">Week 1-2</p>
                <p className="text-muted-foreground">{peptide.expectedResults.week1_2}</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <p className="text-primary font-medium">Week 3-4</p>
                <p className="text-muted-foreground">{peptide.expectedResults.week3_4}</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <p className="text-primary font-medium">Week 5-8</p>
                <p className="text-muted-foreground">{peptide.expectedResults.week5_8}</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <p className="text-primary font-medium">Long-term</p>
                <p className="text-muted-foreground">{peptide.expectedResults.longTerm}</p>
              </div>
            </div>
          </GradientCard>

          {/* Dosing Tiers */}
          <GradientCard>
            <h3 className="font-medium text-foreground mb-3">Dosing Tiers</h3>
            {(() => {
              const sizes = peptide.vialSizesMg ?? getVialSizesFor(peptide.id);
              return sizes && sizes.length > 1 ? (
                <VialSizeSelector peptideId={peptide.id} sizes={sizes} className="mb-3" />
              ) : null;
            })()}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="p-2 rounded bg-muted/50">
                <p className="text-muted-foreground text-xs">Beginner</p>
                <RecommendedDoseDisplay doseString={peptide.dosing.beginner} peptideId={peptide.id} />
              </div>
              <div className="p-2 rounded bg-muted/50">
                <p className="text-muted-foreground text-xs">Intermediate</p>
                <RecommendedDoseDisplay doseString={peptide.dosing.intermediate} peptideId={peptide.id} />
              </div>
              <div className="p-2 rounded bg-muted/50">
                <p className="text-muted-foreground text-xs">Advanced</p>
                <RecommendedDoseDisplay doseString={peptide.dosing.advanced} peptideId={peptide.id} />
              </div>
              <div className="p-2 rounded bg-primary/20 border border-primary/30">
                <p className="text-primary text-xs">Athlete</p>
                <RecommendedDoseDisplay doseString={peptide.dosing.athlete} peptideId={peptide.id} />
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <p><strong>Frequency:</strong> {peptide.frequency}</p>
              <p><strong>Administration:</strong> {peptide.administration}</p>
              {peptide.recommendedDuration && (
                <p><strong>Recommended Duration:</strong> {peptide.recommendedDuration}</p>
              )}
            </div>
          </GradientCard>

          {/* Risks */}
          <div className="p-4 rounded-xl border border-warning/30 bg-warning/10">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-warning" />
              <h3 className="font-medium text-warning">Risks & Considerations</h3>
            </div>
            <ul className="space-y-1">
              {peptide.risks.map((risk, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-warning/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>

          {/* Janoshik Test Results */}
          {peptide.janoshikTested && (
            <GradientCard>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FlaskConical size={16} className="text-primary" />
                  <h3 className="font-medium text-foreground">Janoshik Test Results</h3>
                </div>
                <StatusBadge status="verified" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                {peptide.janoshikPurity && (
                  <div>
                    <p className="text-muted-foreground">Purity</p>
                    <p className="text-2xl font-bold text-primary">{peptide.janoshikPurity}%</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Test Date</p>
                  <p className="text-foreground font-medium">{peptide.janoshikDate}</p>
                </div>
              </div>

              {/* COA Details */}
              {peptide.janoshikCOA && peptide.janoshikCOA.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Certificates of Analysis</p>
                  {peptide.janoshikCOA.map((coa, i) => (
                    <div key={i} className="bg-muted/30 rounded-md p-2.5 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{coa.sampleName}</span>
                        <span className="text-muted-foreground">{coa.testDate}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
                        <span>Measured: <span className="text-foreground font-medium">{coa.measuredAmount}</span></span>
                        {coa.purity && <span>Purity: <span className="text-foreground font-medium">{coa.purity}</span></span>}
                        <span>Task: <span className="text-foreground font-mono">{coa.taskNumber}</span></span>
                        {coa.verifyKey && (
                          <a
                            href={`https://www.janoshik.com/verify/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Verify: {coa.verifyKey}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  <Link
                    to="/bloodwork"
                    className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                    onClick={() => onOpenChange(false)}
                  >
                    <Shield size={12} />
                    View bloodwork analysis →
                  </Link>
                </div>
              )}
            </GradientCard>
          )}

          {/* Supplier Info */}
          <GradientCard>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">Supplier Info</h3>
              <StatusBadge status={peptide.supplier.stock} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-muted-foreground">Supplier</p>
                <p className="text-foreground">{peptide.supplier.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Product Code</p>
                <p className="text-foreground font-mono">{peptide.supplier.productCode}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Price</p>
                <p className="text-2xl font-bold text-foreground">${peptide.supplier.price}</p>
              </div>
            </div>
            <Button className="w-full gap-2" asChild>
              <a href="https://peptide-south-africa.com?utm_source=tracker&utm_medium=peptide_modal&utm_campaign=buy_peptides" target="_blank" rel="noopener noreferrer">
                <ShoppingCart size={16} />
                Buy Peptides
                <ExternalLink size={14} />
              </a>
            </Button>
          </GradientCard>

          {/* Research References */}
          {peptide.references && peptide.references.length > 0 && (
            <GradientCard>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-primary" />
                <h3 className="font-medium text-foreground">Research References</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {peptide.references.map((ref, i) => (
                  <a
                    key={i}
                    href={`https://pubmed.ncbi.nlm.nih.gov/${ref.replace('PMID: ', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                  >
                    {ref}
                  </a>
                ))}
              </div>
            </GradientCard>
          )}

          {/* Personal Notes */}
          <GradientCard>
            <h3 className="font-medium text-foreground mb-2">Personal Notes</h3>
            <p className="text-sm text-muted-foreground italic">No notes added yet. Tap to add your observations.</p>
          </GradientCard>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

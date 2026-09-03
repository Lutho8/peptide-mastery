import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, ExternalLink, FlaskConical, Save, Scale, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { peptides, type Peptide } from '@/data/peptides';
import { goalLabels, goalToCategories } from '@/data/goalMap';
import { topPeptidesSlugs } from '@/data/entitySlugs';
import { buildEvidencePacket } from '@/lib/evidenceCompanion';
import { buildEvidencePassport, compareByEvidence } from '@/lib/evidencePassport';
import { useAuth } from '@/contexts/AuthContext';
import { saveResearchItems, recordResearchWorkspaceEvent } from '@/services/researchWorkspace';
import type { Json } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

const MAX_COMPARE = 3;

const researchPeptides = Array.from(
  peptides.reduce((byCompound, peptide) => {
    const compoundKey = peptide.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const current = byCompound.get(compoundKey);
    if (!current || compareByEvidence(peptide, current) < 0) byCompound.set(compoundKey, peptide);
    return byCompound;
  }, new Map<string, Peptide>()),
  ([, peptide]) => peptide,
);

function slugFor(peptideId: string): string | undefined {
  return Object.entries(topPeptidesSlugs).find(([, id]) => id === peptideId)?.[0];
}

function scoreLabel(peptide: Peptide): string {
  const human = buildEvidencePassport(peptide).dimensions.find((dimension) => dimension.id === 'human-evidence');
  return human?.value ?? 'Evidence review pending';
}

export default function ResearchComparePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialIds = (searchParams.get('peptides') ?? '').split(',').filter((id) => researchPeptides.some((peptide) => peptide.id === id)).slice(0, MAX_COMPARE);
  const initialPeptide = researchPeptides.find((peptide) => peptide.id === initialIds[0]);
  const inferredGoal = Object.entries(goalToCategories).find(([, categories]) => initialPeptide && categories.includes(initialPeptide.category))?.[0];
  const requestedGoal = searchParams.get('goal');
  const [goalId, setGoalId] = useState(requestedGoal && goalToCategories[requestedGoal] ? requestedGoal : inferredGoal ?? 'fat-loss');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [saving, setSaving] = useState(false);

  const candidates = useMemo(() => {
    const categories = new Set(goalToCategories[goalId] ?? []);
    return researchPeptides.filter((peptide) => categories.has(peptide.category)).sort(compareByEvidence).slice(0, 12);
  }, [goalId]);

  useEffect(() => {
    if (selectedIds.length > 0) return;
    setSelectedIds(candidates.slice(0, MAX_COMPARE).map((peptide) => peptide.id));
  }, [candidates, selectedIds.length]);

  useEffect(() => {
    const next = new URLSearchParams();
    next.set('goal', goalId);
    if (selectedIds.length) next.set('peptides', selectedIds.join(','));
    setSearchParams(next, { replace: true });
    if (user) void recordResearchWorkspaceEvent(user.id, 'research_comparison_viewed', { goal_id: goalId, peptide_ids: selectedIds });
  }, [goalId, selectedIds, setSearchParams, user]);

  const selected = useMemo(
    () => selectedIds.map((id) => researchPeptides.find((peptide) => peptide.id === id)).filter((peptide): peptide is Peptide => Boolean(peptide)),
    [selectedIds],
  );

  const changeGoal = (nextGoal: string) => {
    setGoalId(nextGoal);
    const categories = new Set(goalToCategories[nextGoal] ?? []);
    setSelectedIds(researchPeptides.filter((peptide) => categories.has(peptide.category)).sort(compareByEvidence).slice(0, MAX_COMPARE).map((peptide) => peptide.id));
  };

  const togglePeptide = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= MAX_COMPARE) {
        toast.info(`Compare up to ${MAX_COMPARE} compounds at a time.`);
        return current;
      }
      return [...current, id];
    });
  };

  const savePlan = async () => {
    if (!user) {
      navigate('/dashboard', { state: { openAuth: true } });
      return;
    }
    if (!selected.length) return;
    setSaving(true);
    try {
      await saveResearchItems(selected.map((peptide) => {
        const passport = buildEvidencePassport(peptide);
        return {
          user_id: user.id,
          peptide_id: peptide.id,
          goal_id: goalId,
          evidence_version: passport.version,
          evidence_snapshot: passport as unknown as Json,
        };
      }));
      void recordResearchWorkspaceEvent(user.id, 'research_plan_saved', { goal_id: goalId, peptide_ids: selected.map((peptide) => peptide.id) });
      toast.success('Saved to your research plan with the current evidence version.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Research plan could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Compare Peptide Evidence by Goal | Peptide South Africa"
        description="Compare reviewed human evidence, development status, route relevance, safety records and visible evidence gaps for peptide research options."
        canonical="https://peptide-south-africa.co.za/research/compare"
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
        </Button>

        <header className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-accent/10 p-5 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Evidence comparison</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Build your best-evidence research stack.</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">Start with a goal, compare up to three compounds, then save the evidence snapshot you reviewed. Ranking reflects evidence maturity—not personal suitability, product quality or a dosing recommendation.</p>
            </div>
            <div className="w-full lg:w-72">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selected goal</label>
              <Select value={goalId} onValueChange={changeGoal}>
                <SelectTrigger className="min-h-12 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(goalLabels).map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <section className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-xl font-bold text-foreground">Best-supported options for {goalLabels[goalId]}</h2><p className="mt-1 text-sm text-muted-foreground">Select up to three. Stronger reviewed human evidence appears first.</p></div>
            <Badge variant="outline">{selected.length}/{MAX_COMPARE} selected</Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((peptide) => {
              const active = selectedIds.includes(peptide.id);
              const passport = buildEvidencePassport(peptide);
              return (
                <button key={peptide.id} type="button" onClick={() => togglePeptide(peptide.id)} className={cn('rounded-2xl border p-4 text-left transition', active ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-card hover:border-primary/40')}>
                  <span className="flex items-start justify-between gap-3"><span><span className="block font-semibold text-foreground">{peptide.name}</span><span className="mt-1 block text-xs text-muted-foreground">{scoreLabel(peptide)}</span></span><span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}><Check className={cn('h-3.5 w-3.5', !active && 'opacity-0')} /></span></span>
                  <span className="mt-3 block text-[11px] text-muted-foreground">{passport.sourceCount} verified source{passport.sourceCount === 1 ? '' : 's'} · {passport.gaps.length} visible gap{passport.gaps.length === 1 ? '' : 's'}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold text-foreground">Side-by-side evidence</h2></div>
          {selected.length === 0 ? <Card className="mt-4 border-dashed p-8 text-center text-sm text-muted-foreground">Choose at least one compound to compare.</Card> : (
            <div className={cn('mt-4 grid gap-4', selected.length === 2 && 'md:grid-cols-2', selected.length >= 3 && 'lg:grid-cols-3')}>
              {selected.map((peptide) => {
                const passport = buildEvidencePassport(peptide);
                const packet = buildEvidencePacket(peptide.id);
                const protocols = packet?.sources.filter((source) => source.studiedProtocol) ?? [];
                const slug = slugFor(peptide.id);
                return (
                  <Card key={peptide.id} className="overflow-hidden">
                    <div className="border-b border-border bg-muted/30 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-foreground">{peptide.name}</h3><p className="mt-1 text-xs text-muted-foreground">Evidence version {passport.version}</p></div><FlaskConical className="h-5 w-5 text-primary" /></div></div>
                    <div className="space-y-3 p-4">
                      {passport.dimensions.map((dimension) => <div key={dimension.id}><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{dimension.label}</p><p className="mt-0.5 text-sm font-medium text-foreground">{dimension.value}</p></div>)}
                      <div className="border-t border-border pt-3"><p className="flex items-center gap-1.5 text-xs font-semibold text-foreground"><ShieldAlert className="h-3.5 w-3.5 text-amber-500" />Visible evidence gaps</p><ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">{passport.gaps.slice(0, 3).map((gap) => <li key={gap}>• {gap}</li>)}</ul></div>
                      <div className="border-t border-border pt-3"><p className="flex items-center gap-1.5 text-xs font-semibold text-foreground"><BookOpen className="h-3.5 w-3.5 text-primary" />Published protocol examples</p>{protocols.length ? protocols.slice(0, 2).map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="mt-2 block rounded-lg border border-border p-2 text-xs text-muted-foreground hover:border-primary/40"><strong className="text-foreground">{source.label}:</strong> {source.studiedProtocol}<ExternalLink className="ml-1 inline h-3 w-3" /></a>) : <p className="mt-2 text-xs text-muted-foreground">No verified human study protocol is recorded. The app does not substitute catalogue dosing.</p>}</div>
                      {slug && <Button asChild variant="ghost" size="sm" className="w-full"><Link to={`/peptides/${slug}`}>Open full Evidence Passport</Link></Button>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <Card className="mt-6 border-amber-500/25 bg-amber-500/5 p-4 text-sm text-muted-foreground">
          <strong className="text-foreground">Research stack, not prescribed stack.</strong> Compounds are ranked by the strength of the app’s reviewed evidence record. Combining them can introduce interactions not studied in the individual sources; run compatibility and safety checks before recording an existing plan.
        </Card>

        <div className="sticky bottom-4 mt-6 flex justify-center">
          <Button size="lg" className="min-h-12 w-full max-w-md shadow-lg" disabled={!selected.length || saving} onClick={() => void savePlan()}><Save className="mr-2 h-4 w-4" />{saving ? 'Saving evidence snapshot…' : user ? 'Save to my research plan' : 'Sign in to save this research plan'}</Button>
        </div>
      </div>
    </div>
  );
}

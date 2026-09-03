import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, FlaskConical, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { peptides } from '@/data/peptides';
import { goalLabels } from '@/data/goalMap';
import { deleteResearchSave, listResearchSaves, type ResearchSave } from '@/services/researchWorkspace';

export function SavedResearchPlanCard() {
  const [items, setItems] = useState<ResearchSave[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setItems(await listResearchSaves()); }
    catch (error) { console.warn('[Research plan] Could not load:', error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const remove = async (item: ResearchSave) => {
    try {
      await deleteResearchSave(item.id);
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      toast.success('Removed from your research plan.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Research item could not be removed.'); }
  };

  if (loading) return <Card className="flex min-h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></Card>;

  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-primary/5 p-4 sm:p-5">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><BookMarked className="h-5 w-5" /></div><div><p className="font-semibold text-foreground">My research plan</p><p className="mt-1 text-xs text-muted-foreground">Saved evidence snapshots stay separate from your active recorded stack.</p></div></div>
        <Button asChild variant="outline" size="sm"><Link to="/research/compare">Compare evidence</Link></Button>
      </div>
      {items.length === 0 ? <div className="p-5 text-sm text-muted-foreground">No research options saved yet. Compare compounds first, then bring only an existing decided plan into tracking.</div> : <div className="divide-y divide-border">{items.map((item) => {
        const peptide = peptides.find((candidate) => candidate.id === item.peptide_id);
        return <div key={item.id} className="flex items-center gap-3 p-4"><FlaskConical className="h-4 w-4 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{peptide?.name || item.peptide_id}</p><p className="mt-0.5 text-xs text-muted-foreground">{goalLabels[item.goal_id] || item.goal_id} · Evidence {item.evidence_version}</p></div><Badge variant="outline" className="hidden sm:inline-flex"><ShieldCheck className="mr-1 h-3 w-3" />Not active</Badge><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${peptide?.name || item.peptide_id} from research plan`} onClick={() => void remove(item)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></div>;
      })}</div>}
      {items.length > 0 && <div className="grid gap-2 border-t border-border bg-muted/20 p-4 sm:grid-cols-2"><Button asChild variant="outline"><Link to="/dashboard?screen=measurement&tool=ask"><ShieldCheck className="mr-2 h-4 w-4" />Review evidence and safety</Link></Button><Button asChild><Link to="/dashboard?screen=stack">Record an existing decided plan</Link></Button></div>}
    </Card>
  );
}

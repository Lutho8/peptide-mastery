import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, MessageCircleHeart, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  listConfessions,
  moderateConfession,
  type CommunityConfession,
} from '@/services/researchCompanion';

type ReviewFilter = 'pending' | 'published' | 'rejected' | 'all';

const categoryLabels: Record<string, string> = {
  what_helped: 'What helped',
  what_surprised_me: 'What surprised me',
  what_i_wish_i_knew: 'What I wish I knew',
  side_effects: 'Side effects & setbacks',
  measurement_lesson: 'Measurement lesson',
};

export default function ConfessionsModeration() {
  const [items, setItems] = useState<CommunityConfession[]>([]);
  const [filter, setFilter] = useState<ReviewFilter>('pending');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listConfessions());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Confessions could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const counts = useMemo(() => ({
    pending: items.filter((item) => item.moderation_status === 'pending').length,
    published: items.filter((item) => item.moderation_status === 'published').length,
    rejected: items.filter((item) => item.moderation_status === 'rejected').length,
    all: items.length,
  }), [items]);

  const visible = useMemo(
    () => filter === 'all' ? items : items.filter((item) => item.moderation_status === filter),
    [filter, items],
  );

  const review = async (item: CommunityConfession, status: 'published' | 'rejected') => {
    const note = notes[item.id]?.trim() || '';
    if (status === 'rejected' && note.length < 5) {
      toast.error('Add a short reviewer note before rejecting a submission.');
      return;
    }
    setReviewingId(item.id);
    try {
      const updated = await moderateConfession(item.id, status, note || null);
      setItems((current) => current.map((candidate) => candidate.id === item.id ? updated : candidate));
      toast.success(status === 'published' ? 'Confession published to the free feed.' : 'Confession rejected with feedback.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The review could not be saved.');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><MessageCircleHeart className="h-5 w-5 text-rose-600" />Confessions moderation</CardTitle>
            <CardDescription className="mt-1">Review personal experiences before they appear in the free public feed.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Moderation status">
            {(['pending', 'published', 'rejected', 'all'] as const).map((status) => (
              <button key={status} type="button" aria-pressed={filter === status} onClick={() => setFilter(status)} className={filter === status ? 'rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground' : 'rounded-full border border-border px-3 py-2 text-xs font-medium text-muted-foreground'}>
                {status[0].toUpperCase() + status.slice(1)} · {counts[status]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="flex min-h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></Card>
      ) : visible.length === 0 ? (
        <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">No {filter === 'all' ? '' : filter} confessions.</Card>
      ) : (
        <div className="space-y-4">
          {visible.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{item.moderation_status}</Badge>
                  <Badge variant="secondary">{categoryLabels[item.category] || item.category}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <CardTitle className="pt-2 text-lg">{item.title}</CardTitle>
                <CardDescription>{item.is_anonymous ? 'Anonymous researcher' : item.display_alias}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{item.body}</p>
                {item.peptide_ids.length > 0 && <p className="text-xs text-muted-foreground">Compound IDs: {item.peptide_ids.join(', ')}</p>}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                  <span className="flex gap-2"><ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />Reject personal identifiers, sales/contact details, unsupported claims, or instructions telling others what dose or treatment to use.</span>
                </div>
                <Textarea aria-label={`Reviewer note for ${item.title}`} value={notes[item.id] ?? item.moderation_note ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Reviewer note (required for rejection; optional for publication)" rows={2} maxLength={500} />
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" className="border-destructive/30 text-destructive" disabled={reviewingId === item.id} onClick={() => void review(item, 'rejected')}><X className="mr-2 h-4 w-4" />Reject</Button>
                  <Button type="button" disabled={reviewingId === item.id} onClick={() => void review(item, 'published')}>{reviewingId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Publish</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

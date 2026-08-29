import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Loader2,
  MessageCircleHeart,
  PenLine,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import type { SelectablePeptide } from '@/data/blendAdapters';
import {
  deleteConfession,
  listConfessions,
  recordCompanionEvent,
  submitConfession,
  type CommunityConfession,
} from '@/services/researchCompanion';

interface ConfessionsPanelProps {
  compounds: SelectablePeptide[];
  selectedCompoundId?: string;
  publicView?: boolean;
  onSignIn?: () => void;
}

const categories = [
  { id: 'what_helped', label: 'What helped' },
  { id: 'what_surprised_me', label: 'What surprised me' },
  { id: 'what_i_wish_i_knew', label: 'What I wish I knew' },
  { id: 'side_effects', label: 'Side effects & setbacks' },
  { id: 'measurement_lesson', label: 'Measurement lesson' },
] as const;

type ConfessionCategory = typeof categories[number]['id'];

function categoryLabel(id: string): string {
  return categories.find((category) => category.id === id)?.label || 'Experience';
}

function containsPrivateOrPromotionalContact(text: string): boolean {
  return /https?:\/\/|www\.|\b\S+@\S+\.\S+\b|(?:\+?27|0)[ -]?(?:\d[ -]?){8,10}|whatsapp|telegram/i.test(text);
}

export function ConfessionsPanel({ compounds, selectedCompoundId = '', publicView = false, onSignIn }: ConfessionsPanelProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<CommunityConfession[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | ConfessionCategory>('all');
  const [category, setCategory] = useState<ConfessionCategory>('what_i_wish_i_knew');
  const [peptideId, setPeptideId] = useState(selectedCompoundId || 'none');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [alias, setAlias] = useState('');
  const tracked = useRef(false);

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
  useEffect(() => {
    if (!user || tracked.current) return;
    tracked.current = true;
    void recordCompanionEvent(user.id, 'confession_feed_viewed');
  }, [user]);

  const published = useMemo(() => items.filter((item) => item.moderation_status === 'published' && (filter === 'all' || item.category === filter)), [filter, items]);
  const myPending = useMemo(() => items.filter((item) => item.author_id === user?.id && item.moderation_status !== 'published'), [items, user?.id]);

  const openComposer = () => {
    if (!user) {
      onSignIn?.();
      return;
    }
    if (selectedCompoundId) setPeptideId(selectedCompoundId);
    setComposerOpen(true);
  };

  const submit = async () => {
    if (!user) return;
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    const cleanAlias = isAnonymous ? 'Anonymous researcher' : alias.trim();
    if (cleanTitle.length < 5 || cleanBody.length < 40) {
      toast.error('Use at least 5 characters for the title and 40 for the experience.');
      return;
    }
    if (!isAnonymous && cleanAlias.length < 2) {
      toast.error('Add a public alias or post anonymously.');
      return;
    }
    if (containsPrivateOrPromotionalContact(`${cleanTitle} ${cleanBody} ${cleanAlias}`)) {
      toast.error('Remove links, contact details and promotional handles before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await submitConfession({
        author_id: user.id,
        display_alias: cleanAlias,
        is_anonymous: isAnonymous,
        category,
        peptide_ids: peptideId === 'none' ? [] : [peptideId],
        title: cleanTitle,
        body: cleanBody,
      });
      void recordCompanionEvent(user.id, 'confession_submitted', { category, anonymous: isAnonymous });
      setTitle('');
      setBody('');
      setAlias('');
      setComposerOpen(false);
      await refresh();
      toast.success('Confession submitted for moderation. It is visible only to you until approved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Your confession could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (item: CommunityConfession) => {
    try {
      await deleteConfession(item.id);
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      toast.success('Confession deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Confession could not be deleted.');
    }
  };

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-rose-500/20">
        <div className="bg-gradient-to-br from-rose-500/15 via-fuchsia-500/5 to-background p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex max-w-2xl items-start gap-3"><div className="rounded-2xl bg-rose-600 p-3 text-white"><MessageCircleHeart className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600 dark:text-rose-400">Cape Town Peptide Club</p><h2 className="mt-1 text-2xl font-bold text-foreground">Peptide Confessions.</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Read real, moderated experiences for free. Share what happened to you—not instructions for what somebody else should do.</p></div></div>
            <Button type="button" className="bg-rose-600 text-white hover:bg-rose-700" onClick={openComposer}><PenLine className="mr-2 h-4 w-4" />Share your experience</Button>
          </div>
        </div>
        <div className="grid gap-2 border-t border-border p-4 text-xs text-muted-foreground sm:grid-cols-3 sm:p-5"><span className="flex gap-2"><BookOpen className="h-4 w-4 text-rose-500" />Free to read</span><span className="flex gap-2"><ShieldCheck className="h-4 w-4 text-rose-500" />Moderated before publishing</span><span className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-rose-500" />Anonymous by default</span></div>
      </Card>

      {composerOpen && user && (
        <Card className="space-y-4 border-rose-500/25 p-4 sm:p-5">
          <div><h3 className="font-semibold text-foreground">Submit a confession</h3><p className="mt-1 text-xs text-muted-foreground">Experiences are reviewed before public posting. Do not include names, contact details, sales links or instructions telling others what to take.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Category</Label><Select value={category} onValueChange={(value) => setCategory(value as ConfessionCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Compound (optional)</Label><Select value={peptideId} onValueChange={setPeptideId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No compound</SelectItem>{compounds.map((compound) => <SelectItem key={compound.id} value={compound.id}>{compound.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label htmlFor="confession-title">Title</Label><Input id="confession-title" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="The thing I wish I knew first" /></div>
          <div className="space-y-2"><Label htmlFor="confession-body">Your experience</Label><Textarea id="confession-body" value={body} rows={8} maxLength={3000} onChange={(event) => setBody(event.target.value)} placeholder="Describe what happened, what you observed and what you learned. Avoid turning your experience into a recommendation for others." /><p className="text-right text-xs text-muted-foreground">{body.length}/3000</p></div>
          <div className="rounded-xl border border-border bg-muted/30 p-3"><label className="flex cursor-pointer items-start gap-3"><Checkbox checked={isAnonymous} onCheckedChange={(value) => setIsAnonymous(value === true)} /><span><span className="block text-sm font-medium text-foreground">Post anonymously</span><span className="block text-xs text-muted-foreground">The public feed will show “Anonymous researcher.”</span></span></label>{!isAnonymous && <div className="mt-3 space-y-2"><Label htmlFor="confession-alias">Public alias</Label><Input id="confession-alias" value={alias} maxLength={40} onChange={(event) => setAlias(event.target.value)} placeholder="Choose a non-identifying alias" /></div>}</div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={() => setComposerOpen(false)}>Cancel</Button><Button type="button" className="bg-rose-600 text-white hover:bg-rose-700" onClick={() => void submit()} disabled={submitting}>{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : <><Send className="mr-2 h-4 w-4" />Submit for moderation</>}</Button></div>
        </Card>
      )}

      {myPending.length > 0 && (
        <Card className="p-4 sm:p-5">
          <h3 className="font-semibold text-foreground">Your submissions</h3>
          <div className="mt-3 space-y-2">{myPending.map((item) => <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"><div><Badge variant="outline" className={item.moderation_status === 'rejected' ? 'border-destructive/30 text-destructive' : 'border-amber-500/30 text-amber-600'}>{item.moderation_status}</Badge><p className="mt-2 text-sm font-medium text-foreground">{item.title}</p>{item.moderation_note && <p className="mt-1 text-xs text-muted-foreground">{item.moderation_note}</p>}</div><Button type="button" variant="ghost" size="icon" aria-label={`Delete ${item.title}`} onClick={() => void remove(item)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></div>)}</div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2" aria-label="Filter confessions">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All confessions</FilterButton>
        {categories.map((item) => <FilterButton key={item.id} active={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</FilterButton>)}
      </div>

      {loading ? (
        <Card className="flex min-h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-rose-500" /></Card>
      ) : published.length === 0 ? (
        <Card className="border-dashed p-8 text-center"><MessageCircleHeart className="mx-auto h-10 w-10 text-rose-500/40" /><h3 className="mt-3 font-semibold text-foreground">No published confessions in this category yet</h3><p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">The live Club site does not currently expose a public Confessions archive, so nothing has been copied or fabricated. Start the moderated community with an honest experience.</p><Button type="button" variant="outline" className="mt-4 border-rose-500/30 text-rose-600" onClick={openComposer}>{user ? 'Submit the first confession' : 'Sign in to post'}</Button></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">{published.map((item) => <Card key={item.id} className="p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-rose-500/30 text-rose-600 dark:text-rose-400">{categoryLabel(item.category)}</Badge><span className="text-xs text-muted-foreground">{item.published_at ? format(parseISO(item.published_at), 'd MMM yyyy') : ''}</span></div><h3 className="mt-3 text-lg font-semibold text-foreground">{item.title}</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{item.body}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground"><span>{item.is_anonymous ? 'Anonymous researcher' : item.display_alias}</span><span>{item.peptide_ids.map((id) => compounds.find((compound) => compound.id === id)?.shortName || id).join(' · ')}</span></div>{item.author_id === user?.id && <Button type="button" variant="ghost" size="sm" className="mt-2 text-destructive" onClick={() => void remove(item)}><Trash2 className="mr-2 h-3.5 w-3.5" />Delete my post</Button>}</Card>)}</div>
      )}

      <div className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><p>Community stories are personal experiences, not verified clinical evidence or medical advice. Never use a confession to choose a dose, protocol or treatment.</p></div>
      {publicView && !user && <p className="text-center text-xs text-muted-foreground">Reading is free. An account is required only to submit or manage a confession.</p>}
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={active ? 'rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white' : 'rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-rose-500/40 hover:text-foreground'}>{children}</button>;
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  BookLock,
  CalendarDays,
  FileText,
  Loader2,
  Plus,
  Ruler,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  createJournalEntry,
  deleteJournalEntry,
  listJournalEntries,
  recordCompanionEvent,
  type JournalEntry,
} from '@/services/researchCompanion';

interface ResearchJournalPanelProps {
  compounds: SelectablePeptide[];
  selectedCompoundId: string;
}

type JournalType = 'note' | 'ask' | 'measurement' | 'milestone';

const typeLabels: Record<JournalType, string> = {
  note: 'Private note',
  ask: 'Evidence answer',
  measurement: 'Measurement',
  milestone: 'Milestone',
};

function entryIcon(type: string) {
  if (type === 'ask') return Sparkles;
  if (type === 'measurement') return Ruler;
  if (type === 'milestone') return CalendarDays;
  return FileText;
}

export function ResearchJournalPanel({ compounds, selectedCompoundId }: ResearchJournalPanelProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entryType, setEntryType] = useState<JournalType>('note');
  const [peptideId, setPeptideId] = useState(selectedCompoundId || 'none');
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (selectedCompoundId && peptideId === 'none') setPeptideId(selectedCompoundId);
  }, [peptideId, selectedCompoundId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await listJournalEntries());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Your journal could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const stats = useMemo(() => ({
    total: entries.length,
    ask: entries.filter((entry) => entry.entry_type === 'ask').length,
    measurement: entries.filter((entry) => entry.entry_type === 'measurement').length,
  }), [entries]);

  const save = async () => {
    if (!user) return;
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody) {
      toast.error('Add a title and journal note.');
      return;
    }
    setSaving(true);
    try {
      await createJournalEntry({
        user_id: user.id,
        entry_type: entryType,
        peptide_id: peptideId === 'none' ? null : peptideId,
        title: cleanTitle,
        body: cleanBody,
        entry_date: entryDate,
      });
      void recordCompanionEvent(user.id, 'journal_entry_created', { entry_type: entryType });
      setTitle('');
      setBody('');
      await refresh();
      toast.success('Saved to your private journal.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Journal entry could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (entry: JournalEntry) => {
    try {
      await deleteJournalEntry(entry.id);
      setEntries((current) => current.filter((candidate) => candidate.id !== entry.id));
      toast.success('Journal entry deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Journal entry could not be deleted.');
    }
  };

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-primary/25">
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-background p-5 sm:p-6">
          <div className="flex items-start gap-3"><div className="rounded-2xl bg-primary p-3 text-primary-foreground"><BookLock className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Private by design</p><h2 className="mt-1 text-2xl font-bold text-foreground">Your journal.</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Keep evidence answers, measurement checks, observations and milestones together in your owner-only account record.</p></div></div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-border p-4 sm:p-5">
          <JournalStat label="Entries" value={stats.total} />
          <JournalStat label="Ask answers" value={stats.ask} />
          <JournalStat label="Measurements" value={stats.measurement} />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
        <Card className="space-y-4 p-4 sm:p-5 lg:sticky lg:top-4 lg:self-start">
          <div><h3 className="font-semibold text-foreground">New private entry</h3><p className="mt-1 text-xs text-muted-foreground">Only your signed-in account can read this content.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2"><Label>Entry type</Label><Select value={entryType} onValueChange={(value) => setEntryType(value as JournalType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(typeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Compound (optional)</Label><Select value={peptideId} onValueChange={setPeptideId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No compound</SelectItem>{compounds.map((compound) => <SelectItem key={compound.id} value={compound.id}>{compound.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="journal-date">Date</Label><Input id="journal-date" type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="journal-title">Title</Label><Input id="journal-title" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="What do you want to remember?" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="journal-body">Journal note</Label><Textarea id="journal-body" rows={8} maxLength={6000} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Record what you observed, a measurement check, or questions for your next clinician conversation." /><p className="text-right text-xs text-muted-foreground">{body.length}/6000</p></div>
          <Button type="button" className="w-full" onClick={() => void save()} disabled={saving}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Plus className="mr-2 h-4 w-4" />Save private entry</>}</Button>
        </Card>

        <div className="space-y-3">
          {loading ? (
            <Card className="flex min-h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></Card>
          ) : entries.length === 0 ? (
            <Card className="border-dashed p-8 text-center"><BookLock className="mx-auto h-9 w-9 text-muted-foreground/40" /><h3 className="mt-3 font-semibold text-foreground">Your journal is ready</h3><p className="mt-1 text-sm text-muted-foreground">Save an evidence answer or create your first private note.</p></Card>
          ) : entries.map((entry) => {
            const Icon = entryIcon(entry.entry_type);
            const compound = compounds.find((candidate) => candidate.id === entry.peptide_id);
            return (
              <Card key={entry.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{typeLabels[entry.entry_type as JournalType] || 'Private entry'} · {format(parseISO(entry.entry_date), 'd MMM yyyy')}</p><h3 className="mt-1 truncate font-semibold text-foreground">{entry.title}</h3>{compound && <p className="mt-0.5 text-xs text-muted-foreground">{compound.name}</p>}</div></div>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${entry.title}`} onClick={() => void remove(entry)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{entry.body}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function JournalStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-muted/50 p-3 text-center"><p className="text-xl font-bold text-foreground">{value}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p></div>;
}

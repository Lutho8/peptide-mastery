import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { SelectablePeptide } from '@/data/blendAdapters';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  buildEvidencePacket,
  questionRequestsMeasurementExplanation,
  questionRequestsPersonalDose,
  type EvidenceAnswer,
  type MeasurementAskContext,
} from '@/lib/evidenceCompanion';
import { buildBeginnerAskPepAnswer } from '@/lib/beginnerAskPep';
import {
  createJournalEntry,
  recordCompanionEvent,
} from '@/services/researchCompanion';

interface EvidenceAskPanelProps {
  compounds: SelectablePeptide[];
  selectedCompoundId: string;
  onSelectCompound: (id: string) => void;
  measurementContext?: MeasurementAskContext;
  onOpenMeasure: () => void;
}

const prompts = [
  'What is this, in really simple terms?',
  'What results did people get in human trials?',
  'What side effects should I look out for?',
  'What doses were studied — not a dose for me?',
  'Could tiredness, feeling cold or low appetite be a warning sign?',
  'What do we know about stopping or stacking it?',
];

export function EvidenceAskPanel({
  compounds,
  selectedCompoundId,
  onSelectCompound,
  measurementContext,
  onOpenMeasure,
}: EvidenceAskPanelProps) {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<EvidenceAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const packet = useMemo(
    () => selectedCompoundId ? buildEvidencePacket(selectedCompoundId) : null,
    [selectedCompoundId],
  );
  const asksForPersonalDose = questionRequestsPersonalDose(question);

  const submit = async () => {
    if (!packet) {
      toast.error('Select a compound first.');
      return;
    }
    const cleanQuestion = question.trim();
    if (cleanQuestion.length < 4) {
      toast.error('Enter a complete question.');
      return;
    }

    setLoading(true);
    setAnswer(null);
    try {
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        answer?: string;
        citations?: EvidenceAnswer['citations'];
        personalRecommendationDeclined?: boolean;
        remainingToday?: number;
        provider?: string;
        error?: string;
      }>('peptide-ai-agent', {
        body: {
          type: 'evidence_question',
          question: cleanQuestion,
          evidence: packet,
          measurementContext: questionRequestsMeasurementExplanation(cleanQuestion) ? measurementContext : undefined,
        },
      });
      if (error) throw error;
      if (!data?.success || !data.answer) throw new Error(data?.error || 'No answer was returned.');
      const personalRecommendationDeclined = data.personalRecommendationDeclined ?? false;
      const beginnerAnswer = data.provider === 'private-beginner-evidence-engine'
        ? data.answer
        : buildBeginnerAskPepAnswer(
          cleanQuestion,
          packet,
          personalRecommendationDeclined,
          questionRequestsMeasurementExplanation(cleanQuestion) ? measurementContext : undefined,
        );
      setAnswer({
        answer: beginnerAnswer,
        citations: data.citations ?? packet.sources,
        personalRecommendationDeclined,
        remainingToday: data.remainingToday,
        provider: data.provider,
      });
      if (user) void recordCompanionEvent(user.id, 'ai_question_asked', {
        peptide_id: packet.peptideId,
        evidence_sources: packet.sources.length,
        personal_recommendation_declined: personalRecommendationDeclined,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ask PepSA is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const saveToJournal = async () => {
    if (!user || !packet || !answer) return;
    setSaving(true);
    try {
      const citations = answer.citations.map((source, index) => `[S${index + 1}] ${source.label}: ${source.url}`).join('\n');
      await createJournalEntry({
        user_id: user.id,
        entry_type: 'ask',
        peptide_id: packet.peptideId,
        title: `Ask PepSA: ${packet.peptideName}`,
        body: `Question\n${question.trim()}\n\nAnswer\n${answer.answer}\n\nSources\n${citations || 'No verified primary source linked.'}`,
      });
      void recordCompanionEvent(user.id, 'ai_answer_saved', {
        peptide_id: packet.peptideId,
        source_count: answer.citations.length,
      });
      toast.success('Answer saved to your private journal.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Answer could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
      <div className="space-y-4">
        <Card className="overflow-hidden border-primary/25">
          <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-background p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary p-3 text-primary-foreground shadow-sm"><Sparkles className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Ask PepSA</p>
                <h2 className="mt-1 text-2xl font-bold text-foreground">Straight answers. No science degree needed.</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Ask the basic question you would ask a knowledgeable person. PepSA starts with the simple answer, then separates human evidence, community concerns and unknowns.</p>
              </div>
            </div>
          </div>
          <div className="space-y-5 p-4 sm:p-5">
            <div className="space-y-2">
              <Label>Compound</Label>
              <Select value={selectedCompoundId} onValueChange={(value) => { onSelectCompound(value); setAnswer(null); }}>
                <SelectTrigger aria-label="Ask about compound"><SelectValue placeholder="Choose a compound" /></SelectTrigger>
                <SelectContent>{compounds.map((compound) => <SelectItem key={compound.id} value={compound.id}>{compound.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt) => <button key={prompt} type="button" onClick={() => setQuestion(prompt)} className="rounded-full border border-border bg-muted/40 px-3 py-2 text-left text-xs font-medium text-foreground transition hover:border-primary/50 hover:bg-primary/5">{prompt}</button>)}
            </div>

            <div className="space-y-2">
              <Label htmlFor="evidence-question">What do you want to know?</Label>
              <Textarea id="evidence-question" value={question} onChange={(event) => setQuestion(event.target.value.slice(0, 1200))} rows={5} placeholder="Ask it normally — for example: What does this actually do, and what should a beginner know?" />
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>Avoid names, contact details and identifiable health information.</span><span>{question.length}/1200</span></div>
              <p className="text-xs leading-relaxed text-muted-foreground">Your question is processed inside PSA’s authenticated evidence function. PSA stores only a timestamp and selected compound for the usage allowance—not the raw question. Calculator values are included only when you ask to explain them.</p>
            </div>

            {asksForPersonalDose && (
              <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p><strong>Personal recommendation detected.</strong> The answer will show published study context and questions for a clinician; it will not choose an amount or protocol for you.</p>
              </div>
            )}

            <Button type="button" className="min-h-12 w-full" onClick={() => void submit()} disabled={loading || !packet || question.trim().length < 4}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Putting it simply…</> : <><Sparkles className="mr-2 h-4 w-4" />Ask PepSA</>}
            </Button>
          </div>
        </Card>

        {answer && (
          <Card className="overflow-hidden" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3 sm:px-5">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Plain-English answer</p><p className="mt-0.5 text-sm text-muted-foreground">{packet?.peptideName}</p></div>
              <Button type="button" variant="outline" size="sm" onClick={() => void saveToJournal()} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Saving…' : 'Save to journal'}</Button>
            </div>
            <div className="prose prose-sm max-w-none p-4 text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-p:text-foreground/90 dark:prose-invert sm:p-5">
              <ReactMarkdown components={{ a: ({ children }) => <span>{children}</span> }}>{answer.answer}</ReactMarkdown>
            </div>
            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-5">
              {typeof answer.remainingToday === 'number' ? `${answer.remainingToday} evidence questions remain in the rolling 24-hour allowance.` : 'Private, authenticated question.'}
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card className="border-primary/20 bg-primary/5 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">The 30-second version</p>
          <h3 className="mt-1 font-bold text-foreground">{packet?.peptideName || 'Choose a compound'}</h3>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{packet?.beginner.simpleExplanation || 'Select a compound and PepSA will explain it without assuming prior knowledge.'}</p>
          {packet && <>
            <p className="mt-3 rounded-lg border border-border bg-background/70 p-2 text-xs font-medium text-muted-foreground">{packet.beginner.status}</p>
            {packet.beginner.safetyFlags.length > 0 && <div className="mt-4"><p className="text-xs font-semibold text-foreground">Main safety flags</p><ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">{packet.beginner.safetyFlags.slice(0, 3).map((flag) => <li key={flag}>• {flag}</li>)}</ul></div>}
          </>}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence floor</p><h3 className="mt-1 font-bold text-foreground">{packet?.evidenceLabel || 'Select a compound'}</h3></div><ShieldCheck className="h-5 w-5 text-primary" /></div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{packet?.evidenceNote || 'The app will only answer from its linked evidence packet.'}</p>
          {packet && <p className="mt-3 text-xs text-muted-foreground">Reviewed {packet.lastReviewed} · {packet.sources.length} linked source{packet.sources.length === 1 ? '' : 's'}</p>}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /><h3 className="font-semibold text-foreground">Published study context</h3></div>
          <p className="mt-1 text-xs text-muted-foreground">What a paper studied is not a recommendation for you.</p>
          <div className="mt-4 space-y-3">
            {packet?.sources.length ? packet.sources.map((source, index) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-border p-3 transition hover:border-primary/50 hover:bg-primary/5">
                <span className="flex items-start justify-between gap-3"><span className="text-xs font-bold text-primary">S{index + 1} · {source.label}</span><ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /></span>
                <span className="mt-1 block text-sm font-medium leading-snug text-foreground">{source.title}</span>
                {source.studiedProtocol && <span className="mt-2 block rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground"><strong className="text-foreground">Study protocol reported:</strong> {source.studiedProtocol}</span>}
              </a>
            )) : <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">No app-verified primary source is linked yet. The assistant will not fill that gap with a guessed protocol.</p>}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" /><div><h3 className="font-semibold text-foreground">Measurement hand-off</h3><p className="mt-1 text-sm text-muted-foreground">Use PepSA to understand evidence; use deterministic arithmetic to verify an amount already recorded for you.</p></div></div>
          <Button type="button" variant="outline" className="mt-4 w-full" onClick={onOpenMeasure}>Open measurement</Button>
        </Card>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, FileLock2, FileText, Loader2, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { peptides } from '@/data/peptides';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  createCoaDocument,
  createCoaSignedUrl,
  deleteCoaDocument,
  listCoaDocuments,
  recordResearchWorkspaceEvent,
  type UserCoaDocument,
} from '@/services/researchWorkspace';

type PanelStatus = 'shown' | 'incomplete' | 'not_reported' | 'not_applicable';

const panelOptions: Array<{ value: PanelStatus; label: string }> = [
  { value: 'shown', label: 'Shown on report' },
  { value: 'incomplete', label: 'Incomplete evidence' },
  { value: 'not_reported', label: 'Not reported' },
  { value: 'not_applicable', label: 'Not applicable' },
];

const acceptedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const vaultPeptides = Array.from(
  peptides.reduce((byCompound, peptide) => {
    const compoundKey = peptide.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (!byCompound.has(compoundKey)) byCompound.set(compoundKey, peptide);
    return byCompound;
  }, new Map<string, (typeof peptides)[number]>()).values(),
);

function safeFilename(filename: string): string {
  const cleaned = filename.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-160);
  return cleaned || 'certificate';
}

function completeness(document: Pick<UserCoaDocument, 'identity_status' | 'hplc_status' | 'assay_status' | 'net_content_status' | 'endotoxin_status' | 'sterility_status' | 'traceability_status'>) {
  const statuses = [document.identity_status, document.hplc_status, document.assay_status, document.net_content_status, document.endotoxin_status, document.sterility_status, document.traceability_status];
  const shown = statuses.filter((status) => status === 'shown' || status === 'not_applicable').length;
  return { shown, total: statuses.length, complete: shown === statuses.length };
}

function StatusField({ label, value, onChange }: { label: string; value: PanelStatus; onChange: (value: PanelStatus) => void }) {
  return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={(next) => onChange(next as PanelStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{panelOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>;
}

export default function COAVaultPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<UserCoaDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [peptideId, setPeptideId] = useState('none');
  const [sampleName, setSampleName] = useState('');
  const [labName, setLabName] = useState('');
  const [reportNumber, setReportNumber] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [testedAt, setTestedAt] = useState('');
  const [purityPct, setPurityPct] = useState('');
  const [assayPct, setAssayPct] = useState('');
  const [netContentMg, setNetContentMg] = useState('');
  const [notes, setNotes] = useState('');
  const [identityStatus, setIdentityStatus] = useState<PanelStatus>('not_reported');
  const [hplcStatus, setHplcStatus] = useState<PanelStatus>('not_reported');
  const [assayStatus, setAssayStatus] = useState<PanelStatus>('not_reported');
  const [netContentStatus, setNetContentStatus] = useState<PanelStatus>('not_reported');
  const [endotoxinStatus, setEndotoxinStatus] = useState<PanelStatus>('not_reported');
  const [sterilityStatus, setSterilityStatus] = useState<PanelStatus>('not_reported');
  const [traceabilityStatus, setTraceabilityStatus] = useState<PanelStatus>('not_reported');

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setDocuments(await listCoaDocuments()); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'COA vault could not be loaded.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const draftCompleteness = useMemo(() => completeness({ identity_status: identityStatus, hplc_status: hplcStatus, assay_status: assayStatus, net_content_status: netContentStatus, endotoxin_status: endotoxinStatus, sterility_status: sterilityStatus, traceability_status: traceabilityStatus }), [assayStatus, endotoxinStatus, hplcStatus, identityStatus, netContentStatus, sterilityStatus, traceabilityStatus]);

  const reset = () => {
    setFile(null); setPeptideId('none'); setSampleName(''); setLabName(''); setReportNumber(''); setBatchNumber(''); setTestedAt(''); setPurityPct(''); setAssayPct(''); setNetContentMg(''); setNotes('');
    setIdentityStatus('not_reported'); setHplcStatus('not_reported'); setAssayStatus('not_reported'); setNetContentStatus('not_reported'); setEndotoxinStatus('not_reported'); setSterilityStatus('not_reported'); setTraceabilityStatus('not_reported');
  };

  const save = async () => {
    if (!user || !file) return;
    if (!acceptedTypes.has(file.type) || file.size > 12 * 1024 * 1024) {
      toast.error('Choose a PDF, JPG, PNG or WebP file up to 12 MB.');
      return;
    }
    setSaving(true);
    const path = `${user.id}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
    try {
      const { error: uploadError } = await supabase.storage.from('coa-vault').upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      try {
        const row = await createCoaDocument({
          user_id: user.id,
          peptide_id: peptideId === 'none' ? null : peptideId,
          file_path: path,
          original_filename: file.name,
          mime_type: file.type,
          status: draftCompleteness.complete ? 'reviewed' : 'needs_attention',
          sample_name: sampleName.trim() || null,
          lab_name: labName.trim() || null,
          report_number: reportNumber.trim() || null,
          batch_number: batchNumber.trim() || null,
          tested_at: testedAt || null,
          identity_status: identityStatus,
          hplc_status: hplcStatus,
          purity_pct: purityPct ? Number(purityPct) : null,
          assay_status: assayStatus,
          assay_pct: assayPct ? Number(assayPct) : null,
          net_content_status: netContentStatus,
          net_content_mg: netContentMg ? Number(netContentMg) : null,
          endotoxin_status: endotoxinStatus,
          sterility_status: sterilityStatus,
          traceability_status: traceabilityStatus,
          notes: notes.trim() || null,
        });
        setDocuments((current) => [row, ...current]);
      } catch (rowError) {
        await supabase.storage.from('coa-vault').remove([path]);
        throw rowError;
      }
      void recordResearchWorkspaceEvent(user.id, 'coa_document_uploaded', { peptide_id: peptideId === 'none' ? null : peptideId, completeness: `${draftCompleteness.shown}/${draftCompleteness.total}` });
      reset();
      toast.success('Certificate saved privately to your COA vault.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Certificate could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const openDocument = async (document: UserCoaDocument) => {
    try { window.location.assign(await createCoaSignedUrl(document.file_path)); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'A private viewing link could not be created.'); }
  };

  const removeDocument = async (document: UserCoaDocument) => {
    if (!window.confirm(`Delete ${document.original_filename} from your private vault?`)) return;
    try {
      await deleteCoaDocument(document);
      setDocuments((current) => current.filter((candidate) => candidate.id !== document.id));
      if (user) void recordResearchWorkspaceEvent(user.id, 'coa_document_deleted', { document_id: document.id });
      toast.success('Certificate deleted.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Certificate could not be deleted.'); }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to dashboard</Link></Button>
        <header className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-accent/10 p-5 sm:p-8">
          <div className="flex items-start gap-4"><div className="rounded-2xl bg-primary p-3 text-primary-foreground"><FileLock2 className="h-6 w-6" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Private by default</p><h1 className="mt-1 text-3xl font-bold text-foreground">Your COA vault.</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Store a supplier certificate against a compound and batch, then record which identity, quantity and contamination checks are actually shown. Files remain owner-only and open through short-lived private links.</p></div></div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)]">
          <Card className="space-y-5 p-4 sm:p-5 lg:sticky lg:top-4 lg:self-start">
            <div><h2 className="font-bold text-foreground">Add a certificate</h2><p className="mt-1 text-xs text-muted-foreground">The app records what the report contains; it does not authenticate the vial or fill missing tests.</p></div>
            <div className="space-y-2"><Label htmlFor="coa-file">Certificate PDF or image</Label><Input id="coa-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><p className="text-xs text-muted-foreground">PDF, JPG, PNG or WebP · maximum 12 MB</p></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-2"><Label>Compound</Label><Select value={peptideId} onValueChange={setPeptideId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not assigned</SelectItem>{vaultPeptides.map((peptide) => <SelectItem key={peptide.id} value={peptide.id}>{peptide.shortName}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="sample-name">Sample name</Label><Input id="sample-name" value={sampleName} maxLength={200} onChange={(event) => setSampleName(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="lab-name">Laboratory</Label><Input id="lab-name" value={labName} maxLength={160} onChange={(event) => setLabName(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="report-number">Report number</Label><Input id="report-number" value={reportNumber} maxLength={120} onChange={(event) => setReportNumber(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="batch-number">Batch number</Label><Input id="batch-number" value={batchNumber} maxLength={120} onChange={(event) => setBatchNumber(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="tested-at">Test date</Label><Input id="tested-at" type="date" value={testedAt} onChange={(event) => setTestedAt(event.target.value)} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2"><StatusField label="Identity / mass spectrum" value={identityStatus} onChange={setIdentityStatus} /><StatusField label="HPLC chromatogram" value={hplcStatus} onChange={setHplcStatus} /><StatusField label="Assay" value={assayStatus} onChange={setAssayStatus} /><StatusField label="Net content" value={netContentStatus} onChange={setNetContentStatus} /><StatusField label="Endotoxin" value={endotoxinStatus} onChange={setEndotoxinStatus} /><StatusField label="Sterility / microbial" value={sterilityStatus} onChange={setSterilityStatus} /><StatusField label="Traceability" value={traceabilityStatus} onChange={setTraceabilityStatus} /></div>
            <div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="purity">HPLC purity %</Label><Input id="purity" type="number" min="0" max="100" step="0.001" value={purityPct} onChange={(event) => setPurityPct(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="assay">Assay %</Label><Input id="assay" type="number" min="0" max="100" step="0.001" value={assayPct} onChange={(event) => setAssayPct(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="net-content">Net content mg</Label><Input id="net-content" type="number" min="0" step="0.001" value={netContentMg} onChange={(event) => setNetContentMg(event.target.value)} /></div></div>
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs leading-relaxed text-muted-foreground"><AlertTriangle className="mr-1 inline h-4 w-4 text-amber-600" /><strong className="text-foreground">Purity is not assay.</strong> A high HPLC area does not establish the amount in the vial, sterility, endotoxin status or traceability.</div>
            <div className="space-y-2"><Label htmlFor="coa-notes">Private notes</Label><Textarea id="coa-notes" rows={4} maxLength={3000} value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>Panel completeness</span><Badge variant={draftCompleteness.complete ? 'default' : 'outline'}>{draftCompleteness.shown}/{draftCompleteness.total}</Badge></div>
            <Button type="button" className="w-full" disabled={!file || saving} onClick={() => void save()}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving privately…</> : <><Upload className="mr-2 h-4 w-4" />Save to my COA vault</>}</Button>
          </Card>

          <section>
            <div className="flex items-end justify-between gap-3"><div><h2 className="text-xl font-bold text-foreground">Saved certificates</h2><p className="mt-1 text-sm text-muted-foreground">Only your authenticated account can read these records.</p></div><Badge variant="outline">{documents.length}</Badge></div>
            <div className="mt-4 space-y-3">
              {loading ? <Card className="flex min-h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></Card> : documents.length === 0 ? <Card className="border-dashed p-8 text-center"><FileText className="mx-auto h-10 w-10 text-muted-foreground/40" /><h3 className="mt-3 font-semibold text-foreground">Your vault is ready</h3><p className="mt-1 text-sm text-muted-foreground">Add your first certificate and record which panels are present.</p></Card> : documents.map((document) => {
                const result = completeness(document);
                const peptide = vaultPeptides.find((candidate) => candidate.id === document.peptide_id);
                return <Card key={document.id} className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant={result.complete ? 'default' : 'outline'}>{result.complete ? <><CheckCircle2 className="mr-1 h-3 w-3" />Complete panel record</> : `${result.shown}/${result.total} panels`}</Badge><span className="text-xs text-muted-foreground">{format(parseISO(document.created_at), 'd MMM yyyy')}</span></div><h3 className="mt-3 truncate font-semibold text-foreground">{document.sample_name || peptide?.name || document.original_filename}</h3><p className="mt-1 text-xs text-muted-foreground">{[document.lab_name, document.batch_number && `Batch ${document.batch_number}`, document.report_number && `Report ${document.report_number}`].filter(Boolean).join(' · ') || 'Certificate metadata not recorded'}</p></div><ShieldCheck className="h-5 w-5 shrink-0 text-primary" /></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><div className="rounded-lg bg-muted/50 p-2"><span className="block text-muted-foreground">Identity</span><strong className="text-foreground">{document.identity_status.replace('_', ' ')}</strong></div><div className="rounded-lg bg-muted/50 p-2"><span className="block text-muted-foreground">Purity</span><strong className="text-foreground">{document.purity_pct == null ? 'Not recorded' : `${document.purity_pct}%`}</strong></div><div className="rounded-lg bg-muted/50 p-2"><span className="block text-muted-foreground">Endotoxin</span><strong className="text-foreground">{document.endotoxin_status.replace('_', ' ')}</strong></div><div className="rounded-lg bg-muted/50 p-2"><span className="block text-muted-foreground">Sterility</span><strong className="text-foreground">{document.sterility_status.replace('_', ' ')}</strong></div></div><div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={() => void openDocument(document)}><ExternalLink className="mr-2 h-3.5 w-3.5" />Open private copy</Button><Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void removeDocument(document)}><Trash2 className="mr-2 h-3.5 w-3.5" />Delete</Button></div></Card>;
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

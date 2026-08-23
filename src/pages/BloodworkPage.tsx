import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';
import { JsonLd } from '@/components/seo/JsonLd';
import { useAuth } from '@/contexts/AuthContext';
import { useMembership } from '@/hooks/useMembership';
import { supabase } from '@/integrations/supabase/client';
import { AuthModal } from '@/components/auth/AuthModal';
import { captureLead } from '@/lib/crm';

import { ScanFormState } from '@/components/bloodwork/ScanForm';
import { BloodworkResults, BloodworkScanResult } from '@/components/bloodwork/BloodworkResults';
import { PremiumGate } from '@/components/bloodwork/PremiumGate';
import { BloodworkWizard } from '@/components/bloodwork/BloodworkWizard';
import { useScanProgress } from '@/hooks/useScanProgress';
import { exportBloodworkProtocolPDF } from '@/utils/bloodworkProtocolPdf';

const DISCLAIMER =
  'This analysis is for educational and informational purposes only. It does not constitute medical advice. Consult a qualified healthcare provider before making any changes to your health regimen, including peptide protocols, supplements, or diagnostic testing.';

const INITIAL_STATE: ScanFormState = {
  file: null,
  age: '',
  sex: 'na',
  goals: [],
  peptideHistoryUsed: null,
  peptideHistoryNotes: '',
  reportCountry: 'ZA',
  languageHint: 'auto',
};

type FunctionEnvelope = {
  message: string;
  code: string;
  retryable: boolean;
};

function safeStorageName(name: string): string {
  const extension = name.match(/\.[a-z0-9]{2,5}$/i)?.[0]?.toLowerCase() ?? '';
  const stem = name
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .normalize('NFKD')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'lab-report';
  return `${stem}${extension}`;
}

async function readFunctionError(error: unknown): Promise<FunctionEnvelope> {
  const fallbackMessage = error instanceof Error ? error.message : 'Could not reach the bloodwork service.';
  const context = error && typeof error === 'object' && 'context' in error
    ? (error as { context?: Response }).context
    : undefined;

  if (context) {
    try {
      const body = await context.clone().json() as Partial<FunctionEnvelope>;
      return {
        message: body.message || fallbackMessage,
        code: body.code || `HTTP_${context.status}`,
        retryable: body.retryable ?? context.status >= 500,
      };
    } catch {
      // Some relays return plain text; the transport fallback below stays actionable.
    }
  }

  return { message: fallbackMessage, code: 'TRANSPORT', retryable: true };
}

function mapScanError(e: unknown): { message: string; code?: string } {
  if (e && typeof e === 'object' && 'code' in (e as any)) {
    const env = e as { message?: string; code?: string };
    return { message: env.message || 'Scan failed.', code: env.code };
  }
  const msg = e instanceof Error ? e.message : String(e ?? '');
  if (/abort/i.test(msg)) return { message: '' };
  if (/429|rate/i.test(msg)) return { message: 'Too many scans right now. Wait 30 seconds and try again.', code: 'RATE_LIMITED' };
  if (/402|credit/i.test(msg)) return { message: 'Premium scan credits exhausted for this hour. Try again shortly.', code: 'CREDITS_EXHAUSTED' };
  if (/parse|empty|json/i.test(msg))
    return { message: "We couldn't read this lab report. Try a clearer scan or a different file format (PDF, JPG, PNG).", code: 'EMPTY_RESPONSE' };
  if (/upload|storage|network|fetch/i.test(msg))
    return { message: 'Something went wrong on our side. Try again — your file is still saved.', code: 'TRANSPORT' };
  return { message: msg || 'Unexpected error during scan.' };
}


export default function BloodworkPage() {
  const { user } = useAuth();
  const { hasPremium, isLoading: membershipLoading } = useMembership();
  const [authOpen, setAuthOpen] = useState(false);
  const [form, setForm] = useState<ScanFormState>(INITIAL_STATE);
  const [running, setRunning] = useState<'baseline' | 'deep' | null>(null);
  const [result, setResult] = useState<BloodworkScanResult | null>(null);
  const [labReportId, setLabReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const lastTierRef = useRef<'baseline' | 'deep' | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const progress = useScanProgress();


  const runScan = useCallback(
    async (tier: 'baseline' | 'deep', opts?: { reuseReportId?: string }) => {
      if (!user) return;
      const reuse = opts?.reuseReportId ?? null;
      if (!reuse && !form.file) return;

      setRunning(tier);
      setResult(null);
      setError(null);
      setErrorCode(null);
      lastTierRef.current = tier;
      progress.start();
      abortRef.current = new AbortController();

      if (!reuse && form.file) {
        if (form.file.size > 10 * 1024 * 1024) {
          progress.fail();
          setError('File is over 10 MB. Please export a smaller PDF or a compressed image.');
          setErrorCode('FILE_TOO_LARGE');
          setRunning(null);
          return;
        }
        const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        const okType =
          ALLOWED.includes(form.file.type) ||
          /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(form.file.name);
        if (!okType) {
          progress.fail();
          setError('Unsupported file type. Upload a PDF, JPG, PNG, WEBP, or HEIC of your lab report.');
          setErrorCode('UNSUPPORTED_CONTENT');
          setRunning(null);
          return;
        }

        // Magic-byte sniff — catch mislabeled files up-front.
        try {
          const head = new Uint8Array(await form.file.slice(0, 12).arrayBuffer());
          const ascii = new TextDecoder().decode(head);
          const isPdf = ascii.startsWith('%PDF');
          const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
          const isPng = head[0] === 0x89 && ascii.slice(1, 4) === 'PNG';
          const isWebp = ascii.startsWith('RIFF') && new TextDecoder().decode(head.slice(8, 12)) === 'WEBP';
          const looksHeic = ascii.slice(4, 12).includes('ftyp');
          if (!isPdf && !isJpeg && !isPng && !isWebp && !looksHeic) {
            progress.fail();
            setError("This file doesn't look like a valid PDF or image. Re-export from your lab portal as PDF or JPG and try again.");
            setErrorCode('UNSUPPORTED_CONTENT');
            setRunning(null);
            return;
          }
        } catch {
          // If we can't read the header, let the server try.
        }
      }

      void captureLead({
        email: user.email,
        source: tier === 'deep' ? 'bloodwork_deep' : 'bloodwork_baseline',
        planInterest: 'premium',
        activityType: 'calculator_use',
        activityData: { goals: form.goals, scanType: tier, retry: !!reuse },
      });

      try {
        let reportId: string;
        let fileName: string;
        let mimeType: string | undefined;

        if (reuse) {
          reportId = reuse;
          fileName = form.file?.name ?? 'lab-report';
          mimeType = form.file?.type;
          progress.advance('extract');
          progress.advance('generate');
        } else {
          const filePath = `${user.id}/${crypto.randomUUID()}-${safeStorageName(form.file!.name)}`;
          const { error: uploadError } = await supabase.storage.from('lab-reports').upload(filePath, form.file!, {
            cacheControl: '3600',
            contentType: form.file!.type || undefined,
            upsert: false,
          });
          if (uploadError) {
            console.error('[bloodwork] upload failed:', uploadError);
            throw { message: uploadError.message, code: 'STORAGE_DOWNLOAD_FAILED' };
          }

          const { data: report, error: insertError } = await supabase
            .from('lab_reports')
            .insert({
              user_id: user.id,
              file_url: filePath,
              file_name: form.file!.name,
              status: 'pending',
            })
            .select()
            .single();
          if (insertError) {
            console.error('[bloodwork] insert failed:', insertError);
            await supabase.storage.from('lab-reports').remove([filePath]);
            throw { message: insertError.message, code: 'STORAGE_DOWNLOAD_FAILED' };
          }
          reportId = report.id;
          fileName = form.file!.name;
          mimeType = form.file!.type;
          setLabReportId(report.id);
          progress.advance('extract');
          progress.advance('generate');
        }

        // Initial attempt plus 2s and 4s backoff on retryable errors.
        const BACKOFFS = [0, 2000, 4000];
        let payload: any = null;
        let lastEnvelope: any = null;
        for (let attempt = 0; attempt < BACKOFFS.length; attempt++) {
          if (abortRef.current?.signal.aborted) { progress.reset(); return; }
          if (BACKOFFS[attempt] > 0) {
            await new Promise((r) => setTimeout(r, BACKOFFS[attempt]));
          }

          const { data, error: fnError } = await supabase.functions.invoke('analyze-lab-report', {
            body: {
              reportId,
              fileName,
              mimeType,
              scanType: tier,
              age: form.age ? Number(form.age) : undefined,
              sex: form.sex,
              goals: form.goals,
              peptideHistoryUsed: form.peptideHistoryUsed ?? undefined,
              peptideHistoryNotes: form.peptideHistoryNotes || undefined,
              reportCountry: form.reportCountry,
              languageHint: form.languageHint === 'auto' ? undefined : form.languageHint,
            },
          });

          if (abortRef.current?.signal.aborted) { progress.reset(); return; }

          if (fnError) {
            const functionError = await readFunctionError(fnError);
            console.error('[bloodwork] edge function error', { attempt, functionError, fnError });
            lastEnvelope = { ok: false, ...functionError };
            if (functionError.retryable && attempt < BACKOFFS.length - 1) continue;
            throw functionError;
          }
          if ((data as any)?.ok === false) {
            lastEnvelope = data;
            console.warn('[bloodwork] envelope error', { attempt, data });
            if ((data as any).retryable && attempt < BACKOFFS.length - 1) continue;
            throw {
              message: (data as any).message || 'Scan failed',
              code: (data as any).code,
            };
          }
          payload = (data as any)?.data;
          if (payload) break;
          lastEnvelope = { ok: false, code: 'EMPTY_RESPONSE', retryable: true, message: 'Empty AI response — please retry.' };
        }

        if (!payload) {
          throw {
            message: lastEnvelope?.message || 'Scan failed after 3 attempts. You can retry or enter values manually below.',
            code: lastEnvelope?.code,
          };
        }

        progress.advance('finalize');

        const scanResult: BloodworkScanResult = {
          scan_type: tier,
          health_score: payload.health_score ?? undefined,
          biomarkers: Array.isArray(payload.biomarkers) ? payload.biomarkers : [],
          insights: Array.isArray(payload.insights)
            ? payload.insights
            : typeof payload.insights === 'string'
            ? payload.insights.split(/\n+/).filter(Boolean)
            : [],
          insights_de: Array.isArray(payload.insights_de)
            ? payload.insights_de
            : typeof payload.insights_de === 'string'
            ? payload.insights_de.split(/\n+/).filter(Boolean)
            : undefined,
          summary: typeof payload.summary === 'string' ? payload.summary : undefined,
          summary_de: typeof payload.summary_de === 'string' ? payload.summary_de : undefined,
          detected_language: payload.detected_language === 'de' ? 'de' : 'en',
          protocol: payload.protocol || {},
          goals: form.goals,
        };
        progress.complete();
        await new Promise((r) => setTimeout(r, 350));
        setResult(scanResult);
        toast.success(`${tier === 'deep' ? 'Deep Decode' : 'Baseline'} scan complete`);
        setTimeout(() => {
          document.getElementById('bloodwork-results-root')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } catch (e) {
        console.error('[bloodwork] scan failed:', e);
        const mapped = mapScanError(e);
        progress.fail();
        setError(mapped.message || 'Scan failed unexpectedly. Please retry or enter manually.');
        setErrorCode(mapped.code ?? null);
        void captureLead({
          email: user.email,
          source: 'bloodwork_scan_failed',
          planInterest: 'premium',
          activityType: 'calculator_use',
          activityData: { tier, reason: mapped.message, code: mapped.code },
        });
      } finally {
        setRunning(null);
        abortRef.current = null;
      }
    },
    [user, form, progress]
  );


  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    progress.reset();
    setRunning(null);
    setError(null);
    setErrorCode(null);
  }, [progress]);

  const handleRetry = useCallback(() => {
    setError(null);
    setErrorCode(null);
    progress.reset();
    if (lastTierRef.current) {
      // Reuse the already-uploaded report so the user doesn't lose their file on retry.
      void runScan(lastTierRef.current, labReportId ? { reuseReportId: labReportId } : undefined);
    }
  }, [progress, runScan, labReportId]);

  const handleResetUpload = useCallback(() => {
    setError(null);
    setErrorCode(null);
    setLabReportId(null);
    progress.reset();
    setForm((s) => ({ ...s, file: null }));
  }, [progress]);


  const handleDownload = useCallback(() => {
    if (!result) return;
    exportBloodworkProtocolPDF(result, `bloodwork-${result.scan_type}-${Date.now()}.pdf`);
  }, [result]);

  return (
    <div className="min-h-dvh bg-background">
      <SEOHead
        title="Bloodwork Guide | Peptide South Africa"
        description="Upload a South African or German lab report for a bilingual, educational biomarker review that keeps your laboratory's own units and reference ranges."
        canonical="https://peptide-south-africa.co.za/bloodwork"
      />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Bilingual Bloodwork Guide',
        provider: { '@type': 'Organization', name: 'Peptide South Africa', url: 'https://peptide-south-africa.co.za' },
        serviceType: 'Educational biomarker review',
        url: 'https://peptide-south-africa.co.za/bloodwork',
        description: 'Bilingual educational lab-report review for South African and German reports, preserving the laboratory supplied units and reference ranges.',
        areaServed: ['ZA', 'DE'],
      }} />

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors" aria-label="Back">
            <ArrowLeft size={20} className="text-foreground" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <FlaskConical size={18} className="text-primary" />
              Bloodwork guide
            </h1>
            <p className="text-[11px] text-muted-foreground">ZA + DE reports · English + Deutsch · educational feedback</p>
          </div>
        </div>
      </header>

      {membershipLoading ? (
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-sm text-muted-foreground">Loading…</div>
      ) : !hasPremium ? (
        <>
          <PremiumGate onSignIn={() => setAuthOpen(true)} />
          <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
        </>
      ) : (
        <>
          {!result ? (
            <BloodworkWizard
              state={form}
              onChange={setForm}
              running={running}
              error={error}
              errorCode={errorCode}
              progress={{ stage: progress.stage, label: progress.label, percent: progress.percent, startedAt: progress.startedAt }}

              onRun={(t) => runScan(t)}
              onCancel={handleCancel}
              onRetry={handleRetry}
              onResetUpload={handleResetUpload}
              labReportId={labReportId}
              onManualSaved={() => {
                setError(null);
                toast.success('Biomarkers saved — view them in Results › Bloodwork.');
              }}
            />
          ) : (
            <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => { setResult(null); setLabReportId(null); }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card/40 text-xs font-semibold uppercase tracking-wider text-foreground hover:border-primary/60 transition-colors"
                >
                  <ArrowLeft size={14} /> Run another scan
                </button>
              </div>
              <BloodworkResults
                result={result}
                onDownload={handleDownload}
                labReportId={labReportId}
                preferredLanguage={form.languageHint === 'auto' ? undefined : form.languageHint}
              />
            </main>
          )}
        </>
      )}

      <footer className="border-t border-border/50 bg-card/30">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Disclaimer · </span>
            {DISCLAIMER}
          </p>
        </div>
      </footer>
    </div>
  );
}

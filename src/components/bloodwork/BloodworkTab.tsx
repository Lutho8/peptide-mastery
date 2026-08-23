import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, FileText, TrendingUp, TrendingDown, Minus, Plus, Sparkles, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { biomarkers as BIOMARKER_DEFS } from '@/data/bloodwork';
import { peptides as ALL_PEPTIDES } from '@/data/peptides';

interface Biomarker {
  name: string;
  short_name?: string;
  value: number;
  unit?: string;
  status?: string;
  category?: string;
  reference_range?: string;
}

interface Report {
  id: string;
  report_date: string | null;
  uploaded_at: string;
  file_name: string | null;
  health_score: number | null;
  status: string;
  extracted_biomarkers: Biomarker[] | null;
  scan_type: string | null;
  patient_sex?: string | null;
}

interface StackEntry {
  peptide_id: string;
  created_at: string;
}

type Tone = 'optimal' | 'borderline' | 'out' | 'unknown';
type Sex = 'male' | 'female';

// Biomarkers where a DECREASE is favorable
const LOWER_IS_BETTER = new Set([
  'ldl', 'apob', 'hba1c', 'fastingglucose', 'glucose', 'triglycerides', 'tg',
  'alt', 'ast', 'ggt', 'crp', 'hs-crp', 'homocysteine', 'hcy', 'insulin',
  'totalcholesterol', 'tc',
]);

// Map common lab labels to our canonical biomarker ids
const ALIAS: Record<string, string> = {
  'igf-1': 'igf1',
  'igf 1': 'igf1',
  'igf1': 'igf1',
  'insulin-like growth factor 1': 'igf1',
  'testosterone': 'testosterone',
  'total testosterone': 'testosterone',
  'testosterone, total': 'testosterone',
  'test': 'testosterone',
  'free testosterone': 'freeT',
  'free t': 'freeT',
  'estradiol': 'estradiol',
  'e2': 'estradiol',
  'ast': 'ast', 'sgot': 'ast',
  'alt': 'alt', 'sgpt': 'alt',
  'ggt': 'ggt',
  'total cholesterol': 'totalCholesterol',
  'cholesterol': 'totalCholesterol',
  'tc': 'totalCholesterol',
  'ldl': 'ldl', 'ldl-c': 'ldl', 'ldl cholesterol': 'ldl',
  'hdl': 'hdl', 'hdl-c': 'hdl', 'hdl cholesterol': 'hdl',
  'triglycerides': 'triglycerides', 'tg': 'triglycerides',
  'fasting glucose': 'fastingGlucose', 'glucose': 'fastingGlucose', 'fg': 'fastingGlucose',
  'hba1c': 'hba1c', 'a1c': 'hba1c',
  'insulin': 'insulin',
  'creatinine': 'creatinine', 'creat': 'creatinine',
  'bun': 'bun', 'urea': 'bun',
  'tsh': 'tsh',
  'free t4': 'freeT4', 'ft4': 'freeT4',
  'crp': 'crp', 'hs-crp': 'crp', 'hscrp': 'crp', 'c-reactive protein': 'crp',
  'homocysteine': 'homocysteine', 'hcy': 'homocysteine',
};

function normalize(key: string): string {
  return key.toLowerCase().trim().replace(/\s+/g, ' ');
}

function resolveDef(name: string, short?: string) {
  const candidates = [short, name].filter(Boolean).map((s) => normalize(s as string));
  for (const c of candidates) {
    if (ALIAS[c]) return BIOMARKER_DEFS.find((b) => b.id === ALIAS[c]);
    const direct = BIOMARKER_DEFS.find(
      (b) => normalize(b.shortName) === c || normalize(b.name) === c || b.id.toLowerCase() === c
    );
    if (direct) return direct;
  }
  return undefined;
}

function computeTone(b: Biomarker, sex: Sex): Tone {
  const status = (b.status ?? '').toLowerCase();
  if (status === 'high' || status === 'low' || status === 'critical' || status === 'abnormal') return 'out';
  const def = resolveDef(b.name, b.short_name);
  if (!def || typeof b.value !== 'number') {
    if (status === 'normal') return 'optimal';
    return 'unknown';
  }
  const norm = def.normalRange[sex];
  const opt = def.optimalRange?.[sex];
  const v = b.value;
  if (v < norm.min || v > norm.max) return 'out';
  if (opt) {
    if (v >= opt.min && v <= opt.max) return 'optimal';
    return 'borderline';
  }
  // Within 10% of normal bounds → borderline
  const margin = (norm.max - norm.min) * 0.1;
  if (v < norm.min + margin || v > norm.max - margin) return 'borderline';
  return 'optimal';
}

const TONE_PILL: Record<Tone, string> = {
  optimal: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  borderline: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  out: 'text-destructive bg-destructive/10 border-destructive/30',
  unknown: 'text-muted-foreground bg-muted/30 border-border',
};

const TONE_DOT: Record<Tone, string> = {
  optimal: 'hsl(160, 84%, 39%)',
  borderline: 'hsl(45, 93%, 47%)',
  out: 'hsl(0, 84%, 60%)',
  unknown: 'hsl(var(--primary))',
};

const TONE_BORDER: Record<Tone, string> = {
  optimal: 'border-emerald-500/40',
  borderline: 'border-amber-500/40',
  out: 'border-destructive/40',
  unknown: 'border-border',
};

function getPeptideName(id: string): string {
  const p = ALL_PEPTIDES.find((x) => x.id === id);
  return p?.name ?? id;
}

export function BloodworkTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [sex, setSex] = useState<Sex>('male');
  const [stacks, setStacks] = useState<StackEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: rData, error: rErr }, { data: sData }, { data: stData }] = await Promise.all([
        supabase
          .from('lab_reports')
          .select('id, report_date, uploaded_at, file_name, patient_sex, health_score, status, extracted_biomarkers, scan_type')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('uploaded_at', { ascending: false }),
        supabase.from('safety_profiles').select('sex').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_stacks').select('peptide_id, created_at').eq('user_id', user.id),
      ]);
      if (cancelled) return;
      if (rErr) console.error('[bloodwork-tab] load failed', rErr);
      else setReports((rData ?? []) as unknown as Report[]);
      const s = (sData?.sex ?? '').toLowerCase();
      if (s === 'female' || s === 'f') setSex('female');
      setStacks((stData ?? []) as StackEntry[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Per-biomarker trend across reports (oldest → newest)
  const trends = useMemo(() => {
    const map = new Map<string, { name: string; unit: string; def?: ReturnType<typeof resolveDef>; points: { date: string; value: number; status?: string }[] }>();
    const ordered = [...reports].sort((a, b) => (a.uploaded_at ?? '').localeCompare(b.uploaded_at ?? ''));
    for (const r of ordered) {
      const date = r.report_date ?? r.uploaded_at?.slice(0, 10) ?? '';
      for (const b of r.extracted_biomarkers ?? []) {
        const key = normalize(b.short_name ?? b.name ?? '');
        if (!key || typeof b.value !== 'number' || Number.isNaN(b.value)) continue;
        if (!map.has(key)) {
          map.set(key, {
            name: b.name,
            unit: b.unit ?? '',
            def: resolveDef(b.name, b.short_name),
            points: [],
          });
        }
        map.get(key)!.points.push({ date, value: b.value, status: b.status });
      }
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
  }, [reports]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/30 p-8 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <FlaskConical size={22} className="text-primary" />
        </div>
        <h3 className="text-base font-bold text-foreground">No bloodwork yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Upload your first lab report to start tracking biomarker trends and protocol impact.
        </p>
        <Button asChild className="mt-2 min-h-11">
          <Link to="/bloodwork"><Plus size={14} className="mr-1.5" />Upload bloodwork</Link>
        </Button>
      </div>
    );
  }

  const activeReport = reports.find((r) => r.id === selected) ?? reports[0];

  // Find a previous report (next one in the date-descending list) to compute deltas
  const activeIdx = reports.findIndex((r) => r.id === activeReport.id);
  const previousReport = activeIdx >= 0 && activeIdx < reports.length - 1 ? reports[activeIdx + 1] : null;
  const previousDateLabel = previousReport
    ? format(parseISO(previousReport.report_date ?? previousReport.uploaded_at.slice(0, 10)), 'd MMM yyyy')
    : null;

  // Protocol correlation banner: biggest favorable delta between active & previous,
  // matched against any user_stack peptide created between the two report dates.
  const correlation = (() => {
    if (!previousReport || !activeReport.extracted_biomarkers?.length) return null;
    const prevMap = new Map<string, number>();
    for (const b of previousReport.extracted_biomarkers ?? []) {
      if (typeof b.value === 'number') prevMap.set(normalize(b.short_name ?? b.name ?? ''), b.value);
    }
    const aDate = activeReport.report_date ?? activeReport.uploaded_at;
    const pDate = previousReport.report_date ?? previousReport.uploaded_at;
    const between = stacks.filter((s) => s.created_at >= pDate && s.created_at <= aDate);
    if (!between.length) return null;

    let best: { name: string; pct: number; favorable: boolean } | null = null;
    for (const b of activeReport.extracted_biomarkers) {
      const k = normalize(b.short_name ?? b.name ?? '');
      const prev = prevMap.get(k);
      if (prev == null || typeof b.value !== 'number' || prev === 0) continue;
      const pct = ((b.value - prev) / prev) * 100;
      const lowerBetter = LOWER_IS_BETTER.has(k);
      const favorable = lowerBetter ? pct < 0 : pct > 0;
      if (!favorable) continue;
      if (!best || Math.abs(pct) > Math.abs(best.pct)) {
        best = { name: b.name, pct, favorable };
      }
    }
    if (!best) return null;
    const peptideName = getPeptideName(between[0].peptide_id);
    return { ...best, peptideName };
  })();

  const labelDate = format(parseISO(activeReport.report_date ?? activeReport.uploaded_at.slice(0, 10)), 'd MMM yyyy');

  return (
    <div className="space-y-6">
      {/* Quick CTA */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{reports.length} report{reports.length === 1 ? '' : 's'} on file</p>
        <Button asChild size="sm" variant="outline" className="min-h-11">
          <Link to="/bloodwork"><Plus size={14} className="mr-1.5" />New scan</Link>
        </Button>
      </div>

      {/* Report cards */}
      <div className="grid gap-2">
        {reports.map((r) => {
          const date = r.report_date ?? r.uploaded_at?.slice(0, 10) ?? '';
          const count = r.extracted_biomarkers?.length ?? 0;
          const isActive = activeReport?.id === r.id;
          const lab = r.file_name?.split(/[-_ .]/).find((p) => p.length > 2) ?? null;
          return (
            <div
              key={r.id}
              className={`rounded-xl border p-3 transition-colors ${
                isActive ? 'border-primary/60 bg-primary/5' : 'border-border bg-card/40 hover:border-primary/40'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelected(r.id)}
                className="w-full text-left active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <FileText size={14} className="text-primary shrink-0" />
                      <span className="truncate">{r.file_name ?? 'Lab report'}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {date ? format(parseISO(date), 'd MMM yyyy') : 'Date unknown'} ·{' '}
                      {count} biomarker{count === 1 ? '' : 's'}
                      {r.scan_type === 'deep' && ' · Deep Decode'}
                    </p>
                    {lab && (
                      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 mt-0.5 truncate">
                        {lab}
                      </p>
                    )}
                  </div>
                </div>
              </button>
              <div className="mt-2 pt-2 border-t border-border/40 flex justify-end">
                <Link
                  to={`/bloodwork?report=${r.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline min-h-11 px-2"
                >
                  View report <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Protocol correlation banner */}
      {correlation && (
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 p-4 flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">Protocol correlation</p>
            <p className="text-sm text-foreground leading-snug">
              Your <span className="font-semibold">{correlation.name}</span>{' '}
              {correlation.pct > 0 ? 'increased' : 'decreased'}{' '}
              <span className="font-semibold">{Math.abs(correlation.pct).toFixed(0)}%</span>{' '}
              during your <span className="font-semibold">{correlation.peptideName}</span> cycle.
            </p>
          </div>
        </div>
      )}

      {/* Active report biomarkers + deltas */}
      {activeReport && (activeReport.extracted_biomarkers?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-border bg-card/40 p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FlaskConical size={14} className="text-primary" />
            Biomarkers · {labelDate}
          </h3>
          <div className="grid gap-1.5">
            {activeReport.extracted_biomarkers!.map((b, i) => {
              const k = normalize(b.short_name ?? b.name ?? '');
              const trend = trends.find((t) => t.key === k);
              const points = trend?.points ?? [];
              const prev = points.length > 1 ? points[points.length - 2].value : null;
              const delta = prev != null && typeof b.value === 'number' && prev !== 0
                ? ((b.value - prev) / prev) * 100
                : null;
              const lowerBetter = LOWER_IS_BETTER.has(k);
              const tone = computeTone(b, sex);
              const favorable = delta == null ? null : lowerBetter ? delta < 0 : delta > 0;
              const TrendIcon = delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
              const deltaTone =
                favorable === true ? 'text-emerald-500'
                : favorable === false ? 'text-amber-500'
                : 'text-muted-foreground';

              return (
                <div key={i} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{b.name}</p>
                    {b.reference_range && (
                      <p className="text-[10px] text-muted-foreground">Ref: {b.reference_range}</p>
                    )}
                    {delta == null ? (
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5">Baseline reading</p>
                    ) : (
                      <p className={`text-[10px] mt-0.5 inline-flex items-center gap-0.5 font-semibold ${deltaTone}`}>
                        <TrendIcon size={10} /> {Math.abs(delta).toFixed(0)}%
                        {tone === 'optimal' && favorable ? ' — optimal' : previousDateLabel ? ` from ${previousDateLabel}` : ''}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold rounded-md px-2 py-0.5 border shrink-0 ${TONE_PILL[tone]}`}>
                    {b.value}{b.unit ? ` ${b.unit}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trend charts for biomarkers with 2+ data points */}
      {trends.filter((t) => t.points.length >= 2).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" />Trend over time
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {trends
              .filter((t) => t.points.length >= 2)
              .map((t) => {
                const last = t.points[t.points.length - 1];
                const tone = computeTone(
                  { name: t.name, value: last.value, status: last.status, unit: t.unit },
                  sex
                );
                return (
                  <div key={t.key} className={`rounded-xl border bg-card/40 p-3 ${TONE_BORDER[tone]}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-foreground truncate">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.unit}</p>
                    </div>
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={t.points}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} hide />
                          <YAxis tick={{ fontSize: 9 }} width={28} />
                          <RTooltip
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                            labelFormatter={(d) => format(parseISO(String(d)), 'd MMM yyyy')}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={TONE_DOT[tone]}
                            strokeWidth={2}
                            dot={{ r: 3, fill: TONE_DOT[tone] }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Last upload age + reminder hint */}
      {reports[0] && (
        <p className="text-[11px] text-muted-foreground text-center">
          Last bloodwork uploaded {formatDistanceToNow(parseISO(reports[0].uploaded_at), { addSuffix: true })}.
          {' '}Re-test every 90 days for best protocol tracking.
        </p>
      )}
    </div>
  );
}

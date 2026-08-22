import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Search, X, ShoppingBag, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProtocolSections, Protocol } from './ProtocolSections';
import { SystemDashboard } from './SystemDashboard';
import { PatternDetection } from './PatternDetection';
import { StackCartProvider } from './StackCartContext';
import { StackCartBar } from './StackCartBar';
import { WhyRTDStrip } from './WhyRTDStrip';
import { summarizeSystems } from '@/lib/bloodwork/systems';
import { detectPatterns } from '@/lib/bloodwork/patterns';
import { trackBwEvent } from '@/lib/bloodwork/analytics';

export interface ResultBiomarker {
  name: string;
  name_de?: string;
  short_name?: string;
  value: number;
  unit: string;
  reference_range: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  category: string;
  layman_explanation?: string;
  layman_explanation_de?: string;
}

export interface BloodworkScanResult {
  scan_type: 'baseline' | 'deep';
  health_score?: number;
  biomarkers: ResultBiomarker[];
  insights: string[];
  insights_de?: string[];
  summary?: string;
  summary_de?: string;
  detected_language?: 'en' | 'de';
  protocol: Protocol;
  goals: string[];
}

type Lang = 'en' | 'de';
const LANG_KEY = 'rtd:bloodwork:lang';

const CATEGORY_ORDER = ['hormone', 'lipid', 'metabolic', 'liver', 'kidney', 'inflammation', 'thyroid', 'other'];
const CATEGORY_LABELS: Record<Lang, Record<string, string>> = {
  en: { hormone: 'Hormones', lipid: 'Lipids', metabolic: 'Metabolic', liver: 'Liver', kidney: 'Kidney', inflammation: 'Inflammation', thyroid: 'Thyroid', other: 'Other' },
  de: { hormone: 'Hormone', lipid: 'Lipide', metabolic: 'Stoffwechsel', liver: 'Leber', kidney: 'Nieren', inflammation: 'Entzündung', thyroid: 'Schilddrüse', other: 'Sonstige' },
};

const UI = {
  en: { title: 'Your Bloodwork Results', analysed: (n: number, g: number) => `${n} biomarkers analysed · ${g} goals`, shopStack: 'View research options', download: 'Download PDF', biomarkerPanel: 'Biomarker panel', insights: 'Insights', searchPlaceholder: 'Search biomarkers… (press / to focus)', shown: (a: number, b: number) => `${a}/${b} shown`, all: 'All', normal: 'Normal', low: 'Low', high: 'High', critical: 'Critical', noMatch: 'No biomarkers match this filter.', reset: 'Reset filters', clear: 'Clear filters', ref: 'Ref', langLabel: 'Language', optional: 'Optional research discussion and next steps' },
  de: { title: 'Ihre Blutwert-Ergebnisse', analysed: (n: number, g: number) => `${n} Biomarker analysiert · ${g} Ziele`, shopStack: 'Forschungsoptionen', download: 'PDF laden', biomarkerPanel: 'Biomarker-Panel', insights: 'Erkenntnisse', searchPlaceholder: 'Biomarker suchen… (drücken Sie /)', shown: (a: number, b: number) => `${a}/${b} sichtbar`, all: 'Alle', normal: 'Normal', low: 'Niedrig', high: 'Hoch', critical: 'Kritisch', noMatch: 'Keine Biomarker entsprechen diesem Filter.', reset: 'Filter zurücksetzen', clear: 'Filter löschen', ref: 'Ref', langLabel: 'Sprache', optional: 'Optionale Forschungsfragen und nächste Schritte' },
} as const;

type StatusFilter = 'all' | 'normal' | 'high' | 'low' | 'critical';

interface Props {
  result: BloodworkScanResult;
  onDownload: () => void;
  labReportId: string | null;
  preferredLanguage?: Lang;
}


export function BloodworkResults(props: Props) {
  const patternsTop = detectPatterns(props.result.biomarkers);
  useEffect(() => {
    trackBwEvent('bw_analysis_viewed', {
      scanType: props.result.scan_type,
      patterns: patternsTop.map((p) => p.id),
      biomarkerCount: props.result.biomarkers.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <StackCartProvider>
      <BloodworkResultsInner {...props} />
      <WhyRTDStrip />
      <StackCartBar patternIds={patternsTop.map((p) => p.id)} />
    </StackCartProvider>
  );
}

function BloodworkResultsInner({ result, onDownload, labReportId, preferredLanguage }: Props) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === 'undefined') return preferredLanguage ?? (result.detected_language ?? 'en') as Lang;
    if (preferredLanguage) return preferredLanguage;
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'de') return saved;
    return (result.detected_language ?? 'en') as Lang;
  });
  const t = UI[lang];
  const catLabels = CATEGORY_LABELS[lang];
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  const hasGerman = !!(result.summary_de || (result.insights_de && result.insights_de.length) || result.biomarkers.some((b) => b.name_de || b.layman_explanation_de));

  // Debounce search 150ms
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 150);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Keyboard: '/' focuses, Esc clears
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setSearch('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);


  const statusCounts = useMemo(() => {
    const c = { normal: 0, high: 0, low: 0, critical: 0 };
    for (const bm of result.biomarkers) c[bm.status] = (c[bm.status] ?? 0) + 1;
    return c;
  }, [result.biomarkers]);

  const filtered = useMemo(() => {
    return result.biomarkers.filter((bm) => {
      if (statusFilter !== 'all' && bm.status !== statusFilter) return false;
      if (debouncedSearch) {
        const hay = `${bm.name} ${bm.name_de ?? ''} ${bm.short_name ?? ''}`.toLowerCase();
        if (!hay.includes(debouncedSearch)) return false;
      }
      return true;
    });
  }, [result.biomarkers, debouncedSearch, statusFilter]);

  const grouped = groupByCategory(filtered);
  const visibleCategories = CATEGORY_ORDER.filter((c) => grouped[c]?.length);
  const hasFilter = debouncedSearch !== '' || statusFilter !== 'all';

  const summaryLine = lang === 'de' && result.summary_de ? result.summary_de : result.summary;

  return (
    <div className="space-y-12" id="bloodwork-results-root">
      {/* HEADER */}
      <header className="border-b border-border/50 pb-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
            {result.scan_type === 'deep' ? 'Deep Decode' : 'Baseline Scan'}
            {result.detected_language && (
              <span className="ml-2 text-muted-foreground/70">· {result.detected_language === 'de' ? 'DE source' : 'EN source'}</span>
            )}
          </p>
          {hasGerman && (
            <div
              role="group"
              aria-label={t.langLabel}
              className="inline-flex items-center gap-0 rounded-full border border-border/60 bg-card/40 p-0.5 text-[11px] font-semibold"
            >
              <Languages size={12} className="ml-1.5 text-muted-foreground" />
              {(['en', 'de'] as Lang[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  className={cn(
                    'px-2.5 py-1 rounded-full uppercase tracking-wider transition-colors',
                    lang === code ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {code}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.analysed(result.biomarkers.length, result.goals.length)}
            </p>
            {summaryLine && (
              <p className="mt-3 text-sm text-foreground/90 leading-relaxed max-w-2xl">{summaryLine}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {typeof result.health_score === 'number' && <HealthScoreRing score={result.health_score} />}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('bloodwork-stack-cart') || document.querySelector('[data-bloodwork-patterns]');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
            >
              <ShoppingBag size={14} /> {t.shopStack}
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground hover:border-primary/60 hover:text-primary transition-colors"
            >
              <Download size={14} /> {t.download}
            </button>
          </div>
        </div>
      </header>


      {/* SYSTEM DASHBOARD */}
      {result.scan_type === 'deep' && (
        <>
          <SystemDashboard
            systems={summarizeSystems(result.biomarkers)}
            onSelect={(cats) => {
              setStatusFilter('all');
              setSearch('');
              const first = cats[0];
              const el = document.querySelector(`[data-bm-category="${first}"]`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
          <PatternDetection patterns={detectPatterns(result.biomarkers)} />
        </>
      )}

      {/* BIOMARKER PANEL */}
      <section>
        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border/50">
          <span className="font-mono text-[11px] tracking-widest text-muted-foreground">02 —</span>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{t.biomarkerPanel}</h2>
        </div>

        {/* FILTER BAR */}
        <div className="sticky top-16 z-20 -mx-2 px-2 py-3 mb-4 bg-background/85 backdrop-blur-md rounded-lg border border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-9 py-2 rounded-lg bg-card/40 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                aria-label={t.searchPlaceholder}

              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'normal', 'low', 'high', 'critical'] as StatusFilter[]).map((s) => (
                <FilterChip
                  key={s}
                  label={s === 'all' ? t.all : t[s as 'normal' | 'high' | 'low' | 'critical']}
                  count={s === 'all' ? result.biomarkers.length : statusCounts[s]}
                  active={statusFilter === s}
                  status={s}
                  onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                />
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="tabular-nums">
              {t.shown(filtered.length, result.biomarkers.length)}
            </span>
            {hasFilter && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="uppercase tracking-wider hover:text-primary transition-colors"
              >
                {t.clear}

              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">{t.noMatch}</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="mt-2 text-xs uppercase tracking-wider text-primary hover:underline"
            >
              {t.reset}

            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {visibleCategories.map((cat) => (
              <div key={cat} data-bm-category={cat}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{catLabels[cat]}</p>
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  {grouped[cat].map((bm, i) => (
                    <BiomarkerRow key={`${cat}-${i}`} bm={bm} last={i === grouped[cat].length - 1} lang={lang} refLabel={t.ref} statusLabels={{ normal: t.normal, high: t.high, low: t.low, critical: t.critical }} />
                  ))}

                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* INSIGHTS */}
      {(() => {
        const activeInsights = lang === 'de' && result.insights_de && result.insights_de.length ? result.insights_de : result.insights;
        return activeInsights.length > 0 ? (
          <section>
            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border/50">
              <span className="font-mono text-[11px] tracking-widest text-muted-foreground">03 —</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{t.insights}</h2>
            </div>
            <ol className="space-y-3">
              {activeInsights.map((line, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                  <span className="font-mono text-[10px] text-primary mt-1 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null;
      })()}


      {/* PROTOCOL */}
      <details className="group rounded-2xl border border-border bg-card/50 p-4">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-sm font-semibold text-foreground marker:hidden">
          <span className="inline-flex items-center gap-2">
            <span className="text-accent transition-transform group-open:rotate-90">›</span>
            {t.optional}
          </span>
        </summary>
        <div className="mt-5 border-t border-border pt-5">
          <ProtocolSections protocol={result.protocol} goals={result.goals} labReportId={labReportId} />
        </div>
      </details>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  status,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  status: StatusFilter;
  onClick: () => void;
}) {
  const tone =
    status === 'normal'
      ? 'data-[active=true]:bg-green-500/15 data-[active=true]:text-green-500 data-[active=true]:border-green-500/30'
      : status === 'high'
      ? 'data-[active=true]:bg-red-500/15 data-[active=true]:text-red-500 data-[active=true]:border-red-500/30'
      : status === 'low'
      ? 'data-[active=true]:bg-yellow-500/15 data-[active=true]:text-yellow-600 data-[active=true]:border-yellow-500/30'
      : status === 'critical'
      ? 'data-[active=true]:bg-red-600/20 data-[active=true]:text-red-600 data-[active=true]:border-red-600/40'
      : 'data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:border-primary/40';
  return (
    <button
      type="button"
      data-active={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider transition-all',
        'border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40',
        tone
      )}
    >
      {label}
      <span className="text-[10px] font-mono tabular-nums opacity-80">{count}</span>
    </button>
  );
}

function HealthScoreRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const target = Math.max(0, Math.min(100, score));
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (animated / 100) * circ;
  const tone = score >= 75 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-[88px] h-[88px]"
      aria-label={`Health score ${animated} of 100`}
    >
      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          className={tone}
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-bold', tone)}>{animated}</span>
        <span className="text-[8px] uppercase tracking-widest text-muted-foreground">Score</span>
      </div>
    </motion.div>
  );
}

function BiomarkerRow({
  bm, last, lang, refLabel, statusLabels,
}: {
  bm: ResultBiomarker;
  last: boolean;
  lang: Lang;
  refLabel: string;
  statusLabels: Record<'normal' | 'high' | 'low' | 'critical', string>;
}) {
  const tone =
    bm.status === 'normal'
      ? 'bg-green-500/10 text-green-500 border-green-500/20'
      : bm.status === 'high'
      ? 'bg-red-500/10 text-red-500 border-red-500/20'
      : bm.status === 'low'
      ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      : 'bg-red-600/15 text-red-600 border-red-600/30';
  const Icon =
    bm.status === 'normal' ? CheckCircle : bm.status === 'high' ? TrendingUp : bm.status === 'low' ? TrendingDown : AlertTriangle;

  const displayName = lang === 'de' && bm.name_de ? bm.name_de : bm.name;
  const explanation = lang === 'de' && bm.layman_explanation_de ? bm.layman_explanation_de : bm.layman_explanation;

  return (
    <div className={cn('flex items-start gap-3 p-3 bg-card/30', !last && 'border-b border-border/40')}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
        <p className="text-[10px] text-muted-foreground">{refLabel}: {bm.reference_range}</p>
        {explanation && (
          <p className="text-[11px] text-muted-foreground/90 mt-1 leading-snug">{explanation}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-base font-bold text-foreground tabular-nums">{bm.value}</p>
        <p className="text-[10px] text-muted-foreground">{bm.unit}</p>
      </div>
      <span
        className={cn(
          'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border shrink-0',
          tone
        )}
      >
        <Icon size={10} /> {statusLabels[bm.status]}
      </span>
    </div>
  );
}


function groupByCategory(list: ResultBiomarker[]): Record<string, ResultBiomarker[]> {
  const out: Record<string, ResultBiomarker[]> = {};
  for (const bm of list) {
    const cat = (bm.category || 'other').toLowerCase();
    const key = CATEGORY_ORDER.includes(cat) ? cat : 'other';
    (out[key] ||= []).push(bm);
  }
  return out;
}

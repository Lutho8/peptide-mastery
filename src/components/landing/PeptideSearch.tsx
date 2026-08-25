import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, FlaskConical, Layers, Beaker, Sparkles, type LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { peptides, Peptide } from '@/data/peptides';
import { getAliasesFor, boundedLevenshtein } from '@/data/peptideAliases';
import { peptideBlends, PeptideBlend } from '@/data/peptideBlends';
import { getActiveStack } from '@/services/storage';
import { cn } from '@/lib/utils';
import { PeptideDetailModal } from '@/components/modals/PeptideDetailModal';
import { captureLead } from '@/lib/crm';
import { useAuth } from '@/contexts/AuthContext';

interface PeptideSearchProps {
  open: boolean;
  onClose: () => void;
}

type CategoryFilter = 'all' | 'peptides' | 'blends' | 'stacks';

interface SearchResult {
  id: string;
  kind: 'peptide' | 'blend' | 'stack';
  name: string;
  subtitle: string;
  tag?: string;
  score: number;
  raw: Peptide | PeptideBlend;
}

const RECENT_KEY = 'peptide_recent_searches';
const MAX_RECENT = 5;

function loadRecents(): string[] {
  try {
    const v = localStorage.getItem(RECENT_KEY);
    return v ? JSON.parse(v) : [];
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  if (!q || q.length < 2) return;
  try {
    const cur = loadRecents().filter((r) => r.toLowerCase() !== q.toLowerCase());
    const next = [q, ...cur].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function scoreMatch(haystack: string, q: string): number {
  const h = haystack.toLowerCase();
  const needle = q.toLowerCase();
  if (!needle) return 0;
  if (h === needle) return 100;
  if (h.startsWith(needle)) return 80;
  if (h.includes(needle)) return 55;
  // word-boundary prefix match (e.g. "tesa" → "Tesamorelin 5mg + Ipamorelin")
  for (const word of h.split(/[\s\-+()]+/)) {
    if (word.startsWith(needle)) return 65;
  }
  // typo tolerance for queries ≥3 chars: Levenshtein-1 vs any short word
  if (needle.length >= 3) {
    for (const word of h.split(/[\s\-+()]+/)) {
      if (word.length >= 3 && boundedLevenshtein(word, needle, 1) <= 1) return 35;
    }
  }
  // fuzzy: all chars present in order
  let i = 0;
  for (const c of h) if (c === needle[i]) i++;
  return i === needle.length ? 18 : 0;
}

function scoreEntity(
  q: string,
  name: string,
  shortName: string,
  extra: string[],
): number {
  if (!q) return 0;
  const aliases = getAliasesFor(name, shortName);
  let best = Math.max(
    scoreMatch(name, q),
    scoreMatch(shortName, q),
    ...aliases.map((a) => scoreMatch(a, q) + 5), // alias hits get small bonus
    ...extra.map((e) => scoreMatch(e, q) * 0.5),
  );
  // prefix boost on canonical name / shortName / aliases
  const ql = q.toLowerCase();
  if (
    name.toLowerCase().startsWith(ql) ||
    shortName.toLowerCase().startsWith(ql) ||
    aliases.some((a) => a.toLowerCase().startsWith(ql))
  ) {
    best += 25;
  }
  return best;
}

export function PeptideSearch({ open, onClose }: PeptideSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [recents, setRecents] = useState<string[]>(loadRecents());
  const [selectedPeptide, setSelectedPeptide] = useState<Peptide | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 120);
    return () => clearTimeout(t);
  }, [query]);

  // Lead capture
  useEffect(() => {
    if (!open || !debouncedQuery || debouncedQuery.length < 3 || !user?.email) return;
    const t = setTimeout(() => {
      captureLead({
        email: user.email,
        source: 'peptide_search',
        planInterest: 'undecided',
        activityType: 'peptide_search',
        activityData: { query: debouncedQuery.slice(0, 80) },
      });
    }, 800);
    return () => clearTimeout(t);
  }, [open, debouncedQuery, user?.email]);

  const stackItems = useMemo(() => {
    try {
      return getActiveStack();
    } catch {
      return [];
    }
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const q = debouncedQuery;
    const out: SearchResult[] = [];

    if (category === 'all' || category === 'peptides') {
      for (const p of peptides) {
        const s = q
          ? scoreEntity(q, p.name, p.shortName, [
              p.mechanism?.slice(0, 120) ?? '',
              p.category,
              ...(p.benefits ?? []),
            ])
          : 50;
        if (s > 0) {
          out.push({
            id: `p-${p.id}`,
            kind: 'peptide',
            name: p.shortName,
            subtitle: p.name,
            tag: p.halfLife,
            score: s,
            raw: p,
          });
        }
      }
    }

    if (category === 'all' || category === 'blends') {
      for (const b of peptideBlends) {
        const s = q
          ? scoreEntity(q, b.name, b.shortName, b.components ?? [])
          : 40;
        if (s > 0) {
          out.push({
            id: `b-${b.id}`,
            kind: 'blend',
            name: b.shortName,
            subtitle: b.name,
            tag: `${b.components.length} peptides`,
            score: s,
            raw: b,
          });
        }
      }
    }

    if (category === 'all' || category === 'stacks') {
      for (const item of stackItems) {
        const peptide = peptides.find((p) => p.id === item.peptideId);
        if (!peptide) continue;
        const s = q
          ? scoreEntity(q, peptide.name, peptide.shortName, [peptide.category])
          : 60;
        if (s > 0) {
          out.push({
            id: `s-${item.peptideId}`,
            kind: 'stack',
            name: peptide.shortName,
            subtitle: `In your stack · ${item.dose} ${item.frequency}`,
            tag: 'My Stack',
            score: s + 10,
            raw: peptide,
          });
        }
      }
    }

    return out.sort((a, b) => b.score - a.score).slice(0, q ? 20 : 12);
  }, [debouncedQuery, category, stackItems]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleSelect = (r: SearchResult) => {
    if (debouncedQuery) {
      saveRecent(debouncedQuery);
      setRecents(loadRecents());
    }
    if (r.kind === 'peptide' || r.kind === 'stack') {
      setSelectedPeptide(r.raw as Peptide);
      setDetailModalOpen(true);
    } else {
      // blend → navigate
      onClose();
      navigate(`/peptides/${(r.raw as PeptideBlend).id}`);
    }
  };

  const clearRecents = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecents([]);
  };

  if (!open) return null;

  const showRecents = !debouncedQuery && recents.length > 0;
  const chips: { id: CategoryFilter; label: string; icon: LucideIcon }[] = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'peptides', label: 'Peptides', icon: FlaskConical },
    { id: 'blends', label: 'Blends', icon: Beaker },
    { id: 'stacks', label: 'My Stack', icon: Layers },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-hidden"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="container mx-auto max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Search className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold">Search</h1>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search peptides, blends, stacks…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label="Clear"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {chips.map((c) => {
                const Icon = c.icon;
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                      active
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card/40 text-muted-foreground border-border/60 hover:border-primary/60 hover:text-foreground',
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="flex-1">
          <div className="container mx-auto max-w-3xl p-4">
            {showRecents && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Recent searches
                  </p>
                  <button
                    onClick={clearRecents}
                    className="text-[11px] text-muted-foreground hover:text-primary"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recents.map((r) => (
                    <button
                      key={r}
                      onClick={() => setQuery(r)}
                      className="px-3 py-1.5 rounded-full text-xs bg-card/60 border border-border/60 hover:border-primary/60 hover:text-primary transition-colors"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {results.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
                <AnimatePresence mode="popLayout">
                  {results.map((r, idx) => {
                    const Icon =
                      r.kind === 'peptide' ? FlaskConical : r.kind === 'blend' ? Beaker : Layers;
                    const tone =
                      r.kind === 'peptide'
                        ? 'text-blue-400 bg-blue-500/10'
                        : r.kind === 'blend'
                          ? 'text-purple-400 bg-purple-500/10'
                          : 'text-emerald-400 bg-emerald-500/10';
                    return (
                      <motion.div
                        key={r.id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, delay: Math.min(idx * 0.015, 0.1) }}
                      >
                        <Card
                          onClick={() => handleSelect(r)}
                          className="p-3 flex items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', tone)}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm truncate">{r.name}</p>
                              {r.tag && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {r.tag}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : debouncedQuery ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg text-muted-foreground">No results for "{debouncedQuery}"</p>
                <p className="text-sm text-muted-foreground">Try a different keyword or category.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card/50 p-4">
                <p className="text-sm font-medium text-foreground">Search the catalogue by name or category</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Results are matched to your search terms. They are not ranked as product recommendations.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <PeptideDetailModal
          peptide={selectedPeptide}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
        />
      </div>
    </motion.div>
  );
}

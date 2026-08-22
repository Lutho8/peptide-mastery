import { useState, useMemo } from 'react';
import { researchReferences } from '@/data/researchReferences';
import { peptides, getCategoryLabel } from '@/data/peptides';
import { peptideBlends, peptideStacks } from '@/data/peptideBlends';
import { evidenceTone, getBlendEvidence, getPeptideEvidence, RESEARCH_LAST_REVIEWED } from '@/data/researchEvidence';
import { GradientCard } from '@/components/ui/GradientCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ExternalLink, BookOpen, FlaskConical, Calendar, Users, Database, Layers, Scale, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterOption = 'all' | string;
type ViewMode = 'research' | 'peptides' | 'blends';

export function ResearchLibraryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [peptideFilter, setPeptideFilter] = useState<FilterOption>('all');
  const [topicFilter, setTopicFilter] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('research');
  const primaryReferences = useMemo(
    () => researchReferences.filter((ref) => ref.verificationStatus === 'primary-verified'),
    [],
  );

  // Get unique peptides that have research
  const peptideOptions = useMemo(() => {
    const uniquePeptideIds = new Set<string>();
    primaryReferences.forEach(ref => {
      ref.peptideIds.forEach(id => uniquePeptideIds.add(id));
    });
    return Array.from(uniquePeptideIds).map(id => {
      const peptide = peptides.find(p => p.id === id);
      return { id, name: peptide?.shortName || id.toUpperCase() };
    });
  }, [primaryReferences]);

  // Get unique topics/categories
  const topicOptions = useMemo(() => {
    const topics = new Set<string>();
    primaryReferences.forEach(ref => {
      ref.peptideIds.forEach(id => {
        const peptide = peptides.find(p => p.id === id);
        if (peptide) topics.add(peptide.category);
      });
    });
    return Array.from(topics).map(cat => ({
      id: cat,
      name: getCategoryLabel(cat as any)
    }));
  }, [primaryReferences]);

  const filteredReferences = useMemo(() => {
    return primaryReferences.filter(ref => {
      const matchesSearch = searchQuery === '' || 
        ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.journal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.keyFindings.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPeptide = peptideFilter === 'all' || ref.peptideIds.includes(peptideFilter);

      const matchesTopic = topicFilter === 'all' || ref.peptideIds.some(id => {
        const peptide = peptides.find(p => p.id === id);
        return peptide?.category === topicFilter;
      });

      return matchesSearch && matchesPeptide && matchesTopic;
    });
  }, [primaryReferences, searchQuery, peptideFilter, topicFilter]);

  const filteredPeptides = useMemo(() => {
    return peptides.filter(p => {
      const matchesSearch = searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCategoryLabel(p.category).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTopic = topicFilter === 'all' || p.category === topicFilter;

      return matchesSearch && matchesTopic;
    });
  }, [searchQuery, topicFilter]);

  const allBlends = useMemo(() => [...peptideBlends, ...peptideStacks], []);
  const filteredBlends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allBlends.filter((blend) => !q ||
      blend.name.toLowerCase().includes(q) ||
      blend.shortName.toLowerCase().includes(q) ||
      blend.components.some((component) => component.toLowerCase().includes(q))
    );
  }, [allBlends, searchQuery]);

  const getJournalColor = (journal: string) => {
    if (journal.toLowerCase().includes('nature')) return 'bg-emerald-500/20 text-emerald-400';
    if (journal.toLowerCase().includes('cell')) return 'bg-blue-500/20 text-blue-400';
    return 'bg-amber-500/20 text-amber-400';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'immune': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      'longevity': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'cognitive': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'metabolic': 'bg-red-500/20 text-red-400 border-red-500/30',
      'healing': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'gh-secretagogue': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="pb-24 space-y-4 fade-in">
      <div className="flex items-center gap-3 mb-2">
        <BookOpen className="text-primary" size={28} />
        <h1 className="text-2xl font-bold text-foreground">Research Library</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        {primaryReferences.length} primary-source records · {peptides.length} catalogued compounds · {allBlends.length} blends/stacks
      </p>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed text-muted-foreground">
        <div className="mb-2 flex items-center gap-2 font-semibold text-foreground"><Scale size={15} /> Legal and evidence notice</div>
        Catalog inclusion is not proof of legality, quality, approval, efficacy, compatibility or safety. Sources are educational and may describe laboratory, animal, observational or clinical research; evidence from a component does not validate a blend.
        <div className="mt-2 flex items-center gap-2 font-semibold text-foreground"><Stethoscope size={15} /> Medical disclaimer</div>
        This library is not medical advice, diagnosis, a prescription or a dosing guide. Do not start, stop or combine any product based on this page. Route patient-specific decisions, bloodwork interpretation and treatment to a qualified healthcare professional.
        <p className="mt-2 text-[11px]">Source review: {RESEARCH_LAST_REVIEWED}</p>
      </div>

      {/* View Toggle */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={viewMode === 'research' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('research')}
          className="flex-1"
        >
          <BookOpen size={16} className="mr-1" />
          Studies
        </Button>
        <Button
          variant={viewMode === 'peptides' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('peptides')}
          className="flex-1"
        >
          <Database size={16} className="mr-1" />
          Peptides
        </Button>
        <Button
          variant={viewMode === 'blends' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('blends')}
          className="min-h-11"
        >
          <Layers size={16} className="mr-1" />
          Blends
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={viewMode === 'research' ? "Search studies, authors, or findings..." : viewMode === 'peptides' ? "Search peptides..." : "Search blends, stacks, or components..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      {viewMode === 'research' && (
        <>
          {/* Peptide Filter */}
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground font-medium">Filter by Peptide:</span>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              <button
                onClick={() => setPeptideFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  peptideFilter === 'all'
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                All Peptides
              </button>
              {peptideOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPeptideFilter(opt.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    peptideFilter === opt.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Topic Filter */}
      {viewMode !== 'blends' && <div className="space-y-2">
        <span className="text-xs text-muted-foreground font-medium">Filter by Topic:</span>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setTopicFilter('all')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              topicFilter === 'all'
                ? "bg-secondary text-secondary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            All Topics
          </button>
          {topicOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTopicFilter(opt.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                topicFilter === opt.id
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {opt.name}
            </button>
          ))}
        </div>
      </div>}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {viewMode === 'research' 
          ? `Showing ${filteredReferences.length} of ${primaryReferences.length} verified source records`
          : viewMode === 'peptides'
            ? `Showing ${filteredPeptides.length} of ${peptides.length} catalogued compounds`
            : `Showing ${filteredBlends.length} of ${allBlends.length} blends and stacks`
        }
      </div>

      {viewMode === 'research' ? (
        /* Research Cards */
        <div className="space-y-4">
          {filteredReferences.map((ref) => (
            <GradientCard key={ref.id} className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-sm leading-tight mb-2">
                    {ref.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Users size={12} />
                    <span className="truncate">{ref.authors}</span>
                  </div>
                </div>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              </div>

              {/* Journal & Year */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("text-xs", getJournalColor(ref.journal))}>
                  {ref.journal}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar size={12} />
                  <span>{ref.year}</span>
                </div>
                {ref.pmid && (
                  <span className="text-xs text-muted-foreground">PMID: {ref.pmid}</span>
                )}
              </div>

              {/* Peptides - clickable */}
              <div className="flex flex-wrap gap-1.5">
                {ref.peptideIds.map((peptideId) => {
                  const peptide = peptides.find(p => p.id === peptideId);
                  return (
                    <span
                      key={peptideId}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 border border-primary/30 text-primary"
                    >
                      <FlaskConical size={10} />
                      {peptide?.shortName || peptideId.toUpperCase()}
                    </span>
                  );
                })}
              </div>

              {/* Key Findings */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <span className="text-xs font-medium text-foreground">Key Findings:</span>
                <ul className="space-y-1.5">
                  {ref.keyFindings.slice(0, 4).map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                  {ref.keyFindings.length > 4 && (
                    <li className="text-xs text-primary">
                      +{ref.keyFindings.length - 4} more findings...
                    </li>
                  )}
                </ul>
              </div>

              {/* Study intervention is historical trial context, not a recommendation. */}
              {ref.dosageInfo && (
                <div className="pt-2 border-t border-border/50">
                  <span className="text-xs font-medium text-foreground">Study intervention: </span>
                  <span className="text-xs text-muted-foreground">{ref.dosageInfo}</span>
                </div>
              )}
            </GradientCard>
          ))}

          {filteredReferences.length === 0 && (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No research papers found matching your criteria</p>
            </div>
          )}
        </div>
      ) : viewMode === 'peptides' ? (
        /* Peptide Database */
        <div className="space-y-3">
          {filteredPeptides.map((peptide) => (
            <GradientCard key={peptide.id}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{peptide.name}</h3>
                    <span className="text-xs text-muted-foreground">({peptide.shortName})</span>
                  </div>
                  <Badge className={cn("text-xs", getCategoryColor(peptide.category))}>
                    {getCategoryLabel(peptide.category)}
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {peptide.mechanism}
              </p>

              {(() => {
                const evidence = getPeptideEvidence(peptide);
                return (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <Badge variant="outline" className={cn('text-[10px]', evidenceTone[evidence.level])}>{evidence.label}</Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">{evidence.note}</p>
                    {evidence.sourceUrl && <a href={evidence.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">{evidence.sourceLabel || 'Primary source'} <ExternalLink size={11} /></a>}
                  </div>
                );
              })()}

              {/* Research References */}
              {peptide.references && peptide.references.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <BookOpen size={10} />
                    {peptide.references.length} research reference{peptide.references.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </GradientCard>
          ))}

          {filteredPeptides.length === 0 && (
            <div className="text-center py-12">
              <Database size={48} className="mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No peptides found matching your criteria</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredBlends.map((blend) => {
            const evidence = getBlendEvidence(blend);
            return (
              <GradientCard key={blend.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{blend.shortName}</h3>
                    <p className="text-xs text-muted-foreground">{blend.type === 'blend' ? 'Premixed blend' : 'Research stack'} · {blend.category}</p>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px]', evidenceTone[evidence.level])}>{evidence.label}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {blend.components.map((component) => <span key={component} className="rounded-full border border-border bg-muted/40 px-2 py-1 text-[11px] text-foreground">{component}</span>)}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{evidence.note}</p>
              </GradientCard>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/50 p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="font-semibold text-foreground">Further reading · practitioner perspective</p>
        <p className="mt-1">Jay Campbell, <em>Optimize Your Health with Therapeutic Peptides</em>. This is included as a named practitioner reference, not as a substitute for primary research, regulator information or individualized medical care.</p>
        <a href="https://jaycampbell.com/blog/optimize-your-health-with-therapeutic-peptides-exploring-the-golden-age-agents-of-the-2020s/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-primary hover:underline">Author reference <ExternalLink size={11} /></a>
      </div>

    </div>
  );
}

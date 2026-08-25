import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FlaskConical, Clock, Shield, BookOpen, AlertTriangle } from 'lucide-react';
import { corePeptides, categoryConfig } from '@/data/peptides';
import { topPeptidesSlugs, categorySlugs } from '@/data/entitySlugs';
import { SEOHead } from '@/components/seo/SEOHead';
import { JsonLd, buildPeptideSchema } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { GradientCard } from '@/components/ui/GradientCard';
import { Badge } from '@/components/ui/badge';

const BASE_URL = 'https://peptide-south-africa.co.za';

export default function PeptideEntityPage() {
  const { slug } = useParams<{ slug: string }>();
  const peptideId = slug ? topPeptidesSlugs[slug] : undefined;
  const peptide = corePeptides.find(p => p.id === peptideId);

  if (!peptide || !slug) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Peptide Not Found</h1>
          <p className="text-muted-foreground mb-6">This peptide doesn't have a dedicated page yet.</p>
          <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const catConfig = categoryConfig[peptide.category];
  const relatedPeptides = corePeptides
    .filter(p => p.category === peptide.category && p.id !== peptide.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${peptide.name} – Mechanism, Evidence and Research | Peptide South Africa`}
        description={`${peptide.name}: ${peptide.mechanism.slice(0, 140)}. Evidence context, limitations, risks, and research references.`}
        canonical={`${BASE_URL}/peptides/${slug}`}
      />
      <JsonLd
        data={buildPeptideSchema({
          name: peptide.name,
          slug,
          description: peptide.mechanism,
          category: catConfig?.label || peptide.category,
          molecularWeight: peptide.molecularWeight,
          halfLife: peptide.halfLife,
        })}
        id={`peptide-${slug}`}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-4 text-sm">
          <ArrowLeft size={16} /> Back to Research Platform
        </Link>

        <Breadcrumbs items={[
          { label: catConfig?.label || 'Peptides', href: `/categories/${Object.entries(topPeptidesSlugs).find(([,v]) => v === peptide.category)?.[0] || peptide.category}` },
          { label: peptide.name, href: `/peptides/${slug}` }
        ]} />

        {/* Hero */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="outline" className={catConfig?.color}>
              {catConfig?.label}
            </Badge>
            {peptide.janoshikTested && (
              <Badge variant="secondary" className="text-green-400">
                ✓ Janoshik Verified
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{peptide.name}</h1>
          {peptide.shortName !== peptide.name && (
            <p className="text-lg text-muted-foreground">Also known as: {peptide.shortName}</p>
          )}
        </header>

        {/* Quick Facts */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {peptide.molecularWeight && (
            <GradientCard className="p-3 text-center">
              <FlaskConical size={18} className="mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Molecular Weight</p>
              <p className="text-sm font-semibold text-foreground">{peptide.molecularWeight}</p>
            </GradientCard>
          )}
          {peptide.halfLife && (
            <GradientCard className="p-3 text-center">
              <Clock size={18} className="mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Half-Life</p>
              <p className="text-sm font-semibold text-foreground">{peptide.halfLife}</p>
            </GradientCard>
          )}
        </div>

        {/* Mechanism of Action */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            Mechanism of Action
          </h2>
          <GradientCard>
            <p className="text-muted-foreground leading-relaxed">{peptide.mechanism}</p>
          </GradientCard>
        </section>

        {/* Research areas */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-3">Research areas reported in source material</h2>
          <GradientCard>
            <p className="mb-3 text-sm text-muted-foreground">These topics describe the catalogue's research index. They are not promised outcomes or personal recommendations.</p>
            <ul className="space-y-2">
              {peptide.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  {b}
                </li>
              ))}
            </ul>
          </GradientCard>
        </section>

        {/* Safety & Risks */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
            <Shield size={20} className="text-destructive" />
            Safety & Risks
          </h2>
          <GradientCard>
            <ul className="space-y-2">
              {peptide.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertTriangle size={14} className="text-yellow-500 mt-0.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
            {peptide.contraindications && peptide.contraindications.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-sm font-medium text-destructive mb-2">Contraindications:</p>
                <ul className="space-y-1">
                  {peptide.contraindications.map((c, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </GradientCard>
        </section>

        {/* Research References */}
        {peptide.notableStudies && peptide.notableStudies.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3">Notable Research</h2>
            <div className="space-y-2">
              {peptide.notableStudies.map((study, i) => (
                <GradientCard key={i} className="p-3">
                  <p className="text-sm font-medium text-foreground">{study.title} ({study.year})</p>
                  <p className="text-xs text-muted-foreground mt-1">{study.finding}</p>
                  {study.doi && (
                    <a href={`https://doi.org/${study.doi}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                      DOI: {study.doi} <ExternalLink size={10} />
                    </a>
                  )}
                </GradientCard>
              ))}
            </div>
          </section>
        )}

        {/* Internal Linking: Related Peptides */}
        {relatedPeptides.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3">Related {catConfig?.label} Peptides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {relatedPeptides.map(rp => {
                const rpSlug = Object.entries(topPeptidesSlugs).find(([, v]) => v === rp.id)?.[0];
                return (
                  <GradientCard key={rp.id} hover className="p-3">
                    {rpSlug ? (
                      <Link to={`/peptides/${rpSlug}`} className="block">
                        <p className="font-medium text-foreground hover:text-primary">{rp.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rp.mechanism.slice(0, 100)}…</p>
                      </Link>
                    ) : (
                      <div>
                        <p className="font-medium text-foreground">{rp.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rp.mechanism.slice(0, 100)}…</p>
                      </div>
                    )}
                  </GradientCard>
                );
              })}
            </div>
          </section>
        )}

        {/* Category Hub Link */}
        <section className="mb-8">
          <GradientCard className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Explore more peptides in this category</p>
            <Link 
              to={`/categories/${Object.entries(categorySlugs).find(([,v]) => v === peptide.category)?.[0] || peptide.category}`}
              className="text-primary font-medium hover:underline"
            >
              View All {catConfig?.label} Peptides →
            </Link>
          </GradientCard>
        </section>

        {/* Disclaimer */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground">
          <p><strong>Research Disclaimer:</strong> This information is compiled from published research and is provided for educational purposes only. 
          Peptides discussed here are classified as research chemicals in most jurisdictions and are not FDA-approved for human use unless otherwise noted. 
          Consult a qualified healthcare provider before starting any protocol.</p>
        </div>
      </div>
    </div>
  );
}

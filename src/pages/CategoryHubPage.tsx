import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { corePeptides, categoryConfig, PeptideCategory } from '@/data/peptides';
import { categorySlugs, categoryMeta } from '@/data/entitySlugs';
import { topPeptidesSlugs } from '@/data/entitySlugs';
import { SEOHead } from '@/components/seo/SEOHead';
import { JsonLd, buildCollectionSchema } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { GradientCard } from '@/components/ui/GradientCard';
import { Badge } from '@/components/ui/badge';

const BASE_URL = 'https://peptide-south-africa.co.za';

export default function CategoryHubPage() {
  const { slug } = useParams<{ slug: string }>();
  const categoryId = slug ? categorySlugs[slug] as PeptideCategory : undefined;
  const meta = slug ? categoryMeta[slug] : undefined;

  if (!categoryId || !meta || !slug) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Category Not Found</h1>
          <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const catConfig = categoryConfig[categoryId];
  const peptides = corePeptides.filter(p => p.category === categoryId);
  
  const collectionItems = peptides.map(p => {
    const pSlug = Object.entries(topPeptidesSlugs).find(([, v]) => v === p.id)?.[0];
    return { name: p.name, url: pSlug ? `${BASE_URL}/peptides/${pSlug}` : `${BASE_URL}/categories/${slug}` };
  });

  // Related categories for internal linking
  const otherCategories = Object.entries(categorySlugs)
    .filter(([s]) => s !== slug)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={meta.title} description={meta.description} canonical={`${BASE_URL}/categories/${slug}`} />
      <JsonLd data={buildCollectionSchema(meta.title, meta.description, `${BASE_URL}/categories/${slug}`, collectionItems)} id={`category-${slug}`} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-4 text-sm">
          <ArrowLeft size={16} /> Back to Research Platform
        </Link>

        <Breadcrumbs items={[
          { label: catConfig?.label || slug, href: `/categories/${slug}` }
        ]} />

        <header className="mb-8">
          <Badge variant="outline" className={catConfig?.color + ' mb-3'}>{catConfig?.label}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{catConfig?.label} Peptides</h1>
          <p className="text-muted-foreground leading-relaxed">{meta.intro}</p>
        </header>

        {/* Peptide Grid */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">
            All {catConfig?.label} Peptides ({peptides.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {peptides.map(p => {
              const pSlug = Object.entries(topPeptidesSlugs).find(([, v]) => v === p.id)?.[0];
              const CardContent = (
                <GradientCard hover className="p-4 h-full">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    {p.janoshikTested && <Badge variant="secondary" className="text-xs text-green-400">Verified</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{p.mechanism.slice(0, 150)}…</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {p.halfLife && <span>Half-life: {p.halfLife}</span>}
                    <span>• {p.administration}</span>
                  </div>
                </GradientCard>
              );
              return pSlug ? (
                <Link key={p.id} to={`/peptides/${pSlug}`}>{CardContent}</Link>
              ) : (
                <div key={p.id}>{CardContent}</div>
              );
            })}
          </div>
        </section>

        {/* Related Categories */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Explore Other Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {otherCategories.map(([catSlug]) => {
              const catId = categorySlugs[catSlug] as PeptideCategory;
              const cc = categoryConfig[catId];
              return cc ? (
                <Link key={catSlug} to={`/categories/${catSlug}`}>
                  <GradientCard hover className="p-3 text-center">
                    <p className="font-medium text-foreground text-sm">{cc.label}</p>
                    <p className="text-xs text-muted-foreground">{cc.count} peptides</p>
                  </GradientCard>
                </Link>
              ) : null;
            })}
          </div>
        </section>

        <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground">
          <p><strong>Research Disclaimer:</strong> Information provided for educational purposes only. 
          Consult a qualified healthcare provider before starting any protocol.</p>
        </div>
      </div>
    </div>
  );
}

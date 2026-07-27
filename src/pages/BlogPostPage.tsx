import { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Calendar, Clock, ChevronLeft, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { buildBreadcrumbSchema } from '@/components/seo/JsonLd';
import { blogPosts, type BlogPost } from '@/data/blogPosts';

const formatDate = (iso: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
};

function buildArticleSchema(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    datePublished: post.date,
    dateModified: post.date,
    articleSection: post.category,
    keywords: post.category,
    author: { '@type': 'Organization', name: 'Peptide South Africa Research' },
    publisher: {
      '@type': 'Organization',
      name: 'Peptide South Africa',
      logo: { '@type': 'ImageObject', url: 'https://peptide-south-africa.co.za/logo-animated.png' },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://peptide-south-africa.co.za/blog/${post.slug}`,
    },
  };
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = useMemo(() => blogPosts.find(p => p.slug === slug), [slug]);
  const related = useMemo(() => {
    if (!post) return [];
    return blogPosts
      .filter(p => p.slug !== post.slug && p.category === post.category)
      .slice(0, 3);
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  const canonical = `https://peptide-south-africa.co.za/blog/${post.slug}`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.excerpt, url: canonical });
      } else {
        await navigator.clipboard.writeText(canonical);
      }
    } catch { /* ignore */ }
  };

  return (
    <>
      <SEOHead
        title={`${post.title} | Peptide South Africa`}
        description={post.excerpt}
        canonical={canonical}
        ogType="article"
        ogImage={post.ogImage || post.image || undefined}
        keywords={post.keywords || post.category}
        jsonLd={[
          buildArticleSchema(post),
          buildBreadcrumbSchema([
            { name: 'Home', url: 'https://peptide-south-africa.co.za/' },
            { name: 'Blog', url: 'https://peptide-south-africa.co.za/blog' },
            { name: post.title, url: canonical },
          ]),
        ]}
      />

      <article className="min-h-screen bg-background">
        {/* Hero */}
        <div className="border-b border-border/40 bg-gradient-to-b from-secondary/20 to-transparent">
          <div className="container mx-auto px-4 pt-8 pb-12 max-w-4xl">
            <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
              <ChevronLeft className="w-4 h-4" /> All articles
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 mb-4">
                {post.category}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{post.title}</h1>
              <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(post.date)}</span>
                {post.readTime && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{post.readTime}</span>}
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5 h-7 text-xs">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Hero image */}
        {post.image && (
          <div className="container mx-auto px-4 max-w-4xl -mt-2">
            <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-border/40 bg-secondary/40">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" loading="eager" />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="container mx-auto px-4 max-w-3xl py-12">
          <div className="prose prose-invert prose-lg max-w-none
            prose-headings:tracking-tight prose-headings:text-foreground
            prose-p:text-foreground/90 prose-li:text-foreground/90
            prose-a:text-primary hover:prose-a:text-primary/80
            prose-strong:text-foreground
            prose-img:rounded-xl prose-img:border prose-img:border-border/40
            prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
            prose-code:text-primary prose-code:bg-secondary/40 prose-code:px-1 prose-code:rounded">
            {post.contentMd
              ? <ReactMarkdown>{post.contentMd}</ReactMarkdown>
              : <p className="text-muted-foreground italic">Full article content coming soon.</p>}
          </div>

          {/* Disclaimer */}
          <div className="mt-12 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-muted-foreground">
            <strong className="text-destructive">Research disclaimer:</strong>{' '}
            Peptides discussed are for research and educational purposes only. They are not approved for human consumption
            unless specifically noted as FDA-approved medications. Always consult a qualified healthcare professional.
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="border-t border-border/40 py-12 bg-secondary/10">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-2xl font-bold mb-6">More in {post.category}</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {related.map(r => (
                  <Link key={r.slug} to={`/blog/${r.slug}`} className="group">
                    <Card className="h-full hover:border-primary/40 transition-colors">
                      <CardHeader>
                        <Badge variant="outline" className="w-fit text-xs">{r.category}</Badge>
                        <CardTitle className="text-base mt-2 group-hover:text-primary transition-colors line-clamp-2">
                          {r.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">{r.excerpt}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </article>
    </>
  );
}

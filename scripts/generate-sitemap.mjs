// Generates public/sitemap.xml. Runs via predev/prebuild hooks with Node only.
import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE_URL = 'https://peptide-south-africa.co.za';

const staticEntries = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/install', changefreq: 'monthly', priority: '0.8' },
  { path: '/live-qna', changefreq: 'monthly', priority: '0.6' },
  { path: '/coa-verification', changefreq: 'monthly', priority: '0.5' },
  { path: '/bloodwork', changefreq: 'monthly', priority: '0.8' },
  { path: '/cycles', changefreq: 'monthly', priority: '0.6' },
  { path: '/blog', changefreq: 'daily', priority: '0.9' },
  { path: '/faq', changefreq: 'monthly', priority: '0.9' },
  { path: '/confessions', changefreq: 'daily', priority: '0.7' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/disclaimer', changefreq: 'yearly', priority: '0.3' },
  { path: '/weight-loss-peptides-south-africa', changefreq: 'monthly', priority: '0.9' },
  { path: '/healing-peptides-south-africa', changefreq: 'monthly', priority: '0.9' },
  { path: '/anti-aging-peptides-south-africa', changefreq: 'monthly', priority: '0.9' },
  { path: '/cognitive-peptides-south-africa', changefreq: 'monthly', priority: '0.9' },
  { path: '/growth-hormone-peptides-south-africa', changefreq: 'monthly', priority: '0.9' },
  { path: '/libido-peptides-south-africa', changefreq: 'monthly', priority: '0.9' },
  { path: '/bpc-157-vs-tb-500', changefreq: 'monthly', priority: '0.8' },
];

const peptides = [
  'bpc-157', 'tb-500', 'retatrutide', 'tirzepatide', 'ipamorelin', 'cjc-1295',
  'ghk-cu', 'epitalon', 'ss-31', 'semax', 'selank', 'thymosin-alpha-1',
  'pt-141', 'dsip', 'semaglutide',
  'eloralintide',
];
const categories = ['healing', 'weight-loss', 'longevity', 'cognitive', 'immune', 'growth-hormone', 'skin-hair', 'hormonal', 'metabolic'];
const guides = ['reconstitution', 'injection', 'bloodwork'];

function readBlogSlugs() {
  try {
    const source = readFileSync(resolve('src/data/blogPosts.ts'), 'utf8');
    const marker = source.indexOf('blogPosts: BlogPost[]');
    const start = source.indexOf('[', source.indexOf('=', marker));
    const end = source.lastIndexOf('];');
    const posts = JSON.parse(source.slice(start, end + 1));
    return posts.map((post) => ({ slug: post.slug || post.id, date: post.date }));
  } catch (error) {
    console.warn('sitemap: could not read blog posts:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

const entries = [
  ...staticEntries,
  ...peptides.map((slug) => ({ path: `/peptides/${slug}`, changefreq: 'monthly', priority: '0.9' })),
  ...categories.map((slug) => ({ path: `/categories/${slug}`, changefreq: 'monthly', priority: '0.8' })),
  ...guides.map((slug) => ({ path: `/guides/${slug}`, changefreq: 'monthly', priority: '0.9' })),
  ...readBlogSlugs().map((post) => ({ path: `/blog/${post.slug}`, changefreq: 'monthly', priority: '0.7', lastmod: post.date || undefined })),
];

const lastmod = new Date().toISOString().slice(0, 10);
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.map((entry) => [
    '  <url>',
    `    <loc>${BASE_URL}${entry.path}</loc>`,
    `    <lastmod>${entry.lastmod || lastmod}</lastmod>`,
    entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
    entry.priority ? `    <priority>${entry.priority}</priority>` : null,
    '  </url>',
  ].filter(Boolean).join('\n')),
  '</urlset>',
].join('\n');

writeFileSync(resolve('public/sitemap.xml'), xml);
console.log(`sitemap.xml written (${entries.length} entries, lastmod=${lastmod})`);

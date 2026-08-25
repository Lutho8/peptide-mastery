import { Helmet } from 'react-helmet-async';
import { businessInfo, postalAddressSchema } from '@/data/businessInfo';

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
  id?: string;
}

/**
 * Emits JSON-LD structured data via Helmet so it is present in server-rendered
 * / prerendered HTML and read by crawlers without executing JS. Previously this
 * injected a <script> through document.head in a useEffect, which never runs
 * for crawlers that don't execute JS — so the structured data was effectively
 * invisible to search engines. Rendering through Helmet fixes that while still
 * working client-side. (`id` is accepted for backward compatibility; Helmet
 * dedupes identical tags automatically.)
 */
export function JsonLd({ data }: JsonLdProps) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <Helmet>
      {items.map((item, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}

// Reusable schema builders
export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Peptide South Africa',
    url: 'https://peptide-south-africa.co.za',
    logo: 'https://peptide-south-africa.co.za/logo-animated.png',
    description: 'South African peptide research platform providing source-led education, user-entered tracking, and bloodwork organisation.',
    email: businessInfo.email,
    telephone: businessInfo.telephone,
    address: postalAddressSchema(),
    sameAs: [
      'https://peptide-south-africa.com',
      'https://capetownpeptideclub.co.za',
    ],
    knowsAbout: [
      'Peptide research', 'BPC-157', 'TB-500', 'Retatrutide', 'Tirzepatide',
      'Growth hormone secretagogues', 'Biomarker organisation',
      'Research methods', 'Clinical pathway navigation'
    ]
  };
}

export function buildLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://peptide-south-africa.co.za/#localbusiness',
    name: businessInfo.legalName,
    url: 'https://peptide-south-africa.co.za',
    image: 'https://peptide-south-africa.co.za/logo-animated.png',
    telephone: businessInfo.telephone,
    priceRange: 'R500 - R4000',
    address: postalAddressSchema(),
    geo: {
      '@type': 'GeoCoordinates',
      latitude: businessInfo.geo.latitude,
      longitude: businessInfo.geo.longitude,
    },
    areaServed: { '@type': 'Country', name: 'South Africa' },
  };
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Peptide South Africa – Peptide Research & Tracking Platform',
    url: 'https://peptide-south-africa.co.za',
    description: 'Source-led peptide database with user-entered tracking, guided pathway navigation, and bloodwork organisation.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://peptide-south-africa.co.za/peptides?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };
}

export function buildFAQSchema(faqs: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a
      }
    }))
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function buildHowToSchema(name: string, description: string, steps: Array<{ name: string; text: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text
    }))
  };
}

export function buildPeptideSchema(peptide: {
  name: string;
  slug: string;
  description: string;
  category: string;
  molecularWeight?: string;
  halfLife?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: peptide.name,
    url: `https://peptide-south-africa.co.za/peptides/${peptide.slug}`,
    description: peptide.description,
    additionalProperty: [
      peptide.molecularWeight && { '@type': 'PropertyValue', name: 'Molecular Weight', value: peptide.molecularWeight },
      peptide.halfLife && { '@type': 'PropertyValue', name: 'Half-Life', value: peptide.halfLife },
      { '@type': 'PropertyValue', name: 'Category', value: peptide.category },
    ].filter(Boolean)
  };
}

export function buildCollectionSchema(name: string, description: string, url: string, items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    hasPart: items.map(item => ({
      '@type': 'MedicalEntity',
      name: item.name,
      url: item.url
    }))
  };
}

import { Link } from 'react-router-dom';
import { Twitter, Mail, Linkedin } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';
import { blogPosts } from '@/data/blogPosts';
import { businessInfo } from '@/data/businessInfo';

type FooterLink = { label: string; href: string; isRoute?: boolean; external?: boolean };

const latestBlogs: FooterLink[] = blogPosts.slice(0, 5).map(p => ({
  label: p.title.length > 52 ? p.title.slice(0, 52) + '…' : p.title,
  href: `/blog/${p.slug}`,
  isRoute: true,
}));

const footerLinks: Record<string, FooterLink[]> = {
  Blogs: [
    ...latestBlogs,
    { label: 'Browse all blogs →', href: '/blog', isRoute: true },
  ],
  'Popular Peptides': [
    { label: 'BPC-157', href: '/peptides/bpc-157', isRoute: true },
    { label: 'Retatrutide', href: '/peptides/retatrutide', isRoute: true },
    { label: 'Tirzepatide', href: '/peptides/tirzepatide', isRoute: true },
    { label: 'Semaglutide', href: '/peptides/semaglutide', isRoute: true },
    { label: 'Ipamorelin', href: '/peptides/ipamorelin', isRoute: true },
  ],
  Categories: [
    { label: 'Weight Loss', href: '/categories/weight-loss', isRoute: true },
    { label: 'Healing', href: '/categories/healing', isRoute: true },
    { label: 'Growth Hormone', href: '/categories/growth-hormone', isRoute: true },
    { label: 'Longevity', href: '/categories/longevity', isRoute: true },
    { label: 'Cognitive', href: '/categories/cognitive', isRoute: true },
  ],
  Guides: [
    { label: 'Reconstitution Guide', href: '/guides/reconstitution', isRoute: true },
    { label: 'Injection Guide', href: '/guides/injection', isRoute: true },
    { label: 'Bloodwork Monitoring', href: '/guides/bloodwork', isRoute: true },
    { label: 'Free Course', href: '/free-course', isRoute: true },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy', isRoute: true },
    { label: 'Terms of Service', href: '/terms', isRoute: true },
    { label: 'Disclaimer', href: '/disclaimer', isRoute: true },
    { label: 'Contact', href: 'mailto:contact@peptide-south-africa.com' },
  ],
  Network: [
    { label: 'PSA Research Peptides', href: 'https://peptide-south-africa.com?utm_source=tracker&utm_medium=footer&utm_campaign=buy_peptides' },
    { label: 'Cape Town Peptide Club', href: 'https://capetownpeptideclub.co.za' },
    { label: 'WhatsApp Us', href: 'https://wa.me/27641344646?text=Hi%2C%20I%27d%20like%20to%20know%20more%20about%20Peptide%20South%20Africa' },
  ],
};

export function LandingFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
              aria-label="Back to top"
            >
              <img src={logoIcon} alt="Peptide South Africa" className="w-8 h-8 rounded-lg" />
              <span className="text-lg font-bold">Peptide South Africa</span>
            </button>
            <p className="text-sm text-muted-foreground mb-4">
              Your research-grade peptide database with comprehensive scientific data and tracking tools.
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="mailto:contact@peptide-south-africa.com" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold mb-4 text-foreground">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.isRoute ? (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors line-clamp-2"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors line-clamp-2"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Medical Disclaimer */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-destructive">Medical Disclaimer:</strong> The information provided on this website is for educational and research purposes only. 
              It is not intended as medical advice, diagnosis, or treatment. Always consult with a qualified healthcare professional before starting any new supplement or treatment regimen. 
              Peptides mentioned are for research purposes only and are not approved for human consumption unless specifically noted as FDA-approved medications.
            </p>
          </div>
          <address className="not-italic text-sm text-muted-foreground mb-6 flex flex-col gap-1 items-center md:items-start" itemScope itemType="https://schema.org/PostalAddress">
            <span>
              <span itemProp="streetAddress">De Buurt, Richwood</span>,{' '}
              <span itemProp="addressLocality">Milnerton</span>,{' '}
              <span itemProp="postalCode">7441</span>,{' '}
              <span itemProp="addressRegion">Western Cape</span>, South Africa
            </span>
            <a href={`tel:${businessInfo.telephone}`} className="hover:text-primary transition-colors" itemProp="telephone">
              {businessInfo.telephoneDisplay}
            </a>
          </address>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Peptide South Africa. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link to="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground/70 mt-4">
            Built in Cape Town 🇿🇦
          </p>
        </div>
      </div>
    </footer>
  );
}

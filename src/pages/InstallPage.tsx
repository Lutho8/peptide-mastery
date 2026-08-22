import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { SEOHead } from '@/components/seo/SEOHead';
import { PWAInstallJourney } from '@/components/landing/PWAInstallJourney';

export default function InstallPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Install the Peptide South Africa Tracker"
        description="Add the Peptide South Africa tracker to your iPhone, iPad, or Android Home Screen in three simple steps."
        canonical="https://peptide-south-africa.co.za/install"
      />
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/92 backdrop-blur-xl">
        <div className="container mx-auto flex min-h-16 items-center justify-between gap-4 px-4">
          <AnimatedLogo size="md" showText />
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-primary hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" /> Back to tracker
          </Link>
        </div>
      </header>
      <main>
        <PWAInstallJourney />
      </main>
    </div>
  );
}

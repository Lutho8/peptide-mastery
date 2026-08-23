import { motion } from 'framer-motion';
import { ArrowRight, BookOpenCheck, Check, Cloud, Rocket, ShieldCheck, ShoppingBag, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PhoneMockup } from './PhoneMockup';
import { FloatingStatCards } from './FloatingStatCards';
import { HeroCategoryBadges } from './HeroCategoryBadges';
import { PeptideCategory } from '@/data/peptides';
import { useAuth } from '@/contexts/AuthContext';
import { captureLead } from '@/lib/crm';

interface HeroSectionProps {
  onCategoryClick?: (category: PeptideCategory) => void;
  onSignInClick?: () => void;
}

const SHOP_URL = 'https://peptide-south-africa.com?utm_source=tracker&utm_medium=hero&utm_campaign=buy_peptides';

const capabilities = [
  'Keep schedules, logs and inventory in one account',
  'Store bloodwork records alongside your tracking history',
  'Review evidence sources with limitations clearly labelled',
];

const trustSignals = [
  { icon: ShieldCheck, label: 'Private account' },
  { icon: Cloud, label: 'Supabase synced' },
  { icon: Smartphone, label: 'Installable web app' },
];

export function HeroSection({ onCategoryClick, onSignInClick }: HeroSectionProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartTracking = () => {
    captureLead({
      email: user?.email ?? null,
      source: 'hero_signup_cta',
      planInterest: 'free',
      activityType: 'course_start',
      activityData: { surface: 'hero', intent: 'open_tracker' },
    });
    if (user) {
      try { localStorage.removeItem('rtd-dashboard-tour-done'); } catch {}
      navigate('/');
    } else {
      onSignInClick?.();
    }
  };

  return (
    <section className="relative overflow-hidden pb-12 pt-8 sm:pb-16 sm:pt-12 lg:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,hsl(var(--accent)/0.12),transparent_34%),radial-gradient(circle_at_85%_30%,hsl(var(--primary)/0.10),transparent_38%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)/0.45))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid items-center gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:gap-12">
          <div className="order-1 text-left">
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary/15 bg-card/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary shadow-sm backdrop-blur sm:text-xs">
              <span className="flex h-5 overflow-hidden rounded-full border border-border" aria-hidden="true">
                <span className="w-1.5 bg-sa-green" />
                <span className="w-1.5 bg-sa-yellow" />
                <span className="w-1.5 bg-sa-red" />
                <span className="w-1.5 bg-primary" />
              </span>
              Built for South African users
            </div>

            <h1 className="mt-5 max-w-3xl text-balance text-[2.55rem] font-bold leading-[1.04] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
              Track every entry.{' '}
              <span className="text-accent">See the full picture.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              One calm dashboard for your confirmed schedules, tracking history, inventory, bloodwork records and research sources—without scattered spreadsheets or notes.
            </p>

            <div className="mt-6 grid gap-2.5 sm:max-w-2xl sm:grid-cols-3">
              {capabilities.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-xl border border-border/70 bg-card/70 p-3 text-xs leading-relaxed text-muted-foreground shadow-sm backdrop-blur">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="mt-7 grid gap-3 sm:flex sm:flex-wrap"
            >
              <Button
                size="lg"
                onClick={handleStartTracking}
                className="min-h-14 w-full gap-2 rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_14px_32px_-18px_hsl(var(--primary)/0.9)] hover:bg-primary/95 sm:w-auto"
              >
                <Rocket className="h-5 w-5" />
                {user ? 'Open My Tracker' : 'Start Tracking Free'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-14 w-full gap-2 rounded-2xl border-accent/40 bg-card/90 px-6 text-base font-semibold text-primary shadow-sm hover:bg-secondary sm:w-auto"
              >
                <a href={SHOP_URL} target="_blank" rel="noopener noreferrer">
                  <ShoppingBag className="h-5 w-5 text-accent" /> Browse the Store
                </a>
              </Button>
            </motion.div>

            <div className="mt-6 flex flex-wrap gap-2">
              {trustSignals.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-accent" /> {label}
                </span>
              ))}
              <button type="button" onClick={() => onCategoryClick?.('longevity')} className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary">
                <BookOpenCheck className="h-3.5 w-3.5 text-accent" /> Browse the research catalog
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: 'easeOut' }}
            className="relative order-2 mx-auto flex w-full max-w-sm items-center justify-center pt-2 lg:max-w-md"
            aria-label="Peptide South Africa tracker preview"
          >
            <div className="absolute inset-x-10 bottom-2 h-24 rounded-full bg-accent/15 blur-3xl" />
            <div className="relative">
              <PhoneMockup />
              <FloatingStatCards />
            </div>
          </motion.div>
        </div>

        <div className="mt-12 border-t border-border/70 pt-7 sm:mt-16">
          <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Explore by research category</p>
          <HeroCategoryBadges onCategoryClick={onCategoryClick} />
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  LayoutDashboard,
  Menu,
  Search as SearchIcon,
  ShoppingBag,
  Smartphone,
  X,
} from 'lucide-react';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';

interface LandingHeaderProps {
  onSignInClick: () => void;
  onSearch?: (query: string) => void;
  onBackToDashboard?: () => void;
}

const SHOP_URL = 'https://peptide-south-africa.com?utm_source=tracker&utm_medium=header&utm_campaign=buy_peptides';

type NavItem = {
  label: string;
  description: string;
  icon: typeof Menu;
  href?: string;
  action?: 'browse' | 'dashboard';
};

export function LandingHeader({ onSignInClick, onSearch, onBackToDashboard }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileMenuOpen]);

  const navItems: NavItem[] = [
    { label: 'Install the tracker', description: 'Add the web app to your phone', icon: Smartphone, href: '/install' },
    { label: 'Bloodwork', description: 'Upload and organize lab reports', icon: Activity, href: '/bloodwork' },
    { label: 'Research library', description: 'Browse evidence and limitations', icon: SearchIcon, action: 'browse' },
    { label: user ? 'Return to tracker' : 'Open dashboard', description: user ? 'Continue tracking' : 'Sign in or create an account', icon: LayoutDashboard, action: 'dashboard' },
  ];

  const handleAction = (item: NavItem) => {
    track('header_nav_click', { label: item.label });
    if (item.action === 'browse') return onSearch?.('');
    if (item.action === 'dashboard') {
      if (user) {
        if (onBackToDashboard) onBackToDashboard();
        else window.location.assign('/');
      } else {
        onSignInClick();
      }
    }
  };

  const closeAndRun = (item: NavItem) => {
    setMobileMenuOpen(false);
    handleAction(item);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300 ${
        scrolled
          ? 'border-primary/20 bg-background/95 shadow-[0_12px_36px_-20px_hsl(var(--primary)/0.5)]'
          : 'border-border/60 bg-background/90'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="h-1 bg-[linear-gradient(90deg,hsl(var(--sa-green))_0_34%,hsl(var(--sa-yellow))_34%_50%,hsl(var(--sa-red))_50%_66%,hsl(var(--primary))_66%_100%)]" aria-hidden="true" />
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-2 px-3 sm:px-4">
        <AnimatedLogo
          size="sm"
          showText
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="mr-auto min-w-0 shrink"
        />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const content = (
              <span className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-foreground/75 transition-colors hover:bg-primary/10 hover:text-primary">
                <Icon className="h-4 w-4" /> {item.label}
              </span>
            );
            return item.href ? (
              <Link key={item.label} to={item.href} onClick={() => track('header_nav_click', { label: item.label })}>{content}</Link>
            ) : (
              <button key={item.label} type="button" onClick={() => handleAction(item)}>{content}</button>
            );
          })}
        </nav>

        {!user && (
          <button type="button" onClick={onSignInClick} className="hidden min-h-11 rounded-xl px-3 text-sm font-semibold text-primary hover:bg-primary/10 sm:inline-flex sm:items-center">
            Sign in
          </button>
        )}

        <a
          href={SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('header_shop_click', { mobile: window.innerWidth < 1024 })}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.8)] transition-transform active:scale-[0.98] sm:px-4"
          aria-label="Shop Peptide South Africa products"
        >
          <ShoppingBag className="h-4 w-4" />
          <span className="sm:hidden">Shop</span>
          <span className="hidden sm:inline">Buy Peptides</span>
          <ArrowRight className="hidden h-4 w-4 sm:block" />
        </a>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-card text-primary shadow-sm transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          {mobileMenuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="absolute inset-x-0 top-full z-40 overflow-y-auto border-t border-primary/15 bg-background/[0.98] px-4 pb-8 pt-5 shadow-2xl backdrop-blur-xl lg:hidden"
          style={{ height: 'calc(100dvh - env(safe-area-inset-top, 0px) - 4.25rem)', paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mx-auto max-w-md">
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Peptide South Africa</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Where would you like to go?</h2>
            </div>

            <nav className="grid gap-2" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const className = 'flex min-h-[4.25rem] w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5';
                const content = (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{item.description}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-accent" />
                  </>
                );
                return item.href ? (
                  <Link key={item.label} to={item.href} className={className} onClick={() => { setMobileMenuOpen(false); track('header_nav_click', { label: item.label, mobile: true }); }}>{content}</Link>
                ) : (
                  <button key={item.label} type="button" onClick={() => closeAndRun(item)} className={className}>{content}</button>
                );
              })}
            </nav>

            <a
              href={SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-base font-semibold text-primary-foreground shadow-lg"
              onClick={() => { setMobileMenuOpen(false); track('header_shop_click', { mobileMenu: true }); }}
            >
              <ShoppingBag className="h-5 w-5" /> Browse the store <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

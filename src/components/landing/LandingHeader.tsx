import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, ShoppingBag, Sparkles, FlaskConical, Activity, Search as SearchIcon, LayoutDashboard, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';

interface LandingHeaderProps {
  onSignInClick: () => void;
  onSearch?: (query: string) => void;
  onBlendsClick?: () => void;
}

const SHOP_URL = 'https://peptide-south-africa.com?utm_source=tracker&utm_medium=header&utm_campaign=buy_peptides';

type NavItem = {
  label: string;
  icon: typeof Sparkles;
  href?: string;
  action?: 'browse' | 'blends' | 'dashboard';
};

export function LandingHeader({ onSignInClick, onSearch, onBlendsClick }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems: NavItem[] = [
    { label: 'Free Course', icon: GraduationCap, href: '/free-course' },
    { label: 'Bloodwork', icon: Activity, href: '/bloodwork' },
    { label: 'Browse Peptides', icon: SearchIcon, action: 'browse' },
    { label: 'Blends & Stacks', icon: FlaskConical, action: 'blends' },
    { label: 'Dashboard', icon: LayoutDashboard, action: 'dashboard' },
  ];

  const handleAction = (item: NavItem) => {
    track('header_nav_click', { label: item.label });
    if (item.action === 'browse') return onSearch?.('');
    if (item.action === 'blends') return onBlendsClick?.();
    if (item.action === 'dashboard') {
      if (user) {
        window.location.assign('/');
      } else {
        onSignInClick();
      }
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 backdrop-blur-xl ${
        scrolled
          ? 'border-primary/20 bg-background/85 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)]'
          : 'border-border/40 bg-background/70'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <AnimatedLogo size="md" showText={true} onClick={scrollToTop} />

          {/* Desktop nav — dark brand pills */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.label;
              const content = (
                <span
                  className="relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold tracking-tight text-foreground/80 hover:text-primary transition-colors"
                  onMouseEnter={() => setActive(item.label)}
                  onMouseLeave={() => setActive(null)}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-primary/10 ring-1 ring-primary/30 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.6)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative w-3.5 h-3.5" />
                  <span className="relative">{item.label}</span>
                </span>
              );
              return item.href ? (
                <Link key={item.label} to={item.href} onClick={() => track('header_nav_click', { label: item.label })}>
                  {content}
                </Link>
              ) : (
                <button key={item.label} onClick={() => handleAction(item)} className="touch-target">
                  {content}
                </button>
              );
            })}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            {!user && (
              <Button
                onClick={onSignInClick}
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex text-foreground/80 hover:text-primary"
              >
                Sign in
              </Button>
            )}
            <a href={SHOP_URL} onClick={() => track('header_shop_click', {})}>
              <Button
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-95 shadow-[0_6px_20px_-6px_hsl(var(--primary)/0.55)]"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <Sparkles className="w-3 h-3 opacity-80" />
                Buy Peptides →
              </Button>
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-foreground/80 hover:text-primary touch-target"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-primary/15">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const className =
                  'flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-foreground/90 hover:text-primary hover:bg-primary/10 ring-0 hover:ring-1 hover:ring-primary/25 rounded-lg transition-all touch-target';
                return item.href ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={className}
                    onClick={() => { setMobileMenuOpen(false); track('header_nav_click', { label: item.label, mobile: true }); }}
                  >
                    <Icon className="w-4 h-4" /> {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    onClick={() => { setMobileMenuOpen(false); handleAction(item); }}
                    className={`${className} text-left`}
                  >
                    <Icon className="w-4 h-4" /> {item.label}
                  </button>
                );
              })}
              <a
                href={SHOP_URL}
                className="mt-2 px-3 py-2.5 text-sm rounded-lg flex items-center gap-2 justify-center bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingBag className="w-4 h-4" />
                Buy Peptides →
              </a>
              {!user && (
                <button
                  onClick={() => { setMobileMenuOpen(false); onSignInClick(); }}
                  className="mt-2 px-3 py-2.5 text-sm font-semibold text-left text-foreground border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  Sign in
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

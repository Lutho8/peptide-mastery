import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, ShoppingBag, Target, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { SupportSheet } from '@/components/support/SupportSheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppHeaderProps {
  onLogoClick: () => void;
  onSettingsClick: () => void;
  onSignOut: () => void;
  userName: string;
  userEmail?: string | null;
}

const SHOP_HREF =
  'https://peptide-south-africa.com/?utm_source=psa_app&utm_medium=header&utm_campaign=shop_nav';

const GOAL_LINKS: Array<{ label: string; to: string }> = [
  { label: 'Weight Loss', to: '/weight-loss-peptides-south-africa' },
  { label: 'Healing', to: '/healing-peptides-south-africa' },
  { label: 'Anti-Aging', to: '/anti-aging-peptides-south-africa' },
  { label: 'Cognitive', to: '/cognitive-peptides-south-africa' },
  { label: 'Growth Hormone', to: '/growth-hormone-peptides-south-africa' },
  { label: 'Libido (PT-141)', to: '/libido-peptides-south-africa' },
  { label: "Women's Health", to: "/peptides-for-women-south-africa" },
  { label: "Diabetes & Fatty Liver", to: "/peptides-diabetes-fatty-liver" },
];

export function AppHeader({ onLogoClick, onSettingsClick, onSignOut, userName, userEmail }: AppHeaderProps) {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <>
      <header
        className="fixed z-50 left-0 right-0 top-0 border-b border-border bg-background/95 backdrop-blur-xl"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-3">
        <div className="shrink-0 rounded-xl border border-border bg-card px-2.5 py-2 shadow-sm transition-all hover:border-accent/40">
          <AnimatedLogo size="sm" showText={true} onClick={onLogoClick} className="hidden sm:flex" />
          <AnimatedLogo size="sm" showText={false} onClick={onLogoClick} className="sm:hidden" />
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Research by goal"
                className="hidden md:flex items-center gap-1.5 min-h-11 px-3 rounded-xl bg-card border border-border shadow-sm hover:border-accent/50 transition-all active:scale-[0.97]"
              >
                <Target size={18} className="text-primary" />
                <span className="text-sm font-semibold">Research by Goal</span>
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur border border-border">
              <DropdownMenuLabel>Browse by research goal</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {GOAL_LINKS.map((g) => (
                <DropdownMenuItem key={g.to} asChild>
                  <Link to={g.to} className="cursor-pointer">
                    {g.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/bpc-157-vs-tb-500" className="cursor-pointer">
                  BPC-157 vs TB-500
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Research Guides</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/peptide-storage-reconstitution-guide" className="cursor-pointer">
                  Storage & Reconstitution
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/bpc-157-dosage-guide-south-africa" className="cursor-pointer">
                  BPC-157 Dosage Guide
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <a
            href={SHOP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Shop peptides"
            className="flex items-center gap-1.5 min-h-11 px-2.5 sm:px-3 rounded-xl bg-card border border-border shadow-sm hover:border-accent/50 transition-all active:scale-[0.97]"
          >
            <ShoppingBag size={18} className="text-primary" />
            <span className="text-sm font-semibold hidden sm:inline">Shop</span>
          </a>
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            aria-label="Open support menu"
            className="hidden sm:flex items-center justify-center min-h-11 min-w-11 rounded-xl bg-card border border-border shadow-sm hover:border-accent/50 transition-all active:scale-[0.97]"
          >
            <LifeBuoy size={20} className="text-primary" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open account menu"
                data-tour="profile-avatar"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition-all hover:border-accent/50 active:scale-[0.97]"
              >
                <User size={19} className="text-primary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-card/95 backdrop-blur border-border">
              <div className="px-2 py-2">
                <p className="text-sm font-semibold truncate">{userName}</p>
                {userEmail && <p className="text-xs text-muted-foreground truncate">{userEmail}</p>}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSettingsClick} className="min-h-11 cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSupportOpen(true)} className="min-h-11 cursor-pointer sm:hidden">
                <LifeBuoy className="mr-2 h-4 w-4" /> Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="min-h-11 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>
      </header>

      <SupportSheet open={supportOpen} onOpenChange={setSupportOpen} />
    </>
  );
}

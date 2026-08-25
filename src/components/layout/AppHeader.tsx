import { useState } from 'react';
import { LifeBuoy, ShoppingBag, User, Settings, LogOut } from 'lucide-react';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { SupportSheet } from '@/components/support/SupportSheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
          <a
            href={SHOP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Shop peptides"
            className="flex items-center gap-1.5 min-h-11 px-2.5 sm:px-3 rounded-xl bg-card border border-border shadow-sm hover:border-accent/50 transition-all active:scale-[0.97]"
          >
            <ShoppingBag size={18} className="text-primary" />
            <span className="text-sm font-semibold hidden sm:inline">Research Store</span>
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

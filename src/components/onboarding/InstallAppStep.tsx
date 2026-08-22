import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Apple, PlayCircle, Share2, Plus, MoreVertical, Download, Sparkles, X, Smartphone,
  CheckCircle2, AlertCircle, Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { detectPlatform, isStandalone, getInstallCtaState, chromeIntentUrl, type Platform } from '@/lib/pwaInstall';
import { track } from '@/lib/analytics';
import { markStep } from '@/lib/onboardingProgress';
import { OfflineReadyBadge } from '@/components/pwa/OfflineReadyBadge';

const PENDING_KEY = 'rtd-install-prompt-pending';

export function markInstallPromptPending() { try { localStorage.setItem(PENDING_KEY, '1'); } catch {} }
export function isInstallPromptPending(): boolean { try { return localStorage.getItem(PENDING_KEY) === '1'; } catch { return false; } }
export function clearInstallPromptPending() { try { localStorage.removeItem(PENDING_KEY); } catch {} }

type TabKey = 'ios' | 'android';

interface Props { open: boolean; onClose: () => void }

export function InstallAppStep({ open, onClose }: Props) {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [tab, setTab] = useState<TabKey>('ios');
  const [iosConfirmed, setIosConfirmed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const p = detectPlatform();
    setPlatform(p);
    setTab(p.startsWith('android') ? 'android' : 'ios');
    track('install_modal_opened', {});
    track('install_platform_detected', { platform: p, isInstallable, isStandalone: isStandalone(), surface: 'modal' });
    markStep('install_viewed');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const cta = useMemo(
    () => getInstallCtaState({ isInstallable, isInstalled, platform }),
    [isInstallable, isInstalled, platform]
  );

  const skip = () => {
    track('install_modal_skipped', { platform });
    clearInstallPromptPending();
    onClose();
  };

  const steps = useMemo(() => (
    tab === 'ios'
      ? [
          <>Open this site in <span className="font-medium">Safari</span> (not Chrome or in-app browser)</>,
          <>Tap the <span className="font-medium">Share</span> button <Share2 className="inline w-4 h-4 -mt-0.5" /></>,
          <>Scroll and tap <span className="font-medium">"Add to Home Screen"</span> <Plus className="inline w-4 h-4 -mt-0.5" /></>,
          <>Tap <span className="font-medium">"Add"</span> in the top-right to confirm</>,
        ]
      : [
          <>Open this site in <span className="font-medium">Chrome</span></>,
          <>Tap the <MoreVertical className="inline w-4 h-4 -mt-0.5" /> <span className="font-medium">menu</span> (top-right)</>,
          <>Tap <span className="font-medium">"Install app"</span> (or "Add to Home screen")</>,
          <>Tap <span className="font-medium">"Install"</span> to confirm</>,
        ]
  ), [tab]);

  const switchTab = (next: TabKey) => {
    if (next === tab) return;
    track('install_tab_switched', { from: tab, to: next, surface: 'modal' });
    setTab(next);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ duration: 0.3 }}
            className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-6 md:p-8 my-auto">
            <button onClick={skip} className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted touch-target" aria-label="Close">
              <X size={18} className="text-muted-foreground" />
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                <Smartphone className="w-3.5 h-3.5" />
                One more step
              </div>
              <OfflineReadyBadge compact />
            </div>

            <h3 className="mt-3 text-2xl md:text-3xl font-bold text-foreground">Install Peptide South Africa on your phone</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add the tracker to your Home Screen for quick, full-screen access. Your account and synced data stay the same.
            </p>

            {cta.kind === 'installed' && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-300">
                <CheckCircle2 className="w-4 h-4" /> Already installed — you're all set.
              </div>
            )}

            {platform === 'ios-non-safari' && (
              <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground">Add to Home Screen only works in Safari on iOS.</p>
                  <Button size="sm" variant="outline" className="mt-2 gap-1.5" onClick={async () => {
                    try { await navigator.clipboard.writeText('https://peptide-south-africa.co.za'); track('install_link_copied', { surface: 'modal' }); } catch {}
                  }}>
                    <Copy className="w-3.5 h-3.5" /> Copy link
                  </Button>
                </div>
              </div>
            )}
            {platform === 'android-other' && (
              <a href={chromeIntentUrl()} className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                Open in Chrome for best install →
              </a>
            )}

            <div className="mt-5 flex items-center gap-2">
              {(['ios', 'android'] as TabKey[]).map((p) => {
                const active = tab === p;
                const Icon = p === 'ios' ? Apple : PlayCircle;
                return (
                  <button key={p} onClick={() => switchTab(p)}
                    className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors touch-target ${active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    {active && <motion.span layoutId="install-step-tab" className="absolute inset-0 rounded-full bg-background border border-primary/40" />}
                    <Icon className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">{p === 'ios' ? 'iOS' : 'Android'}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.ol key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }} className="mt-5 space-y-3">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                    <p className="pt-1 text-sm text-foreground/90">{s}</p>
                  </li>
                ))}
              </motion.ol>
            </AnimatePresence>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-2">
              {cta.kind === 'native-prompt' && (
                <Button onClick={async () => { await install('modal'); }} className="btn-sparkle w-full sm:w-auto gap-2">
                  <Sparkles className="w-4 h-4" /> Install Now
                </Button>
              )}
              {tab === 'ios' && cta.kind !== 'installed' && (
                iosConfirmed ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-emerald-300"><CheckCircle2 className="w-4 h-4" /> Marked as added</span>
                ) : (
                  <Button variant="outline" className="w-full sm:w-auto gap-2" onClick={() => {
                    setIosConfirmed(true);
                    track('install_self_reported', { surface: 'modal' });
                    markStep('install_attempted', { meta: { self: true } });
                  }}>
                    <CheckCircle2 className="w-4 h-4" /> I've added it
                  </Button>
                )
              )}
              <Button variant="ghost" onClick={skip} className="w-full sm:w-auto text-muted-foreground">
                {cta.kind === 'installed' ? 'Continue to dashboard' : 'Skip for now'}
                <Download className="w-3.5 h-3.5 ml-1.5 opacity-0 sm:opacity-100" />
              </Button>
            </div>

            <a href="/install" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">
              Open the visual install guide →
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallBanner() {
  const { isInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed left-4 right-4 z-40 max-w-lg mx-auto"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
      >
        <div className="glass-card rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-xl border border-primary/20">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Smartphone size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install Peptide South Africa</p>
            <p className="hidden text-xs text-muted-foreground sm:block">Add to home screen for the best experience</p>
          </div>
          <Button
            size="sm"
            onClick={() => install('install_banner')}
            className="shrink-0 gap-1.5 rounded-full touch-target"
          >
            <Download size={14} />
            Install
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors touch-target"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

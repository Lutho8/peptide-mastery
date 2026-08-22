import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { captureLead } from '@/lib/crm';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export function LiveQnAPopup() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (sessionStorage.getItem('qna-popup-dismissed')) {
      setDismissed(true);
      return;
    }

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    let hasScrolled = false;

    const handleScroll = () => {
      if (hasScrolled) return;
      hasScrolled = true;
      scrollTimeout = setTimeout(() => {
        setVisible(true);
      }, 15000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true, once: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem('qna-popup-dismissed', 'true');
  };

  const handleReserve = () => {
    captureLead({
      email: user?.email ?? null,
      source: 'qna_popup_reserve',
      planInterest: 'free',
      activityType: 'qa_signup',
      activityData: { surface: 'live_qna_popup' },
    });
    dismiss();
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-3 left-3 right-3 z-40 md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
          style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="relative rounded-xl border border-accent/40 bg-card/95 backdrop-blur-md shadow-2xl p-4 md:p-5">
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">
                  Monthly Live Q&A
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Free · First Saturday · On Zoom
                </p>
              </div>
            </div>
            <p className="hidden text-sm text-muted-foreground mb-4 sm:block">
              A monthly educational Zoom session for research questions, product handling, and help using the tracker. Individual medical advice is not provided.
            </p>
            <div className="flex gap-2 pr-8 sm:pr-0">
              <Link to="/live-qna" className="flex-1">
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-95"
                  onClick={handleReserve}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Reserve my seat
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                Not Now
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

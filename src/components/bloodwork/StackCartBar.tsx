import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, ArrowRight } from 'lucide-react';
import { useStackCart } from './StackCartContext';
import { captureLead } from '@/lib/crm';
import { useAuth } from '@/contexts/AuthContext';
import { buildStackLink } from '@/lib/bloodwork/stackLink';
import { trackBwEvent } from '@/lib/bloodwork/analytics';

interface Props {
  patternIds?: string[];
}

export function StackCartBar({ patternIds = [] }: Props) {
  const { items, clear, toggle } = useStackCart();
  const { user } = useAuth();

  const handleBuy = () => {
    const url = buildStackLink(items.map((i) => ({ slug: i.slug, name: i.name })), {
      patternIds,
    });
    trackBwEvent('bw_stack_built', { peptides: items.map((i) => i.slug), patterns: patternIds });
    trackBwEvent('bw_checkout_clicked', { peptides: items.map((i) => i.slug), patterns: patternIds });
    void captureLead({
      email: user?.email,
      source: 'bloodwork_stack_buy',
      planInterest: 'premium',
      activityType: 'premium_click',
      activityData: { peptides: items.map((i) => i.slug), patterns: patternIds },
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="fixed left-1/2 -translate-x-1/2 z-30 w-[min(720px,calc(100vw-1.5rem))]"
          style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
          id="bloodwork-stack-cart"
        >
          <div className="rounded-2xl border border-primary/40 bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/10 p-3">
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
              <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary shrink-0 sm:inline-flex">
                <ShoppingBag size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Research list · {items.length} item{items.length === 1 ? '' : 's'}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {items.slice(0, 4).map((i) => (
                    <button
                      key={i.slug}
                      type="button"
                      onClick={() => toggle(i)}
                      className="group inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                    >
                      {i.name}
                      <X size={10} className="opacity-60 group-hover:opacity-100" />
                    </button>
                  ))}
                  {items.length > 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-muted-foreground">+{items.length - 4} more</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={clear}
                className="min-h-11 px-2 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground shrink-0"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleBuy}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
              >
                View products <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

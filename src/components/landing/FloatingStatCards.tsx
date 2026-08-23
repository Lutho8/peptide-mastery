import { motion } from 'framer-motion';
import { BookOpenCheck, CheckCircle2, LockKeyhole, Smartphone } from 'lucide-react';

/**
 * Glassmorphism cards floating around the phone mockup.
 * Each card uses subtle infinite float + on-load stagger.
 */
const float = {
  animate: {
    y: [0, -8, 0],
  },
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut',
  },
} as const;

function GlassCard({
  children,
  className = '',
  delay = 0,
  floatDelay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  floatDelay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={`absolute z-20 ${className}`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: floatDelay }}
        className="rounded-2xl border border-border/40 bg-card/70 p-3 shadow-2xl backdrop-blur-xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function FloatingStatCards() {
  return (
    <>
      {/* Sync status — top left */}
      <GlassCard delay={0.8} floatDelay={0} className="-left-4 top-10 sm:-left-12 sm:top-16">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
            <CheckCircle2 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-muted-foreground">Account</div>
            <div className="text-sm font-bold text-foreground">Synced</div>
          </div>
        </div>
      </GlassCard>

      {/* Privacy — middle right */}
      <GlassCard delay={1.0} floatDelay={1} className="-right-6 top-32 sm:-right-16 sm:top-40">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
            <LockKeyhole className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-muted-foreground">Your data</div>
            <div className="text-sm font-bold text-foreground">Private</div>
          </div>
        </div>
      </GlassCard>

      {/* Research — bottom left */}
      <GlassCard delay={1.2} floatDelay={2} className="-left-2 bottom-24 sm:-left-10 sm:bottom-32">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
            <BookOpenCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-muted-foreground">Evidence</div>
            <div className="text-sm font-bold text-foreground">Source linked</div>
          </div>
        </div>
      </GlassCard>

      {/* Installable — bottom center */}
      <GlassCard
        delay={1.4}
        floatDelay={1.5}
        className="-bottom-4 left-1/2 -translate-x-1/2 sm:-bottom-6"
      >
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-accent" />
          <div className="whitespace-nowrap text-xs font-semibold text-foreground">Install on your phone</div>
        </div>
      </GlassCard>
    </>
  );
}

import { motion } from 'framer-motion';
import { Activity, Check, Droplet, Pill, TrendingUp } from 'lucide-react';

/**
 * iPhone-style device frame with a stylized Peptide South Africa dashboard inside.
 * Pure SVG/HTML — no external image, no network cost.
 */
export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[230px] sm:w-[270px] md:w-[290px]">
      {/* Phone frame */}
      <div className="relative aspect-[9/19] rounded-[2.5rem] bg-foreground/90 p-3 shadow-2xl ring-1 ring-foreground/10">
        {/* Side buttons */}
        <div className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l bg-foreground/70" />
        <div className="absolute -left-[3px] top-40 h-16 w-[3px] rounded-l bg-foreground/70" />
        <div className="absolute -right-[3px] top-32 h-20 w-[3px] rounded-r bg-foreground/70" />

        {/* Screen */}
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-background via-background to-primary/5">
          {/* Notch */}
          <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-foreground/90" />

          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-2 text-[9px] font-semibold text-foreground/70">
            <span>9:41</span>
            <span className="opacity-0">.</span>
          </div>

          {/* Header */}
          <div className="px-4 pt-4">
            <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Peptide South Africa
            </div>
            <div className="mt-1 text-sm font-bold text-foreground">Today's tracker</div>
          </div>

          {/* Adherence ring card */}
          <div className="mx-3 mt-3 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 p-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12">
                <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="hsl(var(--accent))"
                    strokeWidth="3"
                    strokeDasharray="94.2"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                  3/3
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-foreground">Entries complete</div>
                <div className="text-[8px] text-muted-foreground">Account synced</div>
              </div>
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
          </div>

          {/* Today's doses */}
          <div className="mx-3 mt-3 space-y-2">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              Today
            </div>
            {[
              { name: 'Morning entry', status: 'Logged', time: '08:00', color: 'bg-primary' },
              { name: 'Midday entry', status: 'Due', time: '12:00', color: 'bg-accent' },
              { name: 'Evening entry', status: 'Scheduled', time: '22:00', color: 'bg-primary/70' },
            ].map((d) => (
              <div
                key={d.name}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/80 p-2 backdrop-blur"
              >
                <div className={`h-7 w-7 rounded-lg ${d.color} flex items-center justify-center`}>
                  <Pill className="h-3 w-3 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-semibold text-foreground">{d.name}</div>
                  <div className="flex items-center gap-1 text-[8px] text-muted-foreground"><Check className="h-2.5 w-2.5 text-accent" /> {d.status}</div>
                </div>
                <div className="text-[9px] font-medium text-muted-foreground">{d.time}</div>
              </div>
            ))}
          </div>

          {/* Bottom nav */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-around rounded-2xl border border-border/50 bg-card/90 py-2 backdrop-blur">
            <Activity className="h-4 w-4 text-accent" />
            <Pill className="h-4 w-4 text-muted-foreground" />
            <Droplet className="h-4 w-4 text-muted-foreground" />
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-1 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-foreground/40" />
        </div>
      </div>

      {/* Reflection / glow */}
      <div className="absolute -inset-4 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-2xl" />
    </div>
  );
}

import { motion } from 'framer-motion';
import {
  FlaskConical,
  Calculator,
  Layers,
  ShieldCheck,
  ClipboardList,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: FlaskConical,
    title: 'Research database',
    desc: '98+ peptide profiles with mechanisms, half-lives, and citations.',
  },
  {
    icon: Calculator,
    title: 'Measurement tool',
    desc: 'User-entered mg or mcg conversions with U-40/U-100 barrel markers.',
  },
  {
    icon: Layers,
    title: 'Recorded workspace',
    desc: 'Keep compounds, blends, amounts and schedules from an existing plan in one place.',
  },
  {
    icon: ShieldCheck,
    title: 'COA verification',
    desc: 'Look up lab certificates of analysis by batch number.',
  },
  {
    icon: ClipboardList,
    title: 'Routine tracking',
    desc: 'Record entries, set reminders and review your own history — no credit card.',
  },
  {
    icon: Activity,
    title: 'Progress records',
    desc: 'Compare your logged periods, body records and uploaded bloodwork over time.',
  },
];

interface Props {
  onPrimaryClick?: () => void;
}

export function WhyFreeBand({ onPrimaryClick }: Props) {
  return (
    <section className="relative py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            Free Forever
          </div>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Everything you need.{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              No paywall.
            </span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Practical tracking, measurement and source-led research tools—without automatically choosing a compound, amount or schedule.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur transition-colors hover:border-accent/40 hover:bg-card"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15">
                <f.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            size="lg"
            onClick={onPrimaryClick}
            className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:opacity-90"
          >
            Start free
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

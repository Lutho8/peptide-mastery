import { motion } from 'framer-motion';
import { Globe2, Heart, MapPin, Link2 } from 'lucide-react';

const POINTS = [
  { icon: Globe2, title: 'Open analysis', body: 'No black-box scoring — every signal is shown.' },
  { icon: Heart, title: 'Free for members', body: 'No paywall, no premium tier, ever.' },
  { icon: MapPin, title: 'Cape Town built', body: 'Researched & maintained in South Africa 🇿🇦.' },
  { icon: Link2, title: 'Ecosystem-integrated', body: 'One-tap stack handoff to the Peptide South Africa shop & Club.' },
];

export function WhyRTDStrip() {
  return (
    <section aria-label="Why Peptide South Africa" className="mt-10">
      <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-3">Why Peptide South Africa</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {POINTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="rounded-xl border border-border/40 bg-background/60 p-3"
              >
                <Icon size={16} className="text-primary mb-2" />
                <p className="text-xs font-semibold text-foreground">{p.title}</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{p.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

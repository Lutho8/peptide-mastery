import { motion } from 'framer-motion';
import { Upload, Activity, Stethoscope } from 'lucide-react';

const STEPS = [
  { num: '01', title: 'Upload your bloodwork', icon: Upload, body: 'PDF or image, English or German. Encrypted in transit and at rest.' },
  { num: '02', title: 'Review extracted values', icon: Activity, body: 'Compare every extracted value, unit and range against the original laboratory report.' },
  { num: '03', title: 'Discuss with a clinician', icon: Stethoscope, body: 'Take the organized report to a qualified professional for interpretation and treatment decisions.' },
];

export function BloodworkHero() {
  return (
    <section className="border-b border-border/50 py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-5xl font-bold tracking-tight text-foreground"
        >
          From bloodwork to <span className="text-primary">clearer questions</span>.
        </motion.h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl">
          A bilingual educational extraction that keeps your laboratory’s values, units and reference ranges visible. No automated diagnosis, prescription or peptide stack.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-[11px] tracking-widest text-muted-foreground">{s.num}</span>
                <s.icon size={16} className="text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

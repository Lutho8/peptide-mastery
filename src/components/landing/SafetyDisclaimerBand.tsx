import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown } from 'lucide-react';

const POINTS = [
  'The catalogue contains educational source material and does not determine whether a product is suitable for a person.',
  'The app does not diagnose, prescribe, choose a product, generate a dosage, interpret urgency or promise an outcome.',
  'Only enter schedule, product and monitoring details that come from your own confirmed plan or research record.',
  'Route patient-specific questions, symptoms, treatment choices and monitoring decisions to a qualified healthcare professional.',
  'Product status and permitted use vary by product and location; catalogue inclusion is not a suitability or approval claim.',
];

export function SafetyDisclaimerBand() {
  const [open, setOpen] = useState(false);

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto rounded-2xl border border-yellow-500/30 bg-yellow-500/[0.07] backdrop-blur-sm overflow-hidden"
        >
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-start md:items-center gap-4 p-5 md:p-6 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-bold text-yellow-100">
                Educational platform — not medical advice
              </h3>
              <p className="text-xs md:text-sm text-yellow-200/80 mt-1">
                Clear boundaries between research information, record-keeping and patient-specific care.
              </p>
            </div>
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="shrink-0 self-center"
            >
              <ChevronDown className="w-5 h-5 text-yellow-400" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-5 md:px-6 pb-6 pt-0">
                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent mb-5" />
                  <ul className="space-y-3">
                    {POINTS.map((p, i) => (
                      <li key={i} className="flex gap-3 text-sm text-yellow-100/85 leading-relaxed">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

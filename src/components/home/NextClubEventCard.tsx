import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';

const EVENT_URL =
  'https://capetownpeptideclub.co.za?utm_source=tracker&utm_medium=dashboard&utm_campaign=club_event';

export function NextClubEventCard() {
  return (
    <motion.a
      href={EVENT_URL}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="block rounded-xl bg-card border border-border p-4 shadow-md"
      style={{ borderLeft: '3px solid #0ea5e9' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0ea5e9]/15">
          <Calendar size={18} className="text-[#0ea5e9]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Next Peptide South Africa Workshop</h3>
          <p className="mt-0.5 text-xs text-muted-foreground whitespace-pre-line">
            November 2025 · Cape Town{'\n'}Milnerton / Blouberg
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#0ea5e9]">
            Reserve Your Seat <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </motion.a>
  );
}

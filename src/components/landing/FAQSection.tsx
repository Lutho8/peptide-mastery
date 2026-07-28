import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Shield, FlaskConical, Wrench, Info, CreditCard, Syringe } from 'lucide-react';

export const faqCategories = [
  {
    id: 'general',
    title: 'General',
    icon: HelpCircle,
    faqs: [
      {
        q: 'What are peptides?',
        a: 'Peptides are short chains of amino acids (typically 2–50) linked by peptide bonds. They act as signaling molecules in the body, influencing processes like growth, metabolism, immune response, and tissue repair. Unlike larger proteins, their smaller size allows them to be absorbed more efficiently.',
      },
      {
        q: "What's the difference between peptides and proteins?",
        a: 'The main difference is size. Peptides generally contain fewer than 50 amino acids, while proteins are larger and more complex. Peptides tend to have more targeted, specific functions, while proteins serve broader structural and enzymatic roles in the body.',
      },
      {
        q: 'How do peptides work in the body?',
        a: 'Peptides bind to specific receptors on cell surfaces, triggering biological responses. For example, growth hormone-releasing peptides stimulate the pituitary gland, while BPC-157 promotes angiogenesis and tissue repair. Each peptide has a unique mechanism of action based on its amino acid sequence.',
      },
      {
        q: 'Are peptides the same as steroids?',
        a: 'No. Steroids are synthetic versions of hormones like testosterone, while peptides are chains of amino acids that signal the body to produce its own hormones or trigger specific biological processes. Peptides generally work with the body\'s natural systems rather than replacing them.',
      },
      {
        q: 'Are peptides legal?',
        a: 'Many peptides are legal to purchase for research purposes. Some peptides, like certain GLP-1 agonists (semaglutide, tirzepatide), are FDA-approved medications available by prescription. Regulations vary by country, and most non-approved peptides are sold labeled "for research use only."',
      },
    ],
  },
  {
    id: 'dosing-adherence',
    title: 'Dosing & Adherence',
    icon: Syringe,
    faqs: [
      {
        q: 'How do I know the right starting dose?',
        a: 'Start at the lowest researched dose for the specific peptide and titrate up only if needed. Each peptide profile in Peptide South Africa lists a conservative starting range based on published literature. Body weight, goals, and prior experience all matter — when in doubt, start lower than you think and consult a qualified healthcare professional.',
      },
      {
        q: 'mg, IU, and U-40 units — what is the difference?',
        a: 'mg (milligrams) measures mass. IU (international units) is a standardized activity unit used for some peptides like HCG and HGH. U-40/U-100 refers to insulin syringe markings — U-100 means 100 units = 1 mL. The Reconstitution Calculator converts your vial size and bacteriostatic water volume into the exact insulin-syringe units to draw. Peptide South Africa never uses mcg.',
      },
      {
        q: 'What if I miss a dose?',
        a: 'For most short half-life peptides (BPC-157, TB-500, GHRPs), take the missed dose as soon as you remember if it is the same day, otherwise skip and resume the next scheduled dose. Never double up. For long half-life compounds (semaglutide, tirzepatide), consult the prescribing guidance — doubling can cause significant side effects.',
      },
      {
        q: 'How strict do I need to be with timing?',
        a: 'GH-releasing peptides (CJC-1295, Ipamorelin, GHRP-6) are best dosed on an empty stomach (≥2 hours after food, ≥30 min before food) to avoid blunting the GH pulse. Most healing and metabolic peptides are more forgiving — consistency over weeks matters more than perfect timing on a single day.',
      },
      {
        q: 'Can I stack peptides safely?',
        a: 'Some peptides are synergistic (CJC-1295 + Ipamorelin), some are compatible (BPC-157 + TB-500), and some require caution or should be avoided together. Use the Stacking Matrix in Peptide South Africa before combining compounds, and never introduce more than one new peptide at a time so you can attribute any effects.',
      },
      {
        q: 'When should I cycle off?',
        a: 'Most growth-hormone secretagogues are cycled 8–12 weeks on, 4 weeks off, to preserve receptor sensitivity. Healing peptides like BPC-157 are typically used until the issue resolves. Cycle length depends on the compound, your goal, and bloodwork — Peptide South Africa cycle templates default to research-backed durations and warn you when a cycle is overdue.',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Safety',
    icon: Shield,
    faqs: [
      {
        q: 'Are peptides safe?',
        a: 'FDA-approved peptides have undergone rigorous clinical trials and are considered safe when used as directed. Research peptides have varying levels of evidence. Safety depends on the specific peptide, dosage, purity, and individual health factors. Always consult a healthcare professional before use.',
      },
      {
        q: "What does 'research chemical' mean for peptides?",
        a: 'A "research chemical" designation means the peptide has not been FDA-approved for human use. It is sold for laboratory and scientific research purposes only. This does not necessarily mean it is unsafe, but it indicates insufficient clinical data for regulatory approval.',
      },
      {
        q: 'How are peptides typically administered?',
        a: 'Most research peptides are administered via subcutaneous injection using insulin syringes. Some peptides are available as oral capsules, nasal sprays, or topical creams. The administration route depends on the peptide\'s bioavailability and intended mechanism of action.',
      },
      {
        q: 'Why are some peptides FDA approved and others not?',
        a: 'FDA approval requires extensive Phase I–III clinical trials demonstrating safety, efficacy, and manufacturing quality. This process takes years and costs hundreds of millions of dollars. Many peptides show promise in preclinical research but lack the commercial investment needed for full FDA approval.',
      },
      {
        q: 'What are common side effects of peptides?',
        a: 'Common side effects vary by peptide but may include injection site reactions (redness, swelling), water retention, increased hunger or decreased appetite, headaches, and fatigue. GH-releasing peptides may cause tingling or numbness. Serious side effects are rare but possible with improper dosing.',
      },
      {
        q: 'When should I consult a doctor or endocrinologist?',
        a: 'Always speak with a qualified healthcare professional before starting any peptide protocol — and especially before using GH-releasing compounds, GLP-1 agonists, or anything affecting hormones if you have a history of cancer, diabetes, thyroid disease, cardiovascular disease, or are on prescription medication. An endocrinologist is the right specialist for HPA-axis or growth-hormone-related questions.',
      },
      {
        q: 'What bloodwork should I run before and during a cycle?',
        a: 'Baseline at minimum: full blood count, comprehensive metabolic panel, lipid panel, HbA1c, fasting glucose & insulin, IGF-1 (for GH peptides), TSH, free T3/T4, total & free testosterone, estradiol, and inflammatory markers (hs-CRP). Retest 8–12 weeks into a cycle and again 4 weeks after stopping. The Bloodwork tracker in Peptide South Africa flags out-of-range markers automatically.',
      },
      {
        q: 'Red-flag symptoms — when do I stop immediately?',
        a: 'Stop immediately and seek medical attention for: severe or persistent headaches, vision changes, chest pain, shortness of breath, signs of an allergic reaction (rash, swelling, difficulty breathing), uncontrolled blood pressure spikes, severe injection-site infection, or any symptom that feels seriously out of the ordinary. Do not "push through" — peptides are research compounds, not prescription medication.',
      },
    ],
  },
  {
    id: 'peptide-types',
    title: 'Peptide Types',
    icon: FlaskConical,
    faqs: [
      {
        q: 'What are Growth Hormone Secretagogues?',
        a: 'Growth Hormone Secretagogues (GHS) are peptides that stimulate the pituitary gland to release growth hormone. Examples include CJC-1295, Ipamorelin, GHRP-6, and MK-677. They are researched for anti-aging, muscle growth, fat loss, and improved recovery.',
      },
      {
        q: 'What are healing peptides?',
        a: 'Healing peptides like BPC-157, TB-500, and GHK-Cu promote tissue repair, reduce inflammation, and accelerate recovery. BPC-157, derived from a gastric protein, is researched for gut healing, tendon repair, and neuroprotection. TB-500 promotes cell migration and new blood vessel formation.',
      },
      {
        q: 'What are cognitive or nootropic peptides?',
        a: 'Cognitive peptides like Semax, Selank, and Dihexa are researched for their effects on brain function. They may enhance memory, focus, neuroplasticity, and neuroprotection. Semax and Selank have been used clinically in Russia for cognitive and anxiety-related conditions.',
      },
      {
        q: 'What are GLP-1 peptides?',
        a: 'GLP-1 (Glucagon-Like Peptide-1) receptor agonists like semaglutide and tirzepatide mimic the incretin hormone GLP-1. They regulate blood sugar, slow gastric emptying, and reduce appetite. Several are FDA-approved for type 2 diabetes and weight management.',
      },
      {
        q: 'What are cosmetic peptides?',
        a: 'Cosmetic peptides like GHK-Cu, Matrixyl, and Argireline are used in skincare for anti-aging benefits. They stimulate collagen production, improve skin elasticity, reduce wrinkles, and promote wound healing. GHK-Cu is also researched for hair regrowth.',
      },
    ],
  },
  {
    id: 'practical',
    title: 'Practical',
    icon: Wrench,
    faqs: [
      {
        q: 'How should peptides be stored?',
        a: 'Lyophilized (freeze-dried) peptides should be stored in a cool, dry place, ideally refrigerated at 2–8°C. Once reconstituted with bacteriostatic water, they must be refrigerated and typically used within 4–6 weeks. Avoid repeated freeze-thaw cycles and direct sunlight.',
      },
      {
        q: 'How are peptides reconstituted?',
        a: 'Peptides are reconstituted by adding bacteriostatic water to the lyophilized powder. Inject the water slowly along the vial wall to avoid damaging the peptide. Gently swirl—never shake—until dissolved. Use our Reconstitution Calculator for precise measurements based on your desired concentration.',
      },
    ],
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: HelpCircle,
    faqs: [
      {
        q: 'What does it cost to use Peptide South Africa?',
        a: 'Nothing. Peptide South Africa is 100% free for registered researchers. You get full access to the peptide database, dose and reconstitution calculators, blends and stacks tools, COA verification, protocol tracking, bloodwork integration, and the monthly group Q&A. No paywalls, no premium tier, no credit card required.',
      },
      {
        q: 'How do I join the monthly Live Q&A?',
        a: 'The monthly Q&A is free for all registered researchers. Reserve your seat from the home page or the "Live Q&A" link in the footer. Sessions run on Zoom on the first Saturday of each month and cover dosage, stacking, cycles, and protocol questions.',
      },
      {
        q: 'Can I book a 1-on-1 consultation?',
        a: 'Yes. Use the "Book a Call" link in the app to email webinars@fintiba.com and schedule a 1-hour Zoom consultation. Booking is handled by email — no payment flow inside the app.',
      },
      {
        q: 'Do I need an account to start?',
        a: 'You can browse the research database, calculators, and FAQ without an account. To track protocols, log doses, set reminders, and sync data across devices, create a free account in under a minute.',
      },
      {
        q: 'How is my data handled?',
        a: 'Your protocol logs, doses, and biometrics are stored securely against your account and are private to you. See the Privacy Policy for full details.',
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Access & Membership',
    icon: CreditCard,
    faqs: [
      {
        q: "What's included for free?",
        a: 'Everything. All 98+ peptide profiles, reconstitution and dose calculators, the stack and blend builder, COA verification, protocol tracking, dose logging, bloodwork integration, AI insights, advanced cycle planning, the monthly group Q&A, and 1:1 expert calls. No credit card required, free forever.',
      },
      {
        q: 'Is there a paid tier I am missing?',
        a: 'No. We removed all paywalls. Every feature in the app is free for registered researchers. If you want to support the project, the best way is to shop research peptides at peptide-south-africa.com — that is what funds the tracker.',
      },
      {
        q: 'Where do I buy research peptides?',
        a: 'Our sister site Peptide South Africa Research Peptides at peptide-south-africa.com stocks COA-verified peptides and ships from South Africa. The tracker and the shop are separate properties but built by the same team. New to peptides? Take the 2-minute protocol quiz at peptide-south-africa.com/quiz — every protocol is reviewed by a GP before anything ships.',
      },
      {
        q: 'Is Peptide South Africa South African?',
        a: "Yes 🇿🇦 — Peptide South Africa is built and operated from Cape Town, with local WhatsApp + email support. We serve a global research community but we're proudly local.",
      },
    ],
  },
  {
    id: 'about',
    title: 'About Peptide South Africa',
    icon: Info,
    faqs: [
      {
        q: 'What is Peptide South Africa?',
        a: 'Peptide South Africa is a comprehensive peptide research database featuring 98+ peptides with detailed profiles, mechanisms of action, clinical research citations, dosage calculators, and stacking tools. It serves as an educational resource for researchers and enthusiasts.',
      },
      {
        q: 'How is the information sourced?',
        a: 'Our database is built from peer-reviewed scientific literature, clinical trial data (ClinicalTrials.gov), FDA documentation, and established pharmacological references. Each peptide profile includes citations to primary research sources.',
      },
      {
        q: 'How often is the database updated?',
        a: 'We regularly update our database as new research is published and clinical trials conclude. Peptide profiles, safety data, and research references are reviewed and updated on an ongoing basis to ensure accuracy.',
      },
      {
        q: 'Is Peptide South Africa medical advice?',
        a: 'No. Peptide South Africa is strictly an educational and research resource. The information provided is not intended to diagnose, treat, cure, or prevent any disease. Always consult a qualified healthcare professional before making any decisions related to peptide use.',
      },
    ],
  },
];

function FAQItem({ faq, value }: { faq: { q: string; a: string }; value: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 min-h-[52px] touch-manipulation"
      >
        <span className="font-semibold text-foreground text-sm md:text-base leading-snug">
          {faq.q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-accent" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent mb-4" />
              <p className="text-muted-foreground text-sm leading-relaxed">
                {faq.a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQSection() {
  const [activeCategory, setActiveCategory] = useState('general');
  const activeCat = faqCategories.find((c) => c.id === activeCategory) || faqCategories[0];

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/[0.03] to-background" />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-5"
          >
            <HelpCircle className="w-7 h-7 text-accent" />
          </motion.div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-flow">
              Frequently Asked Questions
            </span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Everything you need to know about peptides, safety, and Peptide South Africa.
          </p>
        </motion.div>

        {/* Category tabs - horizontally scrollable on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex overflow-x-auto gap-2 mb-10 pb-2 scrollbar-hide justify-start md:justify-center -mx-4 px-4 md:mx-0 md:px-0"
        >
          {faqCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                whileTap={{ scale: 0.95 }}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 min-h-[44px]
                  ${isActive
                    ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/25'
                    : 'bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {cat.title}
              </motion.button>
            );
          })}
        </motion.div>

        {/* FAQ items */}
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {activeCat.faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  <FAQItem faq={faq} value={`${activeCat.id}-${i}`} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom count badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {faqCategories.reduce((sum, c) => sum + c.faqs.length, 0)} answers across {faqCategories.length} categories
          </span>
        </motion.div>
      </div>
    </section>
  );
}

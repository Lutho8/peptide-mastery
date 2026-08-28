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
    id: 'measurement-records',
    title: 'Measurement & Records',
    icon: Syringe,
    faqs: [
      {
        q: 'Does the app choose an amount for me?',
        a: 'No. You enter an amount from your own research record or a documented plan. The app stores that value and performs neutral arithmetic; it does not select a starting amount, change it, or titrate it.',
      },
      {
        q: 'What do mg, mcg, mL, IU, U-40 and U-100 mean?',
        a: 'mg and mcg are mass units; 1 mg equals 1,000 mcg. mL measures liquid volume. IU measures biological activity and is not automatically interchangeable with mass. U-40 and U-100 are printed syringe scales: 40 or 100 barrel units equal 1 mL. The Measurement Tool converts only the valid user-entered mass, volume and selected barrel scale.',
      },
      {
        q: 'What if I miss an entry?',
        a: 'You can leave it unrecorded or add an accurate historical entry later. The app does not tell you to catch up, double an amount or change a schedule. Follow the documented plan or ask a qualified professional when a real-world action is unclear.',
      },
      {
        q: 'Does the app select timing or reminders?',
        a: 'No. Reminders use only a time you explicitly record. The dashboard can notify you and show your history, but it does not invent timing, catch-up instructions or administration advice.',
      },
      {
        q: 'Can I record more than one compound or blend?',
        a: 'Yes. The Advanced Workspace can store multiple items that you enter from an existing plan or your own research record. Recording items together is not a compatibility or safety conclusion, and the app does not recommend combinations.',
      },
      {
        q: 'Does the app choose a cycle length or pause?',
        a: 'No. You may record a start date, length or pause from an existing plan, then compare it with your own entries. The app does not choose a cycle duration, washout period, pause or restart date.',
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
        q: 'What can I record in the dashboard?',
        a: 'You can record an existing plan, completed entries, progress measures, inventory, bloodwork files and support history. Enter only details you already have; the app does not create a clinical plan.',
      },
      {
        q: 'Where do patient-specific questions go?',
        a: 'Use the guided pathway or contact support so treatment, monitoring and suitability questions can be routed appropriately. The catalogue and tracker do not answer those questions.',
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
        a: 'Creating an account and using the current dashboard is free. The dashboard includes existing-plan records, progress tracking, inventory, bloodwork records and the research catalogue.',
      },
      {
        q: 'Do I need an account to start?',
        a: 'You can browse the research catalogue and FAQ without an account. Create an account to save your pathway and keep your own records in sync.',
      },
      {
        q: 'How is my data handled?',
        a: 'Your saved records are linked to your account. See the Privacy Policy for the current data-handling details, including the separate consent used for lab-report extraction.',
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
        a: 'The current account includes the guided dashboard, existing-plan records, progress logs, inventory, bloodwork records and catalogue access. Patient-specific clinical services are not represented as an automatic app feature.',
      },
      {
        q: 'Is there a paid tier I am missing?',
        a: 'The current dashboard does not require a paid tier. Any future paid service or external store purchase must be presented separately with its own price and scope.',
      },
      {
        q: 'Where do I buy research peptides?',
        a: 'The research store is linked separately at peptide-south-africa.com. The dashboard does not choose a product for you. New users should complete the pathway questions first; patient-specific decisions must be routed to an appropriate healthcare professional.',
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
        a: 'Peptide South Africa is a South African research catalogue and record-keeping dashboard designed to give new and experienced users a clear next step without automatically selecting products or clinical instructions.',
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

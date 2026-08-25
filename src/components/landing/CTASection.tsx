import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SparkleButton } from '@/components/ui/SparkleButton';

interface CTASectionProps {
  onSignInClick: () => void;
}

const benefits = [
  'Guided first step',
  'Existing-plan tracking',
  'Bloodwork record',
  'Source-linked research',
  'Inventory record',
];

export function CTASection({ onSignInClick }: CTASectionProps) {
  return (
    <section className="py-16 lg:py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-accent/5 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/10 rounded-full blur-3xl opacity-40" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready for one clear next step?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Create an account to organise your pathway, existing plan, progress and support without scattered systems.
          </p>

          {/* Benefits List */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center gap-2 bg-secondary/50 rounded-full px-4 py-2"
              >
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">{benefit}</span>
              </motion.div>
            ))}
          </div>

          {/* Dual CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={onSignInClick}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-95 group w-full sm:w-auto"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Create Free Account
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <SparkleButton asChild size="lg" className="w-full sm:w-auto">
              <a href="https://peptide-south-africa.com?utm_source=tracker&utm_medium=cta_section&utm_campaign=buy_peptides" target="_blank" rel="noopener noreferrer">
                Browse Research Store →
              </a>
            </SparkleButton>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Free forever · No credit card · No paywalls
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            🇿🇦 Built in Cape Town
          </p>
        </motion.div>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Droplets, FlaskConical, Syringe, Snowflake, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const steps = [
  {
    title: 'Gather Your Supplies',
    icon: FlaskConical,
    color: 'text-primary',
    description: 'You will need: lyophilized peptide vial, bacteriostatic (BAC) water, insulin syringe, and alcohol swabs.',
    tips: ['Wash hands thoroughly', 'Work on a clean surface', 'Check vial labels and expiry dates'],
  },
  {
    title: 'Swab the Vial Tops',
    icon: AlertTriangle,
    color: 'text-amber-500',
    description: 'Use alcohol swabs to clean the rubber stoppers on both the peptide vial and the BAC water vial.',
    tips: ['Let alcohol dry for 10 seconds', 'Do not blow on the tops to dry them', 'Single swipe per pad'],
  },
  {
    title: 'Draw BAC Water',
    icon: Syringe,
    color: 'text-primary',
    description: 'Insert the syringe into the BAC water vial and slowly draw your calculated amount of bacteriostatic water.',
    tips: ['Pull plunger slowly and steadily', 'Remove air bubbles by tapping the syringe', 'Double-check the measurement against your calculation'],
  },
  {
    title: 'Inject Into Peptide Vial',
    icon: Droplets,
    color: 'text-blue-500',
    description: 'Insert the needle into the peptide vial at an angle. Let the BAC water drip slowly down the inside wall of the vial.',
    tips: ['NEVER spray directly onto the powder', 'Aim the stream against the glass wall', 'Inject slowly — the powder is fragile'],
    critical: true,
  },
  {
    title: 'Gently Swirl to Dissolve',
    icon: FlaskConical,
    color: 'text-emerald-500',
    description: 'Once all water is added, gently roll or swirl the vial between your fingers until the powder fully dissolves. Do NOT shake.',
    tips: ['Rolling is better than swirling', 'Never shake vigorously', 'Solution should be clear — if cloudy, wait or gently roll more'],
  },
  {
    title: 'Store Properly',
    icon: Snowflake,
    color: 'text-sky-400',
    description: 'Label the vial with peptide name, date, concentration, and dose. Store refrigerated at 2–8°C. Use within 30 days.',
    tips: ['Use the Peptide South Africa Label Maker to create a label', 'Keep away from light', 'Never freeze reconstituted peptides'],
  },
];

export function ReconstitutionGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={cn(
              "flex-1 h-1.5 rounded-full transition-all duration-300",
              i <= currentStep ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Step {currentStep + 1} of {steps.length}
      </div>

      {/* Animated step card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <Card className={cn("p-6 space-y-4", step.critical && "border-amber-500/40 bg-amber-500/5")}>
            {/* Visual animation area */}
            <div className="flex justify-center py-6">
              <div className="relative">
                {/* Vial illustration */}
                <motion.div
                  className="w-20 h-32 rounded-b-lg rounded-t-sm border-2 border-muted-foreground/30 relative overflow-hidden bg-background"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Vial cap */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-muted-foreground/40 rounded-t-sm" />

                  {/* Liquid fill animation */}
                  {currentStep >= 3 && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 bg-primary/20"
                      initial={{ height: 0 }}
                      animate={{ height: currentStep >= 4 ? '60%' : '40%' }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    >
                      {/* Wave effect */}
                      <motion.div
                        className="absolute top-0 left-0 right-0 h-2 bg-primary/30 rounded-full"
                        animate={{ y: [-1, 1, -1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </motion.div>
                  )}

                  {/* Powder at bottom (before reconstitution) */}
                  {currentStep < 3 && (
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-muted-foreground/15 rounded-b-lg" />
                  )}

                  {/* Swirl animation */}
                  {currentStep === 4 && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="w-3 h-3 rounded-full border border-primary/40" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Syringe animation (steps 2-3) */}
                {(currentStep === 2 || currentStep === 3) && (
                  <motion.div
                    className="absolute -right-12 top-2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <Syringe className="w-10 h-10 text-primary rotate-45" />
                  </motion.div>
                )}

                {/* Droplets animation (step 3) */}
                {currentStep === 3 && (
                  <motion.div
                    className="absolute left-6 top-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <motion.div
                      animate={{ y: [0, 20, 0], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Droplets className="w-4 h-4 text-blue-400" />
                    </motion.div>
                  </motion.div>
                )}

                {/* Snowflake for storage step */}
                {currentStep === 5 && (
                  <motion.div
                    className="absolute -right-10 top-4"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Snowflake className="w-8 h-8 text-sky-400" />
                  </motion.div>
                )}

                {/* Alcohol swab animation */}
                {currentStep === 1 && (
                  <motion.div
                    className="absolute -top-2 left-1/2 -translate-x-1/2"
                    animate={{ x: [-8, 8, -8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-8 h-6 bg-muted-foreground/20 rounded-sm border border-muted-foreground/30" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Step content */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Icon className={cn("w-5 h-5", step.color)} />
                <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>

            {/* Tips */}
            <div className="space-y-1.5 pt-2">
              {step.tips.map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * (i + 1) }}
                  className="flex items-start gap-2 text-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
                  <span className="text-muted-foreground">{tip}</span>
                </motion.div>
              ))}
            </div>

            {step.critical && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-medium">Critical: Never spray water directly onto the lyophilized powder!</span>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button
          size="sm"
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

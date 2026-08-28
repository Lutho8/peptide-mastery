import { motion } from 'framer-motion';
import { 
  Scale, 
  Zap, 
  Heart, 
  Timer, 
  Brain, 
  Shield, 
  Dna, 
  Activity,
  Sparkles,
} from 'lucide-react';
import { getAllCategories, type PeptideCategory } from '@/data/peptides';

interface PeptideCategoriesProps {
  onCategoryClick?: () => void;
}

const CATEGORY_PRESENTATION: Record<PeptideCategory, { icon: typeof Scale; color: string; bg: string }> = {
  'weight-loss': { icon: Scale, color: 'text-accent', bg: 'bg-accent/10' },
  'gh-secretagogue': { icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
  healing: { icon: Heart, color: 'text-destructive', bg: 'bg-destructive/10' },
  'anti-aging': { icon: Timer, color: 'text-accent', bg: 'bg-accent/10' },
  cognitive: { icon: Brain, color: 'text-primary', bg: 'bg-primary/10' },
  immune: { icon: Shield, color: 'text-primary', bg: 'bg-primary/10' },
  longevity: { icon: Dna, color: 'text-accent', bg: 'bg-accent/10' },
  metabolic: { icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
  'skin-hair': { icon: Sparkles, color: 'text-accent', bg: 'bg-accent/10' },
  hormonal: { icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
  bioregulators: { icon: Dna, color: 'text-accent', bg: 'bg-accent/10' },
};

const DISPLAYED_CATEGORIES: PeptideCategory[] = [
  'weight-loss',
  'gh-secretagogue',
  'healing',
  'skin-hair',
  'cognitive',
  'immune',
  'longevity',
  'metabolic',
];

export function PeptideCategories({ onCategoryClick }: PeptideCategoriesProps) {
  const categoryById = new Map(getAllCategories().map((category) => [category.id, category]));
  const categories = DISPLAYED_CATEGORIES.map((id) => ({
    ...categoryById.get(id)!,
    ...CATEGORY_PRESENTATION[id],
  }));

  return (
    <section id="categories" className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Browse by Category</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore peptides organized by their primary research applications.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCategoryClick}
              className={`${category.bg} border border-border/50 rounded-xl p-4 text-left hover:border-accent/50 transition-all group`}
            >
              <category.icon className={`w-8 h-8 ${category.color} mb-3 group-hover:scale-110 transition-transform`} />
              <h3 className="font-semibold text-foreground mb-1">{category.label}</h3>
              <p className="text-sm text-muted-foreground">{category.count} peptides</p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

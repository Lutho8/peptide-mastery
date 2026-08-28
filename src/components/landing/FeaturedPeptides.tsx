import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Activity, Scale, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PeptideDetailModal } from '@/components/modals/PeptideDetailModal';
import { peptides, Peptide } from '@/data/peptides';

const featuredPeptideIds = ['bpc157', 'tb500', 'semaglutide', 'tirzepatide'];

const iconMap: Record<string, React.ElementType> = {
  'bpc157': Shield,
  'tb500': Activity,
  'semaglutide': Scale,
  'tirzepatide': Sparkles,
};

const gradientMap: Record<string, string> = {
  'bpc157': 'from-emerald-500 to-green-600',
  'tb500': 'from-blue-500 to-cyan-600',
  'semaglutide': 'from-purple-500 to-pink-600',
  'tirzepatide': 'from-orange-500 to-red-600',
};

interface FeaturedPeptidesProps {
  limit?: number;
}

export function FeaturedPeptides({ limit }: FeaturedPeptidesProps = {}) {
  const [selectedPeptide, setSelectedPeptide] = useState<Peptide | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const featuredPeptides = (featuredPeptideIds
    .map(id => peptides.find(p => p.id === id))
    .filter(Boolean) as Peptide[]).slice(0, limit ?? featuredPeptideIds.length);

  const handlePeptideClick = (peptide: Peptide) => {
    setSelectedPeptide(peptide);
    setDetailModalOpen(true);
  };

  return (
    <section id="browse" className="py-16 lg:py-24 bg-gradient-to-b from-transparent via-secondary/20 to-transparent">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Peptides</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Review selected compound profiles with evidence context, limitations and clearly separated store navigation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {featuredPeptides.map((peptide, index) => {
            const Icon = iconMap[peptide.id] || Shield;
            const gradient = gradientMap[peptide.id] || 'from-primary to-accent';
            const isFdaApproved = peptide.fdaApproved;

            return (
              <motion.div
                key={peptide.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className="h-full group hover:border-accent/50 transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => handlePeptideClick(peptide)}
                >
                  <div className={`h-1 bg-gradient-to-r ${gradient}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{peptide.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{peptide.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {peptide.janoshikTested && peptide.janoshikCOA?.length ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5">
                            <FlaskConical className="w-3 h-3 mr-0.5" />
                            COA Verified
                          </Badge>
                        ) : null}
                        <Badge 
                          variant={isFdaApproved ? 'default' : 'secondary'}
                          className={isFdaApproved ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                        >
                          {isFdaApproved ? 'FDA Approved' : 'Research'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed line-clamp-3">
                      {peptide.mechanism}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <PeptideDetailModal
        peptide={selectedPeptide}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </section>
  );
}

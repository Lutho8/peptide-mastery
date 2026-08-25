import { motion } from 'framer-motion';
import { BookOpenCheck, LayoutDashboard, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ResearchToolsProps {
  onSearchClick?: () => void;
  onStartClick?: () => void;
}

export function ResearchTools({ onSearchClick, onStartClick }: ResearchToolsProps) {
  const tools = [
    {
      icon: Search,
      title: 'Browse the research catalogue',
      description: 'Search source-linked peptide and blend records without receiving a product recommendation.',
      color: 'from-cyan-500 to-teal-500',
      onClick: onSearchClick,
    },
    {
      icon: LayoutDashboard,
      title: 'Use the guided dashboard',
      description: 'Start with a clear next step, then keep your records, progress and support in one account.',
      color: 'from-purple-500 to-pink-500',
      onClick: onStartClick,
    },
    {
      icon: BookOpenCheck,
      title: 'Understand the two pathways',
      description: 'Separate guided clinical questions from independent research before you continue.',
      color: 'from-green-500 to-emerald-500',
      onClick: onStartClick,
    },
  ];

  return (
    <section id="tools" className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Research Tools</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three clear places to begin, without a product quiz or an automatically generated stack.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className="h-full group hover:border-accent/50 transition-all duration-300 cursor-pointer bg-card/50 backdrop-blur-sm"
                onClick={tool.onClick}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{tool.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

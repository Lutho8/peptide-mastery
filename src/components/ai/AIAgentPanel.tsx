import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Brain, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GradientCard } from '@/components/ui/GradientCard';
import { usePeptideAI } from '@/hooks/usePeptideAI';
import { cn } from '@/lib/utils';

interface AIAgentPanelProps {
  peptideId?: string;
  peptideName?: string;
}

export function AIAgentPanel({
  peptideId,
  peptideName,
}: AIAgentPanelProps) {
  const { isLoading, response, fetchResearch, clearResponse } = usePeptideAI();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAction = async () => {
    if (peptideId && peptideName) {
      await fetchResearch(peptideId, peptideName);
    }
    setIsExpanded(true);
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <h4 key={i} className="font-semibold text-foreground mt-4 mb-2">{line.slice(2, -2)}</h4>;
        }
        if (line.startsWith('# ')) {
          return <h3 key={i} className="text-lg font-bold text-foreground mt-4 mb-2">{line.slice(2)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h4 key={i} className="font-semibold text-foreground mt-3 mb-2">{line.slice(3)}</h4>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="text-muted-foreground ml-4">{line.slice(2)}</li>;
        }
        if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
          return <li key={i} className="text-muted-foreground ml-4 list-decimal">{line.slice(3)}</li>;
        }
        if (line.trim() === '') {
          return <br key={i} />;
        }
        return <p key={i} className="text-muted-foreground leading-relaxed">{line}</p>;
      });
  };

  return (
    <GradientCard className="relative overflow-hidden border border-accent/20" hover>
      {/* Luxury glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 pointer-events-none" />
      <motion.div
        className="absolute -top-10 -right-10 w-32 h-32 bg-accent/10 rounded-full blur-2xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30"
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Bot className="w-5 h-5 text-accent" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Research review checklist
                <motion.span 
                  className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  Structured
                </motion.span>
              </h3>
              <p className="text-xs text-muted-foreground">
                A neutral checklist for reviewing evidence and limitations
              </p>
            </div>
          </div>
          
          {response && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Action Button */}
        <AnimatePresence mode="wait">
          {!response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleAction}
                disabled={isLoading || !peptideId}
                className={cn(
                  "w-full relative overflow-hidden",
                  "bg-gradient-to-r from-accent to-accent/80",
                  "hover:from-accent/90 hover:to-accent/70",
                  "text-accent-foreground font-medium",
                  "border border-accent/30 shadow-lg shadow-accent/20"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    <span className="ml-2">Open review checklist</span>
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Response Content */}
        <AnimatePresence>
          {response && isExpanded && (
            <motion.div 
              className="mt-4 space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-4 rounded-xl bg-background/50 border border-border/50 max-h-[400px] overflow-y-auto scrollbar-hide">
                <div className="prose prose-sm prose-invert max-w-none">
                  {formatContent(response)}
                </div>
              </div>
              
              {/* Disclaimer */}
              <p className="text-[10px] text-muted-foreground/60 italic text-center">
                For research and educational purposes only. Not medical advice.
              </p>
              
              <div className="flex gap-2">
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAction}
                    disabled={isLoading}
                    className="w-full border-accent/30 text-accent hover:bg-accent/10"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh checklist'}
                  </Button>
                </motion.div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { clearResponse(); setIsExpanded(false); }}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GradientCard>
  );
}

import { useState } from 'react';
import { researchUpdates, ResearchUpdate } from '@/data/researchUpdates';
import { Newspaper, ExternalLink, FlaskConical, TestTube, Lightbulb, BookOpen, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const categoryConfig = {
  'clinical-trial': { label: 'Clinical Trial', icon: TestTube, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'study': { label: 'Study', icon: FlaskConical, className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  'review': { label: 'Review', icon: BookOpen, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  'breakthrough': { label: 'Breakthrough', icon: Lightbulb, className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  'regulatory': { label: 'Regulatory', icon: ShieldCheck, className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  'evidence-limit': { label: 'Evidence Limit', icon: AlertTriangle, className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};

export function NewsTicker() {
  const [selectedArticle, setSelectedArticle] = useState<ResearchUpdate | null>(null);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const duplicatedHeadlines = [...researchUpdates, ...researchUpdates];

  return (
    <>
      <div 
        className="relative overflow-hidden bg-primary/10 border border-primary/20 rounded-xl py-3 cursor-pointer"
        onClick={() => setShowAllUpdates(true)}
      >
        <div className="flex items-center gap-2 px-3 mb-2">
          <Newspaper size={14} className="text-primary" />
          <span className="text-xs font-medium text-primary">Research Updates</span>
          <span className="text-xs text-muted-foreground ml-auto">Tap to read all →</span>
        </div>
        <div className="overflow-hidden">
          <div className="ticker-scroll flex gap-12 whitespace-nowrap">
            {duplicatedHeadlines.map((item, index) => (
              <button
                key={index}
                className="text-sm text-muted-foreground inline-flex items-center gap-2 hover:text-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedArticle(item);
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {item.headline}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Single Article Detail */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-lg bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg leading-tight pr-6">
              {selectedArticle?.headline}
            </DialogTitle>
            <DialogDescription className="sr-only">Research article details</DialogDescription>
          </DialogHeader>
          {selectedArticle && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const config = categoryConfig[selectedArticle.category];
                  const Icon = config.icon;
                  return (
                    <Badge variant="outline" className={config.className}>
                      <Icon size={12} className="mr-1" />
                      {config.label}
                    </Badge>
                  );
                })()}
                {selectedArticle.peptideName && (
                  <Badge variant="secondary">{selectedArticle.peptideName}</Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">{selectedArticle.date}</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{selectedArticle.summary}</p>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground">Source: {selectedArticle.source}</span>
                <a
                  href={selectedArticle.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  View source <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* All Updates List */}
      <Dialog open={showAllUpdates} onOpenChange={setShowAllUpdates}>
        <DialogContent className="max-w-lg max-h-[85vh] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Newspaper size={18} className="text-primary" />
              Latest Research Updates
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {researchUpdates.length} verified source updates · reviewed 23 Aug 2026
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-3">
              {researchUpdates.map((update) => {
                const config = categoryConfig[update.category];
                const Icon = config.icon;
                return (
                  <button
                    key={update.id}
                    className="w-full text-left p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-colors space-y-2"
                    onClick={() => {
                      setShowAllUpdates(false);
                      setTimeout(() => setSelectedArticle(update), 200);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className={`${config.className} text-[10px] shrink-0`}>
                        <Icon size={10} className="mr-0.5" />
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">{update.date}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-snug">{update.headline}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{update.summary}</p>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

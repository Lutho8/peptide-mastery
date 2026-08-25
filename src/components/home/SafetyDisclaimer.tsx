import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SafetyDisclaimer() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-yellow-500" />
          <span className="text-sm font-medium text-yellow-400">Safety Disclaimer</span>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-yellow-500" />
        ) : (
          <ChevronDown size={16} className="text-yellow-500" />
        )}
      </button>
      
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isExpanded ? "max-h-96 mt-3" : "max-h-0"
      )}>
        <p className="text-xs text-yellow-200/80 leading-relaxed">
          This app stores information you provide and presents educational source material. It does
          not diagnose, prescribe, choose a product, generate a dosage or promise an outcome. Product
          status and permitted use vary. A qualified healthcare professional must make patient-specific
          clinical decisions, including whether treatment or monitoring is appropriate.
        </p>
      </div>
    </div>
  );
}

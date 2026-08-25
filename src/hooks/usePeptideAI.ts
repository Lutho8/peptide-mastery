import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  type?: string;
  timestamp?: string;
}

export function usePeptideAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const fetchResearch = async (peptideId: string, peptideName: string, query?: string) => {
    setIsLoading(true);
    setResponse(null);
    
    try {
      const { data, error } = await supabase.functions.invoke<AIResponse>('peptide-ai-agent', {
        body: {
          type: 'research',
          peptideId,
          peptideName,
          query
        }
      });

      if (error) throw error;
      
      if (data?.success && data.content) {
        setResponse(data.content);
        return data.content;
      } else {
        throw new Error(data?.error || 'Failed to fetch research');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch research';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearResponse = () => setResponse(null);

  return {
    isLoading,
    response,
    fetchResearch,
    clearResponse
  };
}

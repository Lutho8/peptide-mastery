import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAccessControl() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    // Never carry a previous user's role across an account transition.
    setIsAdmin(false);
    setIsLoading(true);

    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (!cancelled) setIsAdmin(!!data && !error);
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // All authenticated users have access - no paywall
  const hasAccess = !!user;

  return { hasAccess, isAdmin, isLoading };
}

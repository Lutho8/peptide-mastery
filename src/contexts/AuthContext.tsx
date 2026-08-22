import React, { createContext, useContext, ReactNode } from 'react';
import { User, Session, Provider } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { signInWithOAuth as startOAuth } from '@/integrations/auth/oauth';
import {
  setActiveUserId,
  clearLegacyGlobalKeys,
  initializeStorage,
} from '@/services/storage';
import { clearAllScheduledNotifications } from '@/services/pushScheduler';
import { shouldPromptForMigration } from '@/services/migration';
import { DataMigrationModal } from '@/components/auth/DataMigrationModal';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: Provider) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// One-time legacy cleanup flag
let legacyCleared = false;
function ensureLegacyCleared() {
  if (legacyCleared) return;
  clearLegacyGlobalKeys();
  legacyCleared = true;
}

function applyUserScope(currentUser: User | null, _prevUserId: string | null) {
  // Switch the storage namespace to the current user (or guest). Each user has
  // their own namespace ("<key>::<uid>"), so we do NOT wipe other users' data —
  // that's what was causing stacks/cycles to disappear after sign-in.
  // Privacy is preserved by namespacing alone.
  const newUserId = currentUser?.id ?? null;
  setActiveUserId(newUserId);
  // Seed defaults only if this user/guest has no namespaced data yet.
  initializeStorage();
}

/**
 * Detect and process an OAuth callback that landed on the root path.
 * With HashRouter, OAuth providers may redirect to /?code=xxx (root with query params).
 * This function checks for the code and exchanges it for a session.
 */
async function handleRootOAuthCallback(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');

  if (error) {
    console.error('OAuth provider error:', error, params.get('error_description'));
    // Clean the URL so the error doesn't persist on refresh
    window.history.replaceState({}, document.title, window.location.pathname);
    return false;
  }

  if (!code) return false;

  try {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error('OAuth code exchange error:', exchangeError);
      toast.error('Sign-in failed. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
      return false;
    }

    if (data.session) {
      // Clean the code from the URL so it doesn't get reused on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      toast.success('Signed in successfully');
      return true;
    }
  } catch (err) {
    console.error('Unexpected error during OAuth callback:', err);
  }

  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showMigrationModal, setShowMigrationModal] = React.useState(false);
  const prevUserIdRef = React.useRef<string | null>(null);
  const initializedRef = React.useRef(false);
  const migrationCheckedRef = React.useRef(false);

  React.useEffect(() => {
    ensureLegacyCleared();

    const handleAuth = (currentSession: Session | null) => {
      const currentUser = currentSession?.user ?? null;
      // Only apply scope changes after the first resolution, OR on actual user-id change.
      const prevId = prevUserIdRef.current;
      const newId = currentUser?.id ?? null;
      const wasInitialized = initializedRef.current;

      if (!wasInitialized || prevId !== newId) {
        applyUserScope(currentUser, prevId);

        // Welcome-back toast: only on a real sign-in transition
        // (skip the initial session-restore on page load, skip sign-out)
        if (wasInitialized && prevId === null && newId !== null && currentUser) {
          const meta = currentUser.user_metadata as Record<string, unknown> | undefined;
          const displayName =
            (typeof meta?.display_name === 'string' && meta.display_name) ||
            (typeof meta?.full_name === 'string' && meta.full_name) ||
            currentUser.email?.split('@')[0] ||
            'there';
          toast.success(`Welcome back, ${displayName} — loading your data`, {
            duration: 3500,
          });

          // Prompt for data migration if old-namespaced localStorage exists
          if (!migrationCheckedRef.current && shouldPromptForMigration(newId)) {
            setShowMigrationModal(true);
          }
        }

        prevUserIdRef.current = newId;
        initializedRef.current = true;
      }
      setSession(currentSession);
      setUser(currentUser);
      setIsLoading(false);
    };

    // Check for OAuth callback on the root path BEFORE setting up listeners
    // This handles cases where OAuth providers redirect to /?code=xxx
    const isCallbackPath = window.location.pathname === '/auth/callback' || window.location.pathname === '/auth/callback/';
    if (!isCallbackPath) {
      handleRootOAuthCallback().then((handled) => {
        if (handled) {
          // Refresh session after successful OAuth exchange
          supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            handleAuth(currentSession);
          });
        }
      });
    }

    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        handleAuth(currentSession);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      handleAuth(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { display_name: displayName },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signInWithOAuth = async (provider: Provider) => {
    try {
      if (provider !== 'google' && provider !== 'apple') {
        return { error: new Error(`Provider ${provider} not supported`) };
      }
      const result = await startOAuth(provider, {
        redirectTo: window.location.origin,
      });
      if (result.error) {
        console.error('[OAuth] error:', result.error);
        const err = result.error;
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
      // Supabase redirects the browser to the provider; the session is picked
      // up from the URL on return via detectSessionInUrl.
      return { error: null };
    } catch (err) {
      console.error('[OAuth] unexpected:', err);
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signOut = async () => {
    // Clear scheduled reminders + active OS notifications BEFORE auth sign-out
    // so the previous user's reminders never fire for the next user.
    try {
      await clearAllScheduledNotifications();
    } catch (err) {
      console.warn('Failed to clear scheduled notifications on sign-out:', err);
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signIn, signInWithOAuth, signOut }}>
      {children}
      {user && (
        <DataMigrationModal
          userId={user.id}
          open={showMigrationModal}
          onClose={() => {
            setShowMigrationModal(false);
            migrationCheckedRef.current = true;
          }}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

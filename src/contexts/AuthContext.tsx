import React, { createContext, useContext, ReactNode } from 'react';
import { User, Session, Provider } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { signInWithOAuth as startOAuth } from '@/integrations/auth/oauth';
import {
  setActiveUserId,
  initializeStorage,
} from '@/services/storage';
import { clearAllScheduledNotifications } from '@/services/pushScheduler';
import { shouldPromptForMigration } from '@/services/migration';
import { DataMigrationModal } from '@/components/auth/DataMigrationModal';
import { getOAuthCallbackUrl, getPasswordRecoveryUrl } from '@/lib/authRedirect';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: Provider) => Promise<{ error: Error | null }>;
  sendSignInLink: (email: string) => Promise<{ error: Error | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showMigrationModal, setShowMigrationModal] = React.useState(false);
  const prevUserIdRef = React.useRef<string | null>(null);
  const initializedRef = React.useRef(false);
  const migrationCheckedForUserRef = React.useRef<string | null>(null);

  React.useEffect(() => {
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

        }

        // Check on both a fresh sign-in and a restored browser session. This
        // recovers entries recorded while sign-in was unavailable.
        if (newId && migrationCheckedForUserRef.current !== newId) {
          migrationCheckedForUserRef.current = newId;
          setShowMigrationModal(shouldPromptForMigration(newId));
        } else if (!newId) {
          migrationCheckedForUserRef.current = null;
          setShowMigrationModal(false);
        }

        prevUserIdRef.current = newId;
        initializedRef.current = true;
      }
      setSession(currentSession);
      setUser(currentUser);
      setIsLoading(false);
    };

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { display_name: displayName },
      },
    });
    return {
      error: error as Error | null,
      needsEmailConfirmation: !error && !data.session,
    };
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
        redirectTo: getOAuthCallbackUrl(),
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

  const sendSignInLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: getOAuthCallbackUrl(),
      },
    });
    return { error: error as Error | null };
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordRecoveryUrl(),
    });
    return { error: error as Error | null };
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: getOAuthCallbackUrl() },
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error as Error | null };
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
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      signUp,
      signIn,
      signInWithOAuth,
      sendSignInLink,
      requestPasswordReset,
      resendConfirmation,
      updatePassword,
      signOut,
    }}>
      {children}
      {user && (
        <DataMigrationModal
          userId={user.id}
          open={showMigrationModal}
          onClose={() => {
            setShowMigrationModal(false);
            migrationCheckedForUserRef.current = user.id;
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

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { resolveAuthCallback } from '@/lib/authCallback';
import { track } from '@/lib/analytics';

/**
 * AuthCallback — Handles OAuth redirects from Google, Apple, etc.
 *
 * With HashRouter, OAuth providers redirect to /auth/callback?code=xxx.
 * Vercel serves index.html (via vercel.json), then this component:
 * 1. Reads ?code= from window.location.search
 * 2. Exchanges it for a Supabase session
 * 3. Redirects to the signed-in dashboard
 */
export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      const outcome = await resolveAuthCallback(
        window.location.search,
        (code) => supabase.auth.exchangeCodeForSession(code),
      );
      setStatus(outcome.status);
      setMessage(outcome.message);
      track(outcome.status === 'success' ? 'sign_in_completed' : 'auth_callback_failed', {
        method: 'oauth_or_email_link',
        reason: outcome.reason,
      });
      setTimeout(() => {
        window.location.replace(outcome.redirectTo);
      }, outcome.status === 'success' ? 1200 : 3000);
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">Completing sign-in...</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">Welcome back!</h1>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">Sign-in failed</h1>
          </>
        )}
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

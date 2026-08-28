import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getDashboardHref, PASSWORD_RECOVERY_PATH } from '@/lib/authRedirect';
import { getFriendlyAuthError } from '@/lib/authErrors';

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
      try {
        // Parse query parameters from the URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        const flow = params.get('flow');

        // Handle OAuth provider errors
        if (error) {
          setStatus('error');
          console.error('OAuth provider error:', error, errorDescription);
          setMessage('We could not complete sign-in. Please try again or use an email sign-in link.');
          // Redirect to app after showing error briefly
          setTimeout(() => {
            window.location.replace('/');
          }, 3000);
          return;
        }

        // No code present — invalid or already consumed callback
        if (!code) {
          setStatus('error');
          setMessage('No authorization code found. Please try signing in again.');
          setTimeout(() => {
            window.location.replace('/');
          }, 3000);
          return;
        }

        // Exchange the authorization code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('OAuth callback exchange error:', exchangeError);
          setStatus('error');
          setMessage(getFriendlyAuthError(exchangeError, 'We could not complete sign-in. Please try again or use an email sign-in link.'));
          setTimeout(() => {
            window.location.replace('/');
          }, 3000);
          return;
        }

        if (data.session) {
          setStatus('success');
          setMessage(flow === 'password-recovery' ? 'Recovery verified. Opening password setup…' : 'Signed in successfully! Redirecting...');
          // Small delay so user sees success state
          setTimeout(() => {
            window.location.replace(flow === 'password-recovery' ? PASSWORD_RECOVERY_PATH : getDashboardHref());
          }, 1200);
        } else {
          setStatus('error');
          setMessage('Authentication incomplete. Please try again.');
          setTimeout(() => {
            window.location.replace('/');
          }, 3000);
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setStatus('error');
        setMessage('Something went wrong. Please try signing in again.');
        setTimeout(() => {
          window.location.replace('/');
        }, 3000);
      }
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

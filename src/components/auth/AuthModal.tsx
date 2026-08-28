import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle2, KeyRound, Loader2, Lock, Mail, User } from 'lucide-react';
import { z } from 'zod';
import { captureLead } from '@/lib/crm';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_PATH } from '@/lib/authRedirect';
import { getFriendlyAuthError } from '@/lib/authErrors';
import { getAuthProviderAvailability, type AuthProviderAvailability } from '@/integrations/auth/providers';
import { track } from '@/lib/analytics';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: 'signin' | 'signup';
}

type AuthMode = 'signin' | 'signup' | 'magic-link' | 'forgot-password' | 'resend-confirmation';

const emailSchema = z.string().trim().email('Enter a valid email address').max(255);
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(100);

const MODE_COPY: Record<AuthMode, { title: string; description: string; submit: string }> = {
  signin: { title: 'Sign in to your dashboard', description: 'Use the same account that holds your protocols and tracking history.', submit: 'Sign in' },
  signup: { title: 'Create your tracker account', description: 'Save your pathway and continue your records across devices.', submit: 'Create account' },
  'magic-link': { title: 'Email me a sign-in link', description: 'Use this if you previously signed in with Apple, Google, or cannot remember your password.', submit: 'Send secure sign-in link' },
  'forgot-password': { title: 'Reset your password', description: 'We will email a secure recovery link without changing your saved account data.', submit: 'Send recovery link' },
  'resend-confirmation': { title: 'Resend confirmation', description: 'Request a fresh confirmation link for an unfinished email registration.', submit: 'Resend confirmation email' },
};

export function AuthModal({ open, onOpenChange, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [providers, setProviders] = useState<AuthProviderAvailability>({ email: true, google: true, apple: false });
  const {
    signIn,
    signUp,
    signInWithOAuth,
    sendSignInLink,
    requestPasswordReset,
    resendConfirmation,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setMode(defaultMode);
    setNotice(null);
    void getAuthProviderAvailability().then(setProviders);
  }, [defaultMode, open]);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setNotice(null);
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    track('sign_in_started', { method: provider });
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) toast.error(getFriendlyAuthError(error, `${provider === 'google' ? 'Google' : 'Apple'} sign-in could not start. Use an email sign-in link instead.`));
    } catch (error) {
      toast.error(getFriendlyAuthError(error));
    } finally {
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);

    let normalizedEmail: string;
    try {
      normalizedEmail = emailSchema.parse(email).toLowerCase();
      if (mode === 'signin' || mode === 'signup') passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) toast.error(error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        track('sign_in_started', { method: 'password' });
        const { error } = await signIn(normalizedEmail, password);
        if (error) {
          toast.error(getFriendlyAuthError(error, 'Sign-in failed. Check your details or request a secure sign-in link.'));
          return;
        }
        track('sign_in_completed', { method: 'password' });
        toast.success('Welcome back. Loading your dashboard…');
        onOpenChange(false);
        navigate(DASHBOARD_PATH, { replace: true });
        return;
      }

      if (mode === 'signup') {
        const { error, needsEmailConfirmation } = await signUp(normalizedEmail, password, displayName);
        if (error) {
          toast.error(getFriendlyAuthError(error, 'The account could not be created. Try signing in or recovering access.'));
          return;
        }
        void captureLead({
          email: normalizedEmail,
          firstName: displayName || undefined,
          source: 'auth_modal_signup',
          planInterest: 'free',
          activityType: 'account_created',
          activityData: { method: 'email' },
        });
        track('account_created', { method: 'email', confirmation_required: needsEmailConfirmation });
        if (needsEmailConfirmation) {
          setMode('resend-confirmation');
          setNotice('Check your inbox to confirm your email. Your dashboard will open after confirmation.');
          try { localStorage.setItem('rtd-install-prompt-pending', '1'); } catch { /* noop */ }
          return;
        }
        toast.success('Account created. Opening your dashboard…');
        onOpenChange(false);
        navigate(DASHBOARD_PATH, { replace: true });
        return;
      }

      if (mode === 'magic-link') {
        const { error } = await sendSignInLink(normalizedEmail);
        if (error) console.warn('[Auth] sign-in link request was not completed:', error.message);
        track('account_access_link_requested', { method: 'magic_link' });
        setNotice('If this email belongs to an account, a secure sign-in link is on its way. Check spam if it does not arrive.');
        return;
      }

      if (mode === 'forgot-password') {
        const { error } = await requestPasswordReset(normalizedEmail);
        if (error) console.warn('[Auth] password recovery request was not completed:', error.message);
        track('account_access_link_requested', { method: 'password_recovery' });
        setNotice('If this email belongs to an account, a recovery link is on its way. Your dashboard records will not change.');
        return;
      }

      const { error } = await resendConfirmation(normalizedEmail);
      if (error) console.warn('[Auth] confirmation resend was not completed:', error.message);
      track('account_access_link_requested', { method: 'confirmation_resend' });
      setNotice('If confirmation is still required, a fresh link is on its way. Check spam if it does not arrive.');
    } finally {
      setIsLoading(false);
    }
  };

  const isPrimaryMode = mode === 'signin' || mode === 'signup';
  const copy = MODE_COPY[mode];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-sm w-[calc(100%-2rem)] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-center text-foreground">{copy.title}</DialogTitle>
          <DialogDescription className="text-center">{copy.description}</DialogDescription>
        </DialogHeader>

        {notice && (
          <div role="status" className="flex gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{notice}</span>
          </div>
        )}

        {isPrimaryMode && (
          <>
            <div className="space-y-2">
              {providers.google && (
                <Button type="button" variant="outline" className="w-full h-12 gap-2 text-base" onClick={() => void handleOAuth('google')} disabled={oauthLoading !== null}>
                  {oauthLoading === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Continue with Google
                </Button>
              )}

              {providers.apple && (
                <Button type="button" variant="outline" className="w-full h-12 gap-2 text-base" onClick={() => void handleOAuth('apple')} disabled={oauthLoading !== null}>
                  {oauthLoading === 'apple' ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
                  )}
                  Continue with Apple
                </Button>
              )}

              {!providers.apple && mode === 'signin' && (
                <button type="button" className="w-full rounded-lg bg-muted/60 px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground" onClick={() => changeMode('magic-link')}>
                  Previously used Apple? Restore the same account with a secure email sign-in link.
                </button>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with email</span></div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm flex items-center gap-2"><User size={14} />Display name</Label>
              <Input id="displayName" type="text" autoComplete="name" placeholder="Your name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="auth-email" className="text-sm flex items-center gap-2"><Mail size={14} />Email</Label>
            <Input id="auth-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>

          {(mode === 'signin' || mode === 'signup') && (
            <div className="space-y-2">
              <Label htmlFor="auth-password" className="text-sm flex items-center gap-2"><Lock size={14} />Password</Label>
              <Input id="auth-password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
          )}

          <Button type="submit" className="w-full min-h-12 text-base font-semibold" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (mode === 'forgot-password' ? <KeyRound className="mr-2 h-4 w-4" /> : null)}
            {copy.submit}
          </Button>

          {mode === 'signin' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button type="button" onClick={() => changeMode('forgot-password')} className="rounded-lg p-2 text-primary hover:bg-primary/5">Forgot password?</button>
              <button type="button" onClick={() => changeMode('magic-link')} className="rounded-lg p-2 text-primary hover:bg-primary/5">Email sign-in link</button>
              <button type="button" onClick={() => changeMode('resend-confirmation')} className="col-span-2 rounded-lg p-2 text-muted-foreground hover:bg-muted">Resend confirmation email</button>
            </div>
          )}

          {mode === 'signup' ? (
            <p className="text-center text-sm text-muted-foreground">Already have an account? <button type="button" onClick={() => changeMode('signin')} className="text-primary hover:underline">Sign in</button></p>
          ) : mode === 'signin' ? (
            <p className="text-center text-sm text-muted-foreground">New to the app? <button type="button" onClick={() => changeMode('signup')} className="text-primary hover:underline">Create account</button></p>
          ) : (
            <button type="button" onClick={() => changeMode('signin')} className="w-full text-center text-sm text-primary hover:underline">Back to sign in</button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

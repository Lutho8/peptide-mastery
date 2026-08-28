import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DASHBOARD_PATH } from '@/lib/authRedirect';
import { getFriendlyAuthError } from '@/lib/authErrors';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { session, updatePassword } = useAuth();
  const [isPreparing, setIsPreparing] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code && !session) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelled) toast.error(getFriendlyAuthError(error, 'This recovery link is invalid or has expired. Request a new one.'));
          if (!cancelled) setIsPreparing(false);
          return;
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      if (!cancelled) setIsPreparing(false);
    };

    void prepare();
    return () => { cancelled = true; };
  }, [session]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error('Use at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('The passwords do not match.');
      return;
    }

    setIsSaving(true);
    const { error } = await updatePassword(password);
    setIsSaving(false);
    if (error) {
      toast.error(getFriendlyAuthError(error, 'Your password could not be updated. Request a new recovery link.'));
      return;
    }
    setComplete(true);
  };

  if (isPreparing) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <section className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        {complete ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Password updated</h1>
            <p className="text-sm text-muted-foreground">Your account and saved dashboard data are ready.</p>
            <Button className="w-full" onClick={() => navigate(DASHBOARD_PATH, { replace: true })}>Open my dashboard</Button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="text-center">
              <KeyRound className="mx-auto mb-3 h-9 w-9 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Create a new password</h1>
              <p className="mt-2 text-sm text-muted-foreground">This also restores email access for accounts previously created with Apple.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            </div>
            <Button type="submit" className="w-full min-h-12" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save password
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}

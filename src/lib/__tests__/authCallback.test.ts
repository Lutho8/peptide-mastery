import { describe, expect, it, vi } from 'vitest';
import { isAuthCallbackLocation, resolveAuthCallback } from '@/lib/authCallback';

describe('authentication callback contract', () => {
  it('detects canonical and legacy callbacks without mistaking normal pages for callbacks', () => {
    expect(isAuthCallbackLocation('/auth/callback', '')).toBe(true);
    expect(isAuthCallbackLocation('/auth/callback/', '?code=abc')).toBe(true);
    expect(isAuthCallbackLocation('/', '?code=legacy-code')).toBe(true);
    expect(isAuthCallbackLocation('/', '?error=access_denied')).toBe(true);
    expect(isAuthCallbackLocation('/dashboard', '?code=not-a-callback-here')).toBe(false);
    expect(isAuthCallbackLocation('/', '?utm_source=email')).toBe(false);
  });

  it('exchanges an OAuth code and always returns to the first-party dashboard', async () => {
    const exchange = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'existing-user' } } }, error: null });
    const outcome = await resolveAuthCallback('?code=valid-code', exchange);

    expect(exchange).toHaveBeenCalledWith('valid-code');
    expect(outcome.status).toBe('success');
    expect(outcome.reason).toBe('signed_in');
    expect(new URL(outcome.redirectTo, window.location.origin).pathname).toBe('/dashboard');
    expect(outcome.redirectTo).not.toContain('peptide-south-africa.com');
  });

  it('routes a verified password recovery to password setup, not the dashboard or store', async () => {
    const exchange = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'email-user' } } }, error: null });
    const outcome = await resolveAuthCallback('?code=recovery-code&flow=password-recovery', exchange);

    expect(outcome).toMatchObject({
      status: 'success',
      reason: 'password_recovery',
      redirectTo: '/reset-password',
    });
  });

  it.each([
    ['?error=access_denied&error_description=raw-provider-detail', 'provider_error'],
    ['', 'missing_code'],
  ])('handles invalid callback %s with safe customer copy', async (search, reason) => {
    const exchange = vi.fn();
    const outcome = await resolveAuthCallback(search, exchange);

    expect(outcome.status).toBe('error');
    expect(outcome.reason).toBe(reason);
    expect(outcome.redirectTo).toBe('/');
    expect(outcome.message).not.toMatch(/sql|column|token|raw-provider-detail/i);
    expect(exchange).not.toHaveBeenCalled();
  });

  it('handles exchange failures without leaking Supabase or database internals', async () => {
    const exchange = vi.fn().mockResolvedValue({
      data: { session: null },
      error: { message: 'sql: scan error on confirmation_token column' },
    });
    const outcome = await resolveAuthCallback('?code=broken-code', exchange);

    expect(outcome.reason).toBe('exchange_error');
    expect(outcome.message).not.toMatch(/sql|scan|column|confirmation_token/i);
  });

  it('rejects a callback that exchanges without establishing a session', async () => {
    const exchange = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
    const outcome = await resolveAuthCallback('?code=no-session', exchange);

    expect(outcome).toMatchObject({ status: 'error', reason: 'missing_session', redirectTo: '/' });
  });

  it('handles unexpected exchange failures with a recoverable route', async () => {
    const exchange = vi.fn().mockRejectedValue(new Error('network unavailable'));
    const outcome = await resolveAuthCallback('?code=network-error', exchange);

    expect(outcome).toMatchObject({ status: 'error', reason: 'unexpected_error', redirectTo: '/' });
    expect(outcome.message).not.toContain('network unavailable');
  });
});

import { getDashboardHref, PASSWORD_RECOVERY_PATH } from '@/lib/authRedirect';

export type AuthCodeExchange = (code: string) => Promise<{
  data: { session: unknown | null };
  error: { message?: string } | null;
}>;

export interface AuthCallbackOutcome {
  status: 'success' | 'error';
  message: string;
  redirectTo: string;
  reason:
    | 'signed_in'
    | 'password_recovery'
    | 'provider_error'
    | 'missing_code'
    | 'exchange_error'
    | 'missing_session'
    | 'unexpected_error';
}

/**
 * Keep callback detection in one place so BrowserRouter, HashRouter and legacy
 * root callbacks cannot drift into different sign-in behaviour.
 */
export function isAuthCallbackLocation(pathname: string, search: string): boolean {
  if (pathname === '/auth/callback' || pathname === '/auth/callback/') return true;
  if (pathname !== '/' && pathname !== '') return false;

  const params = new URLSearchParams(search);
  return params.has('code') || params.has('error') || params.has('error_description');
}

/**
 * Resolve every callback state without exposing provider or database internals
 * to the interface. This pure boundary is intentionally covered by the fast
 * authentication CI gate.
 */
export async function resolveAuthCallback(
  search: string,
  exchangeCodeForSession: AuthCodeExchange,
): Promise<AuthCallbackOutcome> {
  const params = new URLSearchParams(search);
  const providerError = params.get('error');
  const code = params.get('code');
  const isPasswordRecovery = params.get('flow') === 'password-recovery';

  if (providerError) {
    return {
      status: 'error',
      message: 'We could not complete sign-in. Please try again or use an email sign-in link.',
      redirectTo: '/',
      reason: 'provider_error',
    };
  }

  if (!code) {
    return {
      status: 'error',
      message: 'This sign-in link is incomplete or has already been used. Please start again.',
      redirectTo: '/',
      reason: 'missing_code',
    };
  }

  try {
    const { data, error } = await exchangeCodeForSession(code);
    if (error) {
      return {
        status: 'error',
        message: 'We could not complete sign-in. Please try again or use an email sign-in link.',
        redirectTo: '/',
        reason: 'exchange_error',
      };
    }

    if (!data.session) {
      return {
        status: 'error',
        message: 'Authentication was not completed. Please start sign-in again.',
        redirectTo: '/',
        reason: 'missing_session',
      };
    }

    if (isPasswordRecovery) {
      return {
        status: 'success',
        message: 'Recovery verified. Opening password setup…',
        redirectTo: PASSWORD_RECOVERY_PATH,
        reason: 'password_recovery',
      };
    }

    return {
      status: 'success',
      message: 'Signed in successfully. Opening your dashboard…',
      redirectTo: getDashboardHref(),
      reason: 'signed_in',
    };
  } catch {
    return {
      status: 'error',
      message: 'Something went wrong. Please start sign-in again.',
      redirectTo: '/',
      reason: 'unexpected_error',
    };
  }
}

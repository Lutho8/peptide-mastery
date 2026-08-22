// Native Supabase OAuth. Replaces the former @lovable.dev/cloud-auth-js wrapper
// (src/integrations/lovable/index.ts), which routed sign-in through Lovable
// Cloud's hosted OAuth broker.
//
// Provider credentials now live in your own Supabase project:
//   Authentication -> Providers -> Google / Apple
// and the allowed return URLs in:
//   Authentication -> URL Configuration (Site URL + Redirect URLs)

import type { Provider } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';

export type SupportedProvider = Extract<Provider, 'google' | 'apple'>;

export type SignInOptions = {
  /** Where the provider should send the browser back to. Defaults to the current origin. */
  redirectTo?: string;
  /** Extra query params forwarded to the provider's authorize endpoint. */
  queryParams?: Record<string, string>;
  /** Additional OAuth scopes, space separated. */
  scopes?: string;
};

export type SignInResult = {
  /** True once the browser has been handed off to the provider. */
  redirected: boolean;
  error: Error | null;
};

/**
 * Starts an OAuth sign-in against the project's own Supabase Auth.
 *
 * Supabase performs a full-page redirect to the provider and back to
 * `redirectTo`. The client picks the session up from the URL fragment on
 * return (`detectSessionInUrl`, on by default), so there is no token
 * hand-off to perform here.
 */
export async function signInWithOAuth(
  provider: SupportedProvider,
  opts: SignInOptions = {}
): Promise<SignInResult> {
  const redirectTo =
    opts.redirectTo ??
    (typeof window !== 'undefined' ? window.location.origin : undefined);

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      scopes: opts.scopes,
      queryParams: opts.queryParams,
    },
  });

  if (error) {
    return { redirected: false, error };
  }

  return { redirected: true, error: null };
}

export const auth = { signInWithOAuth };

export function getFriendlyAuthError(error: unknown, fallback = 'We could not complete that request. Please try again.'): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'The email or password is incorrect. You can also request a secure sign-in link.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email before signing in. You can resend the confirmation below.';
  }
  if (normalized.includes('already registered') || normalized.includes('user already exists')) {
    return 'An account already exists for this email. Sign in or recover access instead.';
  }
  if (normalized.includes('provider is not enabled') || normalized.includes('unsupported provider')) {
    return 'That sign-in method is temporarily unavailable. Use your email sign-in link instead.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Too many attempts were made. Please wait a few minutes and try again.';
  }
  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'We could not reach the sign-in service. Check your connection and try again.';
  }

  // Never expose SQL, token, stack, or provider internals to customers.
  if (/sql|token|database|column|scan error|unsupported/i.test(message)) {
    return fallback;
  }

  return fallback;
}

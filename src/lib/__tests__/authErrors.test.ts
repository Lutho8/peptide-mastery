import { describe, expect, it } from 'vitest';
import { getFriendlyAuthError } from '@/lib/authErrors';

describe('getFriendlyAuthError', () => {
  it('maps common access errors to actionable customer copy', () => {
    expect(getFriendlyAuthError(new Error('Invalid login credentials'))).toContain('email or password');
    expect(getFriendlyAuthError(new Error('Email not confirmed'))).toContain('confirm your email');
  });

  it('never exposes database internals', () => {
    const message = getFriendlyAuthError(new Error('sql: scan error on confirmation_token column'));
    expect(message).not.toMatch(/sql|column|token/i);
  });
});

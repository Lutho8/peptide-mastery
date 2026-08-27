import { describe, expect, it } from 'vitest';
import { AUTH_CALLBACK_PATH, DASHBOARD_PATH, getDashboardHref, getOAuthCallbackUrl } from '@/lib/authRedirect';

describe('auth redirect destinations', () => {
  it('uses a first-party callback and dashboard path', () => {
    expect(AUTH_CALLBACK_PATH).toBe('/auth/callback');
    expect(DASHBOARD_PATH).toBe('/dashboard');
    expect(new URL(getOAuthCallbackUrl()).pathname).toBe('/auth/callback');
    expect(new URL(getDashboardHref()).pathname).toBe('/dashboard');
  });

  it('never points authentication at the commerce domain', () => {
    expect(getOAuthCallbackUrl()).not.toContain('peptide-south-africa.com');
    expect(getDashboardHref()).not.toContain('peptide-south-africa.com');
  });
});

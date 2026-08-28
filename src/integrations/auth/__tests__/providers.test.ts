import { afterEach, describe, expect, it, vi } from 'vitest';

describe('live auth provider availability contract', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('shows only providers confirmed as enabled by Supabase Auth', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ external: { email: true, google: true, apple: false } }),
    }));

    const { getAuthProviderAvailability } = await import('@/integrations/auth/providers');
    await expect(getAuthProviderAvailability()).resolves.toEqual({ email: true, google: true, apple: false });
  });

  it('does not advertise Apple when the provider check is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')));

    const { getAuthProviderAvailability } = await import('@/integrations/auth/providers');
    await expect(getAuthProviderAvailability()).resolves.toEqual({ email: true, google: true, apple: false });
  });

  it('can expose Apple only after Supabase confirms it is enabled', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ external: { email: true, google: true, apple: true } }),
    }));

    const { getAuthProviderAvailability } = await import('@/integrations/auth/providers');
    await expect(getAuthProviderAvailability()).resolves.toEqual({ email: true, google: true, apple: true });
  });
});

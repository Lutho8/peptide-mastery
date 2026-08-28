import {
  OWNED_SUPABASE_PUBLISHABLE_KEY,
  OWNED_SUPABASE_URL,
} from '@/integrations/supabase/public-config';

export interface AuthProviderAvailability {
  email: boolean;
  google: boolean;
  apple: boolean;
}

const FALLBACK: AuthProviderAvailability = {
  email: true,
  google: true,
  apple: false,
};

let cached: AuthProviderAvailability | null = null;

export async function getAuthProviderAvailability(): Promise<AuthProviderAvailability> {
  if (cached) return cached;

  try {
    const response = await fetch(`${OWNED_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: OWNED_SUPABASE_PUBLISHABLE_KEY },
    });
    if (!response.ok) return FALLBACK;

    const settings = await response.json() as {
      external?: Record<string, boolean>;
      disable_signup?: boolean;
    };
    cached = {
      email: settings.external?.email !== false,
      google: settings.external?.google === true,
      apple: settings.external?.apple === true,
    };
    return cached;
  } catch {
    return FALLBACK;
  }
}

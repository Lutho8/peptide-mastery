export const DASHBOARD_PATH = '/dashboard';
export const AUTH_CALLBACK_PATH = '/auth/callback';

function usesHashRouting(): boolean {
  const flag = import.meta.env.VITE_ROUTER as string | undefined;
  if (flag === 'hash') return true;
  if (flag === 'browser') return false;
  if (typeof window === 'undefined') return false;

  const runtime = window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean };
  };
  return runtime.Capacitor?.isNativePlatform?.() === true || window.location.protocol === 'file:';
}

/** Exact OAuth return URL that must be allow-listed in Supabase Auth. */
export function getOAuthCallbackUrl(): string {
  if (typeof window === 'undefined') return AUTH_CALLBACK_PATH;
  return new URL(AUTH_CALLBACK_PATH, window.location.origin).toString();
}

/** Full dashboard URL for redirects performed outside React Router. */
export function getDashboardHref(): string {
  if (typeof window === 'undefined') return DASHBOARD_PATH;
  return usesHashRouting()
    ? `${window.location.origin}/#${DASHBOARD_PATH}`
    : new URL(DASHBOARD_PATH, window.location.origin).toString();
}

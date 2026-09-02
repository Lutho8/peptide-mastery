import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/hooks/useAccessControl';

function RouteLoadingScreen() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
      aria-label="Checking account access"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
    </div>
  );
}

function SignInRedirect() {
  const location = useLocation();

  return (
    <Navigate
      to="/"
      replace
      state={{
        openAuth: true,
        requestedPath: `${location.pathname}${location.search}${location.hash}`,
      }}
    />
  );
}

/** Keeps authenticated account routes out of the guest-facing route tree. */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <RouteLoadingScreen />;
  if (!user) return <SignInRedirect />;

  return <Outlet />;
}

/**
 * Protects admin pages with both a valid Supabase session and the server-backed
 * user_roles check. Database RLS remains the authoritative data boundary.
 */
export function AdminRoute() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useAccessControl();

  if (authLoading || (user && roleLoading)) return <RouteLoadingScreen />;
  if (!user) return <SignInRedirect />;
  if (!isAdmin) return <Navigate to="/dashboard" replace state={{ accessDenied: 'admin' }} />;

  return <Outlet />;
}

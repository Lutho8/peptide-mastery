import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminRoute, ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/hooks/useAccessControl';

vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/hooks/useAccessControl', () => ({ useAccessControl: vi.fn() }));

const mockUseAuth = vi.mocked(useAuth);
const mockUseAccessControl = vi.mocked(useAccessControl);

function LandingState() {
  const location = useLocation();
  const state = location.state as { openAuth?: boolean; requestedPath?: string } | null;
  return <div>landing:{String(state?.openAuth)}:{state?.requestedPath}</div>;
}

function renderGuard(guard: ReactNode, initialPath = '/inventory?view=low-stock') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={guard}>
          <Route path="*" element={<div>private content</div>} />
        </Route>
        <Route path="/" element={<LandingState />} />
        <Route path="/dashboard" element={<div>dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Supabase route guards', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: null, session: null, isLoading: false } as ReturnType<typeof useAuth>);
    mockUseAccessControl.mockReturnValue({
      hasAccess: false,
      isAdmin: false,
      isLoading: false,
    });
  });

  it('waits for Supabase session restoration before choosing a route', () => {
    mockUseAuth.mockReturnValue({ user: null, session: null, isLoading: true } as ReturnType<typeof useAuth>);

    renderGuard(<ProtectedRoute />);

    expect(screen.getByRole('status', { name: 'Checking account access' })).toBeInTheDocument();
    expect(screen.queryByText('private content')).not.toBeInTheDocument();
  });

  it('sends guests to the landing sign-in flow and remembers the requested path', () => {
    renderGuard(<ProtectedRoute />);

    expect(screen.getByText('landing:true:/inventory?view=low-stock')).toBeInTheDocument();
  });

  it('renders private account routes for an authenticated Supabase user', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'account-user' },
      session: { access_token: 'token' },
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    renderGuard(<ProtectedRoute />);

    expect(screen.getByText('private content')).toBeInTheDocument();
  });

  it('redirects signed-in non-admin users away from admin routes', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'account-user' },
      session: { access_token: 'token' },
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    renderGuard(<AdminRoute />, '/admin');

    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('renders admin routes only after the database role check succeeds', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-user' },
      session: { access_token: 'token' },
      isLoading: false,
    } as ReturnType<typeof useAuth>);
    mockUseAccessControl.mockReturnValue({ hasAccess: true, isAdmin: true, isLoading: false });

    renderGuard(<AdminRoute />, '/admin');

    expect(screen.getByText('private content')).toBeInTheDocument();
  });
});

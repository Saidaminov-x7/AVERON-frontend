import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '@/store/useAuthStore';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
  useParams: () => ({ locale: 'ru' }),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/ru/profile');
  });

  it('shows loading spinner while auth state is resolving', () => {
    useAuthStore.setState({ isLoading: true, isAuthenticated: false, user: null });
    render(
      <ProtectedRoute>
        <div>Секретный профиль</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    expect(screen.queryByText('Секретный профиль')).not.toBeInTheDocument();
  });

  it('redirects to login with a localized internal return target if unauthenticated', () => {
    useAuthStore.setState({ isLoading: false, isAuthenticated: false, user: null });
    render(
      <ProtectedRoute>
        <div>Секретный профиль</div>
      </ProtectedRoute>
    );

    expect(pushMock).toHaveBeenCalledWith('/ru/login?returnTo=%2Fru%2Fprofile');
    expect(screen.queryByText('Секретный профиль')).not.toBeInTheDocument();
  });

  it('preserves validated query and fragment when redirecting a protected route to login', () => {
    window.history.replaceState({}, '', '/ru/outfits?product=fixture-review-shirt#selected-item');
    useAuthStore.setState({ isLoading: false, isAuthenticated: false, user: null });

    render(
      <ProtectedRoute>
        <div>Секретный профиль</div>
      </ProtectedRoute>
    );

    expect(pushMock).toHaveBeenCalledWith(
      '/ru/login?returnTo=%2Fru%2Foutfits%3Fproduct%3Dfixture-review-shirt%23selected-item',
    );
  });

  it('renders children when authenticated', () => {
    useAuthStore.setState({
      isLoading: false,
      isAuthenticated: true,
      user: { id: 'user-1', name: 'Alisher' },
    });

    render(
      <ProtectedRoute>
        <div>Секретный профиль</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Секретный профиль')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});

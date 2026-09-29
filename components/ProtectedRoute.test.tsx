import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '@/store/useAuthStore';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/profile',
  useParams: () => ({ locale: 'ru' }),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('redirects to login with return redirect if user is unauthenticated', () => {
    useAuthStore.setState({ isLoading: false, isAuthenticated: false, user: null });
    render(
      <ProtectedRoute>
        <div>Секретный профиль</div>
      </ProtectedRoute>
    );

    expect(pushMock).toHaveBeenCalledWith('/ru/login?redirect=%2Fprofile');
    expect(screen.queryByText('Секретный профиль')).not.toBeInTheDocument();
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

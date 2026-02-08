import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import MainLayout from './MainLayout';
import { ThemeProvider } from '../utils/theme.tsx';

const mockAuth = {
  appUser: null as null | { email: string; role: string },
  signOut: vi.fn(),
};

vi.mock('./AuthContext', () => ({
  useAuth: () => mockAuth,
}));

describe('MainLayout role menu', () => {
  it('shows only My Orders for wholesalers', async () => {
    mockAuth.appUser = { email: 'w@test.local', role: 'WHOLESALER' };
    await act(async () => {
      render(
        <ThemeProvider>
          <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <MainLayout />
          </MemoryRouter>
        </ThemeProvider>
      );
    });
    expect(screen.getByText('My Orders')).toBeInTheDocument();
    expect(screen.queryByText('Products')).not.toBeInTheDocument();
    expect(screen.queryByText('Dispatches')).not.toBeInTheDocument();
  });

  it('shows admin menus for internal users', async () => {
    mockAuth.appUser = { email: 'e@test.local', role: 'EMPLOYEE' };
    await act(async () => {
      render(
        <ThemeProvider>
          <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <MainLayout />
          </MemoryRouter>
        </ThemeProvider>
      );
    });
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Dispatches')).toBeInTheDocument();
  });
});

import { useEffect } from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, useTheme, type ThemeMode } from './theme.tsx';

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();
});

function ThemeProbe({ mode }: { mode: ThemeMode }) {
  const { setMode } = useTheme();
  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);
  return null;
}

function ThemeReader() {
  useTheme();
  return null;
}

describe('theme system', () => {
  it('applies stored dark mode on mount', () => {
    localStorage.setItem('ims_theme_mode', 'dark');
    render(
      <ThemeProvider>
        <ThemeReader />
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('switches to light mode and updates dataset', () => {
    render(
      <ThemeProvider>
        <ThemeProbe mode="light" />
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});

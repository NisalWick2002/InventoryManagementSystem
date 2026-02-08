import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntdApp, theme as antdTheme } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { AuthProvider } from './app/AuthContext';
import ErrorBoundary from './app/ErrorBoundary';
import { ThemeProvider, useTheme } from './utils/theme.tsx';
import './styles/theme.css';

function AppRoot() {
  const { resolvedTheme } = useTheme();
  const theme = useMemo(
    () => ({
      algorithm: resolvedTheme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: '#0F766E',
        colorSuccess: '#16A34A',
        colorError: '#DC2626',
        colorWarning: '#F59E0B',
        borderRadius: 8,
      },
    }),
    [resolvedTheme]
  );

  return (
    <ConfigProvider theme={theme}>
      <AntdApp>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppRoot />
    </ThemeProvider>
  </React.StrictMode>
);

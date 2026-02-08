import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@firebase/app': path.resolve(__dirname, '../node_modules/@firebase/app/dist/esm/index.esm.js'),
      '@firebase/auth': path.resolve(__dirname, '../node_modules/@firebase/auth/dist/esm/index.js'),
    },
  },
  optimizeDeps: {
    // Avoid esbuild pre-bundle resolution issues with Firebase internals on Windows.
    exclude: ['firebase', '@firebase/app', '@firebase/auth'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          const parts = id.split('node_modules/')[1];
          if (!parts) return;
          const pkgName = parts.startsWith('@') ? parts.split('/').slice(0, 2).join('/') : parts.split('/')[0];
          if (['react', 'react-dom', 'react-router', 'react-router-dom', '@remix-run/router', 'scheduler', 'use-sync-external-store'].includes(pkgName)) {
            return 'react';
          }
          if (pkgName === 'antd') {
            return 'antd';
          }
          if (pkgName.startsWith('@ant-design') || pkgName.startsWith('rc-') || pkgName.startsWith('@rc-component') || pkgName === 'dayjs' || pkgName === 'classnames') {
            return 'antd-rc';
          }
          if (pkgName === 'firebase' || pkgName.startsWith('@firebase') || pkgName === 'idb') {
            return 'firebase';
          }
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});

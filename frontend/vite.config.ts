/**
 * Vite Configuration
 * Support pour React + Service Worker PWA
 */

// @ts-nocheck - Vite optionnel (projet peut utiliser react-scripts ou Vite)
import { defineConfig } from 'vite';
// @ts-ignore - Vitesse chargement, pas besoin de types stricts
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  
  server: {
    port: 3000,
    strictPort: false,
    open: true,
    headers: {
      'Cache-Control': 'no-store',
      'Service-Worker-Allowed': '/',
    },
  },
});

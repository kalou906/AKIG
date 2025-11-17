import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/colors.css';
import App from './App';

console.log('🚀 AKIG Frontend - Starting initialization...');

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}

const container = document.getElementById('root');
if (!container) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

console.log('✅ Root container found, mounting React...');

createRoot(container).render(
  <App />
);

console.log('✅ React mounted successfully!');

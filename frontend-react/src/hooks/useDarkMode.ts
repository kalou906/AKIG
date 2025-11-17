// frontend-react/src/hooks/useDarkMode.ts
/**
 * Hook React pour Dark Mode
 * - Persiste le choix dans localStorage
 * - Détecte les préférences système
 * - Toggle simple avec classe CSS
 */
import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Vérifier localStorage d'abord
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    
    // Sinon, détecter les préférences système
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Écouter les changements système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    isDark,
    toggle: () => setIsDark(!isDark),
    enable: () => setIsDark(true),
    disable: () => setIsDark(false),
  };
}

import React, { useEffect, useState } from 'react';

interface DarkModeToggleProps {
  className?: string;
}

/**
 * Dark mode toggle component
 * Respects system preference and stores user choice in localStorage
 */
export function DarkModeToggle({ className = '' }: DarkModeToggleProps) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('akig-dark-mode');
    if (stored !== null) {
      return stored === 'true';
    }

    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode class to document element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Persist to localStorage
    localStorage.setItem('akig-dark-mode', String(isDark));
  }, [isDark]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('akig-dark-mode');
      // Only auto-update if user hasn't set a preference
      if (stored === null) {
        setIsDark(e.matches);
      }
    };

    // Use addEventListener for better browser support
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleToggle = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <button
      type="button"
      className={`btn ${className}`}
      onClick={handleToggle}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? '🌙 Sombre' : '☀️ Clair'}
    </button>
  );
}

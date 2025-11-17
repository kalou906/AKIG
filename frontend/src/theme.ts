/**
 * Theme configuration for light and dark modes
 */

export const themes = {
  light: {
    bg: '#fff',
    text: '#111',
    border: '#e0e0e0',
    hover: '#f5f5f5',
    shadow: 'rgba(0, 0, 0, 0.1)',
    primary: '#0b5',
    secondary: '#666',
  },
  dark: {
    bg: '#121212',
    text: '#eee',
    border: '#333',
    hover: '#1e1e1e',
    shadow: 'rgba(0, 0, 0, 0.3)',
    primary: '#0b5',
    secondary: '#aaa',
  },
};

export type ThemeType = 'light' | 'dark' | 'auto';

export interface Theme {
  bg: string;
  text: string;
  border: string;
  hover: string;
  shadow: string;
  primary: string;
  secondary: string;
}

/**
 * Get the active theme based on preference or system settings
 */
export const getActiveTheme = (preference: ThemeType): 'light' | 'dark' => {
  if (preference === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return preference as 'light' | 'dark';
};

/**
 * Apply theme to document root
 */
export const applyTheme = (themeName: 'light' | 'dark'): void => {
  const theme = themes[themeName];
  const root = document.documentElement;

  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  root.setAttribute('data-theme', themeName);
};

/**
 * CSS variables for theming
 */
export const themeVars = {
  light: `
    --color-bg: ${themes.light.bg};
    --color-text: ${themes.light.text};
    --color-border: ${themes.light.border};
    --color-hover: ${themes.light.hover};
    --color-shadow: ${themes.light.shadow};
    --color-primary: ${themes.light.primary};
    --color-secondary: ${themes.light.secondary};
  `,
  dark: `
    --color-bg: ${themes.dark.bg};
    --color-text: ${themes.dark.text};
    --color-border: ${themes.dark.border};
    --color-hover: ${themes.dark.hover};
    --color-shadow: ${themes.dark.shadow};
    --color-primary: ${themes.dark.primary};
    --color-secondary: ${themes.dark.secondary};
  `,
};

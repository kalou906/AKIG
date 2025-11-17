/**
 * AKIG Theme Configuration
 * Exports design tokens and color schemes
 */

export const akigTheme = {
  colors: {
    primary: '#0F2557',
    primaryDeep: '#0B1F4B',
    secondary: '#1e40af',
    accent: '#F59E0B',
    overlay: 'rgba(15, 37, 87, 0.15)',
    
    // Status colors
    success: '#0EA5E9',
    warning: '#F59E0B',
    error: '#DC2626',
    info: '#3B82F6',

    flag: {
      red: '#CE1126',
      yellow: '#FCD116',
      green: '#009460',
    },
    
    // Background
    bg: '#F5F7FB',
    bgLight: '#FFFFFF',
    bgHover: '#F3F4F6',
    
    // Text
    text: '#0A0A0A',
    textMuted: '#4B5563',
    textLight: '#6B7280',
    
    // Borders
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
  },
  
  typography: {
    fontFamily: {
      sans: "'Montserrat', 'Inter', sans-serif",
      heading: "'Poppins', 'Montserrat', sans-serif",
      display: "'Montserrat Alternates', 'Poppins', sans-serif",
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    lineHeight: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
    premium: '0 10px 30px rgba(15, 37, 87, 0.15)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  },
  
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  gradients: {
    hero: 'radial-gradient(circle at top right, rgba(15,37,87,0.18), transparent 55%), linear-gradient(135deg, rgba(15,37,87,0.92), rgba(198,40,40,0.88))',
    flagBand: 'linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #FCD116 33.34%, #FCD116 66.66%, #009460 66.67%)',
    flagDiagonal: 'linear-gradient(135deg, #CE1126 0%, #CE1126 32%, #FCD116 32%, #FCD116 66%, #009460 66%, #009460 100%)',
  },

  containers: {
    defaultPadding: {
      base: '1.5rem',
      md: '2rem',
      lg: '2.5rem',
      xl: '3rem',
      '2xl': '4rem',
    },
    maxWidth: {
      content: '72rem',
      contentWide: '80rem',
      screen3xl: '120rem',
    },
  },
};

/**
 * Status Color Map
 */
export const statusColors = {
  success: {
    bg: '#D1FAE5',
    border: '#6EE7B7',
    text: '#059669',
  },
  warning: {
    bg: '#FEF3C7',
    border: '#FCD34D',
    text: '#D97706',
  },
  error: {
    bg: '#FEE2E2',
    border: '#FECACA',
    text: '#DC2626',
  },
  info: {
    bg: '#DBEAFE',
    border: '#93C5FD',
    text: '#1E40AF',
  },
} as const;

/**
 * Component Size Presets
 */
export const sizes = {
  button: {
    sm: {
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      borderRadius: '0.5rem',
    },
    md: {
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      borderRadius: '0.5rem',
    },
    lg: {
      padding: '1rem 1.5rem',
      fontSize: '1.125rem',
      borderRadius: '0.75rem',
    },
  },
  
  input: {
    sm: {
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      borderRadius: '0.375rem',
    },
    md: {
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      borderRadius: '0.5rem',
    },
    lg: {
      padding: '1rem 1.25rem',
      fontSize: '1.125rem',
      borderRadius: '0.75rem',
    },
  },
  
  card: {
    sm: {
      padding: '1rem',
      borderRadius: '0.5rem',
    },
    md: {
      padding: '1.5rem',
      borderRadius: '0.75rem',
    },
    lg: {
      padding: '2rem',
      borderRadius: '1rem',
    },
  },
} as const;

/**
 * Get responsive value
 * @example getResponsive({ sm: '100%', md: '50%', lg: '33%' })
 */
export function getResponsive(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([bp, val]) => `${bp}:${val}`)
    .join(' ');
}

/**
 * Merge class names with theme
 * @example cn('btn', isActive && 'btn-primary')
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get theme color with opacity
 * @example getColor('primary', 0.5) → 'rgba(15, 37, 87, 0.5)'
 */
export function getColor(colorName: Exclude<keyof typeof akigTheme.colors, 'flag'>, opacity: number = 1): string {
  const hex = akigTheme.colors[colorName];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default akigTheme;

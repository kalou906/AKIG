import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        akig: {
          blue: '#0B1F4B',
          blueDark: '#071334',
          red: '#C62828',
          gold: '#F59E0B',
          gray: '#64748B',
          bg: '#F5F7FB'
        }
      },
      fontFamily: {
        sans: ['"Montserrat"', '"Segoe UI"', 'sans-serif'],
        heading: ['"Poppins"', '"Montserrat"', 'sans-serif']
      },
      boxShadow: {
        premium: '0 20px 45px rgba(15, 37, 87, 0.2)'
      },
      borderRadius: {
        xl: '20px'
      }
    }
  },
  plugins: []
};

export default config;

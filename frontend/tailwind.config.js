/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0a',          // Main background
          surface: '#1a1a1a',     // Cards, panels
          elevated: '#2a2a2a',    // Hover states, inputs
          border: '#333333',      // Borders, dividers
        },
        orange: {
          DEFAULT: '#ff5722',     // Primary CTA
          hover: '#ff7043',       // Hover state
          light: '#ff8a65',       // Light accents
          dark: '#cf4600',        // Active/pressed state
        },
        text: {
          primary: '#ffffff',     // Primary text
          secondary: '#e5e5e5',   // Secondary text
          muted: '#b3b3b3',       // Muted/disabled text
        },
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        'gradient-hero-orange': 'radial-gradient(ellipse at top right, rgba(255, 87, 34, 0.15) 0%, transparent 50%)',
        'gradient-card-hover': 'linear-gradient(135deg, rgba(255, 87, 34, 0.1) 0%, transparent 100%)',
        'gradient-cta': 'linear-gradient(135deg, #ff5722 0%, #ff7043 100%)',
        'gradient-cta-hover': 'linear-gradient(135deg, #ff7043 0%, #ff8a65 100%)',
        'gradient-surface': 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

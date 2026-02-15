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

        // NEW: Feature Cards - Subtle corner glows
        'gradient-feature-glow-1': 'radial-gradient(circle at top left, rgba(255, 87, 34, 0.08) 0%, transparent 60%)',
        'gradient-feature-glow-2': 'radial-gradient(circle at top center, rgba(255, 87, 34, 0.12) 0%, transparent 70%)',
        'gradient-feature-glow-3': 'radial-gradient(circle at top right, rgba(255, 87, 34, 0.08) 0%, transparent 60%)',

        // NEW: Icon containers - Strong center glow
        'gradient-icon-glow': 'radial-gradient(circle, rgba(255, 87, 34, 0.25) 0%, rgba(255, 87, 34, 0.1) 50%, transparent 100%)',

        // NEW: Form cards - Premium border glow effect
        'gradient-form-glow': 'linear-gradient(135deg, rgba(255, 87, 34, 0.4) 0%, rgba(255, 138, 101, 0.2) 50%, rgba(255, 87, 34, 0.4) 100%)',

        // NEW: Success states - Green celebration glow
        'gradient-success-glow': 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.3) 0%, rgba(255, 87, 34, 0.2) 50%, transparent 100%)',
        'gradient-success-icon': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(30px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        scaleIn: {
          '0%': {
            transform: 'scale(0)',
            opacity: '0'
          },
          '50%': {
            transform: 'scale(1.1)'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

import type { Config } from 'tailwindcss';

/** Tokens extraídos do design system framer.com */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tokens de cor do design system
        'ds-bg':        '#000000',
        'ds-surface':   '#121212',
        'ds-surface-2': '#141414',
        'ds-surface-3': '#181818',
        'ds-surface-4': '#212121',
        'ds-surface-5': '#242424',
        'ds-border':    'rgba(255,255,255,0.08)',
        'ds-border-2':  'rgba(255,255,255,0.12)',
        'ds-white':     '#ffffff',
        'ds-white-80':  'rgba(255,255,255,0.8)',
        'ds-white-60':  'rgba(255,255,255,0.6)',
        'ds-white-40':  'rgba(255,255,255,0.4)',
        'ds-white-10':  'rgba(255,255,255,0.1)',
        'ds-white-5':   'rgba(255,255,255,0.05)',
        'ds-blue':      '#0099ff',
        'ds-blue-dark': '#0055ff',
        'ds-green':     '#4cd963',
        'ds-yellow':    '#ffbb00',
        'ds-orange':    '#fd7702',
        'ds-red':       '#ff0022',
        'ds-purple':    '#6600ff',
        'ds-gray':      '#888888',
        'ds-gray-2':    '#999999',
      },
      fontFamily: {
        heading: ['"GT Walsheim Medium"', '"GT Walsheim Framer Medium"', 'sans-serif'],
        body: ['"Inter Variable"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero':   ['85px', { lineHeight: '0.95em', letterSpacing: '-0.05em' }],
        'h2':     ['52px', { lineHeight: '1em',    letterSpacing: '-0.04em' }],
        'h3':     ['32px', { lineHeight: '1.1em',  letterSpacing: '-0.03em' }],
        'h4':     ['22px', { lineHeight: '1.2em',  letterSpacing: '-0.02em' }],
        'body-l': ['24px', { lineHeight: '1.4em',  letterSpacing: '-0.01px' }],
        'body-m': ['16px', { lineHeight: '1.5em',  letterSpacing: '-0.01em' }],
        'body-s': ['14px', { lineHeight: '1em',    letterSpacing: '-0.01em' }],
        'label':  ['11px', { lineHeight: '1em',    letterSpacing: '0.06em'  }],
      },
      backdropBlur: {
        nav: '10px',
        card: '9px',
      },
      borderRadius: {
        'card': '16px',
        'btn-pill': '15px',
        'btn-sm': '8px',
      },
      boxShadow: {
        'card': '0px 25px 50px 0px rgba(0,0,0,0.25), 0px 5px 25px 0px rgba(0,0,0,0.5)',
        'card-hover': '0px 30px 60px 0px rgba(0,0,0,0.35), 0px 8px 30px 0px rgba(0,0,0,0.6)',
        'glow-blue': '0 0 0 3px rgba(0,153,255,0.35)',
        'glow-green': '0 0 0 3px rgba(76,217,99,0.35)',
      },
      animation: {
        'fade-in':    'fadeIn 0.6s ease forwards',
        'slide-up':   'slideUp 0.6s ease forwards',
        'scale-in':   'scaleIn 0.5s ease forwards',
        'spin-slow':  'spin 0.8s linear infinite',
        'pulse-blue': 'pulseBlue 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        pulseBlue: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,153,255,0)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(0,153,255,0.15)' },
        },
      },
      transitionTimingFunction: {
        'ds': 'ease',
      },
      transitionDuration: {
        'ds-fast': '150ms',
        'ds-base': '200ms',
        'ds-slow': '250ms',
      },
    },
  },
  plugins: [],
};

export default config;

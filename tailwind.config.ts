import type { Config } from 'tailwindcss';

// Spectre brand palette — monochrome industrial steel.
//   --dust-grey:    #D0D0D0   primary text, accent at full intensity
//   --cool-steel:   #A0A0A0   secondary text, secondary glyphs
//   --gunmetal:     #404040   strong borders, muted UI
//   --shadow-grey:  #282828   elevated surface (cards, panels)
//   --carbon-black: #1C1C1C   page base
//   amber:         #C9A968   warm accent (CTAs only, used sparingly)

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './server/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1320px' },
    },
    extend: {
      colors: {
        spectre: {
          dust: '#D0D0D0',
          steel: '#A0A0A0',
          gunmetal: '#404040',
          shadow: '#282828',
          carbon: '#1C1C1C',
          amber: '#C9A968',
          'amber-glow': '#E5C893',
          'amber-deep': '#8A7344',
        },
        ink: {
          950: '#0F0F0F',
          900: '#1C1C1C',
          850: '#232323',
          800: '#282828',
          750: '#2E2E2E',
          700: '#353535',
          600: '#404040',
          500: '#5A5A5A',
          400: '#7A7A7A',
          300: '#A0A0A0',
          200: '#BDBDBD',
          100: '#D0D0D0',
          50: '#ECECEC',
        },
        bone: {
          50: '#F5F5F5',
          100: '#EDEDED',
          200: '#E0E0E0',
          300: '#C8C8C8',
          400: '#9C9C9C',
          500: '#707070',
          600: '#4D4D4D',
          700: '#2E2E2E',
          800: '#1F1F1F',
          900: '#121212',
        },
        amber: {
          DEFAULT: '#C9A968',
          dim: '#8A7344',
          glow: '#E5C893',
          deep: '#5C4D2C',
        },
        // Semantic tokens (mapped to Spectre ramps)
        background: '#1C1C1C',
        foreground: '#D0D0D0',
        muted: { DEFAULT: '#282828', foreground: '#A0A0A0' },
        border: '#404040',
        input: '#282828',
        ring: '#C9A968',
        primary: { DEFAULT: '#D0D0D0', foreground: '#1C1C1C' },
        secondary: { DEFAULT: '#282828', foreground: '#D0D0D0' },
        accent: { DEFAULT: '#C9A968', foreground: '#1C1C1C' },
        destructive: { DEFAULT: '#B85450', foreground: '#ECECEC' },
        card: { DEFAULT: '#232323', foreground: '#D0D0D0' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        wider2: '0.18em',
      },
      maxWidth: { layout: '1320px' },
      transitionTimingFunction: {
        cinematic: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
      },
      animation: {
        'amber-pulse': 'amberPulse 3.2s ease-in-out infinite',
        flow: 'flow 9s linear infinite',
        'hud-in': 'hudIn 600ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
      keyframes: {
        amberPulse: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        flow: {
          '0%': { left: '-2%', opacity: '0' },
          '8%': { opacity: '1' },
          '92%': { opacity: '1' },
          '100%': { left: '100%', opacity: '0' },
        },
        hudIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

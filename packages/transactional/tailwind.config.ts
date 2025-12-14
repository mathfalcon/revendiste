import type {Config} from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './emails/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        'background-secondary': '#f5f8ff',
        foreground: '#000000',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#0a0a0a',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#0a0a0a',
        },
        primary: {
          DEFAULT: '#d90d73', // hsl(330 89% 45%) - Main primary
          foreground: '#fafafa', // hsl(0 0% 98%) - White text on primary
          50: '#fdf2f9',
          100: '#fce7f5',
          200: '#fcceec',
          300: '#faa7db',
          400: '#f670c1',
          500: '#ee46a7',
          600: '#de2486',
          700: '#c0166b',
          800: '#a6165c',
          900: '#85164c',
          950: '#51062a',
        },
        secondary: {
          DEFAULT: '#feecf5', // hsl(330 89% 96%) - Very light
          foreground: '#780740', // hsl(330 89% 25%) - Dark text
        },
        muted: {
          DEFAULT: '#f5f5f5', // hsl(0 0% 96.1%)
          foreground: '#737373', // hsl(0 0% 45.1%)
        },
        accent: {
          DEFAULT: '#f5f5f5', // hsl(0 0% 96.1%)
          foreground: '#171717', // hsl(0 0% 9%)
        },
        destructive: {
          DEFAULT: '#ef4444', // hsl(0 84.2% 60.2%)
          foreground: '#fafafa', // hsl(0 0% 98%)
        },
        border: '#e5e5e5', // hsl(0 0% 89.8%)
        input: '#e5e5e5', // hsl(0 0% 89.8%)
        ring: '#0a0a0a', // hsl(0 0% 3.9%)
        chart: {
          1: '#e76e50', // hsl(12 76% 61%)
          2: '#2a9d90', // hsl(173 58% 39%)
          3: '#274754', // hsl(197 37% 24%)
          4: '#e8c468', // hsl(43 74% 66%)
          5: '#f4a462', // hsl(27 87% 67%)
        },
      },
    },
  },
} satisfies Config;

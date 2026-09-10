/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        surface: {
          dark: {
            bg: '#0B0D14',
            sidebar: '#0E111B',
            card: '#141824',
            hover: '#192032',
            border: '#22293F',
            muted: '#8E9BB5',
            text: '#F1F5F9',
            input: '#101420'
          },
          light: {
            bg: '#F8FAFC',
            sidebar: '#FFFFFF',
            card: '#FFFFFF',
            hover: '#F1F5F9',
            border: '#E2E8F0',
            muted: '#64748B',
            text: '#0F172A',
            input: '#FFFFFF'
          }
        }
      },
      borderRadius: {
        'control': '8px',
        'card': '14px',
        'modal': '18px',
        'badge': '6px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'dropdown': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'dropdown-dark': '0 12px 30px -5px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
        'glow-purple': '0 0 20px -3px rgba(124, 58, 237, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

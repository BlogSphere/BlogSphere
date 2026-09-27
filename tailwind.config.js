/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/client/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  important: true,
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Newsreader', 'Lora', 'Georgia', 'serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        editorial: ['Newsreader', 'Lora', 'Georgia', 'serif'],
      },
      colors: {
        // Nordic Slate & Electric Amber Theme Palette
        primary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        nordic: {
          bg: '#f8fafc',
          darkBg: '#0b0d11',
          card: '#ffffff',
          darkCard: '#141720',
          darkCardHover: '#1b1f2b',
          border: '#e2e8f0',
          darkBorder: '#232734',
          amber: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}

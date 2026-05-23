/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff5f7',
          100: '#ffe4ea',
          200: '#ffc9d4',
          300: '#ffa0b3',
          400: '#ff6b88',
          500: '#f43f5e',
          600: '#d92847',
          700: '#b21d3a',
          800: '#8c1730',
          900: '#691227',
        },
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(244, 63, 94, 0.18)',
      },
    },
  },
  plugins: [],
}

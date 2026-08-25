/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        game: {
          dark: '#0a0d14',
          card: '#121824',
          accent: '#6366f1',
          seeker: '#ef4444',
          hider: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        pulseFast: 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

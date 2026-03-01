/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'stardos': ["'Stardos Stencil'", 'cursive'],
      },
      keyframes: {
        'spin-10': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'spin-15': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
        'spin-12': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
        'spin-8': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'spin-18': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'spin-22': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
        'spin-14': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
      },
      animation: {
        'spin-10': 'spin-10 10s linear infinite',
        'spin-15': 'spin-15 15s linear infinite',
        'spin-12': 'spin-12 12s linear infinite',
        'spin-8': 'spin-8 8s linear infinite',
        'spin-18': 'spin-18 18s linear infinite',
        'spin-22': 'spin-22 22s linear infinite',
        'spin-14': 'spin-14 14s linear infinite',
      },
    },
  },
  plugins: [],
};

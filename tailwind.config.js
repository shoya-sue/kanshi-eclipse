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
        eclipse: {
          primary: '#6366f1',
          'primary-dark': '#4f46e5',
          secondary: '#8b5cf6',
          'secondary-dark': '#7c3aed',
          dark: '#1e293b',
          light: '#f8fafc',
          accent: '#06b6d4',
          'accent-dark': '#0891b2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
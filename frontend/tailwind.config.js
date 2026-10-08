/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFF',
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        'purple-light': '#C4B5FD',
        navy: '#0F172A',
        accent: '#8B5CF6',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

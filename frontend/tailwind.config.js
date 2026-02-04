/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', 'serif'],
        sans: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        apple: {
          gray: '#F5F5F7',
          blue: '#0071E3',
        }
      }
    },
  },
  plugins: [],
}

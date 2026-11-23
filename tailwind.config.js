/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        fitness: {
          charcoal: '#000000',
          gold: '#d97706',
        }
      },
      fontFamily: {
        display: ['"Russo One"', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
        signature: ['"Great Vibes"', 'cursive'],
        serif: ['"Cinzel"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      }
    }
  },
  plugins: [],
}

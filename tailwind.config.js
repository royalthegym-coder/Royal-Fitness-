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
        // Theme tokens (see index.css). Switch with <html class="dark|light">.
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        surface2: 'rgb(var(--c-surface2) / <alpha-value>)',
        line: 'rgb(var(--c-line) / var(--line-alpha))',
        fg: 'rgb(var(--c-fg) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        subtle: 'rgb(var(--c-subtle) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--c-brand) / <alpha-value>)',
          fg: 'rgb(var(--c-brand-fg) / <alpha-value>)',
        },
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

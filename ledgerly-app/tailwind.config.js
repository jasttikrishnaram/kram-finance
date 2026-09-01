/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#14231F',
        inkdeep: '#0D1815',
        paper: '#FFFFFF',
        paperdim: '#F5F5F4',
        line: '#E2E0DA',
        gold: '#C08A2E',
        goldlight: '#E4B865',
        positive: '#3F7D58',
        negative: '#B0473C',
        textdark: '#1B2420',
        textmuted: '#5B6560',
      },
      fontFamily: {
        display: ['"Segoe UI"', '-apple-system', 'system-ui', 'sans-serif'],
        sans: ['"Segoe UI"', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['"Segoe UI"', '-apple-system', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

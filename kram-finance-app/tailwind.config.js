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
        paper: '#FBF8F2',
        paperdim: '#F1ECE1',
        line: '#D9D2C2',
        gold: '#C08A2E',
        goldlight: '#E4B865',
        positive: '#3F7D58',
        negative: '#B0473C',
        textdark: '#1B2420',
        textmuted: '#5B6560',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

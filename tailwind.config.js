/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          600: '#0ea5e9',
          700: '#0284c7',
        },
      },
    },
  },
  plugins: [],
}


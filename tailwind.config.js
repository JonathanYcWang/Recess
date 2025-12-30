/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'patrick': ['Patrick Hand', 'cursive'],
        'benchnine': ['BenchNine', 'sans-serif'],
      },
      colors: {
        'recess-black': '#1b1b1b',
        'recess-gray': '#929292',
        'recess-gray-light': '#717171',
        'recess-gray-bg': '#f1f0f0',
        'recess-gray-border': '#e7e5e4',
        'recess-gray-light-bg': '#f5f5f4',
        'recess-green': '#37eb4f',
      },
    },
  },
  plugins: [],
}


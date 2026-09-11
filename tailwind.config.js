/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#001757',
          900: '#000f38',
          800: '#001757',
          700: '#00227a',
          50: '#f0f4fc',
        },
        electric: {
          DEFAULT: '#0091FB',
          hover: '#007be0',
          light: '#e8f5ff',
          50: '#f0f8ff',
        }
      }
    },
  },
  plugins: [],
}
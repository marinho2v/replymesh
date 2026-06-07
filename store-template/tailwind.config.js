/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFFFFF',
        primaryHover: '#E5E5E5',
        dark: {
          950: '#0A0A0A',
          900: '#121212',
          800: '#1A1A1A',
          700: '#252525',
          600: '#2D2D2D',
          500: '#3D3D3D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

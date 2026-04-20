/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: '#FF7F6A',
        lavender: '#A084E8',
        mint: '#B2EBF2',
        cream: '#FAF9F6',
      },
      fontFamily: {
        title: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        button: '50px',
      },
    },
  },
  plugins: [],
}


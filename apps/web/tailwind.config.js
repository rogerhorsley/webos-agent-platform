/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        desktop: {
          bg: '#1a1a2e',
          dock: '#16213e',
          window: '#0f3460',
          accent: '#e94560',
        },
      },
    },
  },
  plugins: [],
}

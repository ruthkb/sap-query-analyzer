/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cursor-like dark theme
        background: {
          primary: '#0d1117',
          secondary: '#161b22',
          tertiary: '#21262d',
        },
        surface: {
          primary: '#161b22',
          secondary: '#21262d',
          tertiary: '#30363d',
        },
        border: {
          primary: '#30363d',
          secondary: '#21262d',
        },
        text: {
          primary: '#f0f6fc',
          secondary: '#8b949e',
          tertiary: '#6e7681',
        },
        accent: {
          primary: '#58a6ff',
          secondary: '#1f6feb',
          success: '#238636',
          warning: '#d29922',
          error: '#f85149',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 
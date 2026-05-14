/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#C0392B',
          'red-dark': '#A93226',
          'red-dim': '#1A0808',
          'red-border': '#2A1010',
        },
        surface: {
          base: '#0C0C0C',
          card: '#111111',
          elevated: '#161616',
          border: '#1E1E1E',
          'border-hover': '#333333',
        },
        text: {
          primary: '#F0F0F0',
          secondary: '#888888',
          muted: '#555555',
          hint: '#333333',
        },
        state: {
          mastered: '#22C55E',
          'mastered-bg': '#081A08',
          'mastered-border': '#102A10',
          developing: '#D97706',
          'developing-bg': '#1A1400',
          'developing-border': '#2A2000',
          'not-started': '#E57373',
          'not-started-bg': '#1A0808',
          'not-started-border': '#2A1010',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

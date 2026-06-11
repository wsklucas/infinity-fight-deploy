/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          red:        'var(--c-brand-red)',
          'red-dark': 'var(--c-brand-red-dark)',
          'red-dim':  'var(--c-brand-red-dim)',
          'red-border':'var(--c-brand-red-border)',
        },
        surface: {
          base:          'var(--c-surface-base)',
          card:          'var(--c-surface-card)',
          elevated:      'var(--c-surface-elevated)',
          border:        'var(--c-surface-border)',
          'border-hover':'var(--c-surface-border-hover)',
        },
        text: {
          primary:   'var(--c-text-primary)',
          secondary: 'var(--c-text-secondary)',
          muted:     'var(--c-text-muted)',
          hint:      'var(--c-text-hint)',
        },
        state: {
          mastered:           'var(--c-state-mastered)',
          'mastered-bg':      'var(--c-state-mastered-bg)',
          'mastered-border':  'var(--c-state-mastered-border)',
          developing:         'var(--c-state-developing)',
          'developing-bg':    'var(--c-state-developing-bg)',
          'developing-border':'var(--c-state-developing-border)',
          'not-started':         'var(--c-state-not-started)',
          'not-started-bg':      'var(--c-state-not-started-bg)',
          'not-started-border':  'var(--c-state-not-started-border)',
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

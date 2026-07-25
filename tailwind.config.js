/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-mode="dark"]'],
  theme: {
    extend: {
      // Every colour is a CSS variable so the style toggle (ink / modern) and
      // the light/dark switch can repaint the whole app from one place.
      colors: {
        paper: 'var(--paper)',
        'paper-raised': 'var(--paper-raised)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        'ink-faint': 'var(--ink-faint)',
        rule: 'var(--rule)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        danger: 'var(--danger)',
        good: 'var(--good)',
      },
      fontFamily: {
        hand: 'var(--font-hand)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        note: 'var(--radius)',
      },
    },
  },
  plugins: [],
}

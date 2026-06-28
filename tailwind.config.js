/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './index.tsx', './App.tsx', './components/**/*.{ts,tsx}', './contexts/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens da marca (theme-aware via CSS vars em styles/theme.css).
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-soft': 'var(--primary-soft)',
        'primary-on': 'var(--primary-on)',
        secondary: 'var(--secondary)',
        'secondary-soft': 'var(--secondary-soft)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        success: 'var(--success)',
        'success-soft': 'var(--success-soft)',
        warning: 'var(--warning)',
        'warning-soft': 'var(--warning-soft)',
        error: 'var(--error)',
        'error-soft': 'var(--error-soft)',
        info: 'var(--info)',
        'info-soft': 'var(--info-soft)',
        bg: 'var(--bg)',
        'bg-muted': 'var(--bg-muted)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--border)',
        'line-strong': 'var(--border-strong)',
        ink: 'var(--text)',
        muted: 'var(--text-muted)',
        subtle: 'var(--text-subtle)',
        // Compat: classes legadas adotam a nova marca.
        govblue: '#0E6E6A',
        govgreen: '#1F7A5C',
        govorange: '#E2864D',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', '"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl: '14px', '2xl': '20px', '3xl': '24px' },
      boxShadow: { 'brand-sm': 'var(--shadow-sm)', 'brand-md': 'var(--shadow-md)' },
    },
  },
  plugins: [],
}

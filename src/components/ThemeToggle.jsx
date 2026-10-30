import { useTheme } from '../theme/ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'Matinee light' : 'Midnight dark'} theme`}
      title={`Switch to ${theme === 'dark' ? 'Matinee (Light)' : 'Midnight (Dark)'}`}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}

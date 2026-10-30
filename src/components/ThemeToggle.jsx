import { useTheme } from '../theme/ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const onClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
  }
  return (
    <button
      className="theme-toggle"
      onClick={onClick}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title="Toggle theme"
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ThemeCtx = createContext(null)
export const useTheme = () => useContext(ThemeCtx)

function initialTheme() {
  try {
    const saved = localStorage.getItem('seatsiren-theme')
    if (saved === 'dark' || saved === 'light') return saved
  } catch { /* ignore */ }
  const prefersLight =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
  return prefersLight ? 'light' : 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('seatsiren-theme', theme) } catch { /* ignore */ }
  }, [theme])

  // Venom-style transition: an inky blob spreads from (x,y) and reveals the new theme.
  // Swap + cleanup are driven by timers (not animationend) so it never stalls when
  // the tab is backgrounded or animationend doesn't fire.
  const toggle = useCallback((origin) => {
    const next = theme === 'dark' ? 'light' : 'dark'
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce) { setTheme(next); return }

    const { x, y } = origin || { x: innerWidth - 40, y: 40 }
    const blob = document.createElement('div')
    blob.className = 'venom-blob'
    blob.style.setProperty('--vx', x + 'px')
    blob.style.setProperty('--vy', y + 'px')
    // paint the INCOMING theme's page color on top as it crawls across
    blob.style.background = next === 'dark' ? '#0e0b14' : '#fbf7f2'
    document.body.appendChild(blob)

    // swap the real theme once the blob covers the screen, then remove it.
    setTimeout(() => setTheme(next), 360)
    setTimeout(() => { blob.remove() }, 780)
  }, [theme])

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

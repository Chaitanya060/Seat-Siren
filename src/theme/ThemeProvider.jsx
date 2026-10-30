import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ThemeCtx = createContext(null)
export const useTheme = () => useContext(ThemeCtx)

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('seatsiren-theme')
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    // Ignore storage errors
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('seatsiren-theme', theme)
    } catch {
      // Ignore storage errors
    }
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const setExplicitTheme = useCallback((val) => {
    if (val === 'dark' || val === 'light') {
      setTheme(val)
    }
  }, [])

  return (
    <ThemeCtx.Provider value={{ theme, toggle, setTheme: setExplicitTheme }}>
      {children}
    </ThemeCtx.Provider>
  )
}

import { useState } from 'react'

const KEY = 'ctracer_theme'

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const t = localStorage.getItem(KEY) ?? 'dark'
    document.documentElement.dataset.theme = t
    return t
  })

  const setTheme = (t) => {
    document.documentElement.dataset.theme = t
    localStorage.setItem(KEY, t)
    setThemeState(t)
  }

  const toggleTheme = () =>
    setTheme(theme === 'dark' ? 'light' : 'dark')

  return { theme, toggleTheme }
}

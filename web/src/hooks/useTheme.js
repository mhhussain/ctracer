import { useEffect, useState } from 'react'

const KEY = 'ctracer_theme'

export function useTheme() {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(KEY) ?? 'dark'
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(KEY, theme)
  }, [theme])

  const toggleTheme = () =>
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}

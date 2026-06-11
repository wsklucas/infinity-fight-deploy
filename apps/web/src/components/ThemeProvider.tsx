'use client'
import { useEffect } from 'react'
import { useTheme } from '../store/theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  // Sync theme from localStorage once on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ift-theme')
      if (saved === 'light' || saved === 'dark') {
        useTheme.getState().setTheme(saved)
      }
    } catch {}
  }, [])

  // Apply .light class and persist whenever theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    try {
      localStorage.setItem('ift-theme', theme)
    } catch {}
  }, [theme])

  return <>{children}</>
}

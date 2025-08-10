import { useTheme } from "@/hooks/use-theme"
import "./theme-toggle-switch.css"

export function ThemeToggleSwitch() {
  const { theme, setTheme } = useTheme()
  
  // Check if current theme is dark (either explicitly dark or system preference is dark)
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <input
      type="checkbox"
      className="theme-checkbox"
      checked={isDark}
      onChange={handleToggle}
      aria-label="Toggle theme"
    />
  )
}

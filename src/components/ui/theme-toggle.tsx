import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function ThemeToggle() {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }, [theme])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex size-8 items-center justify-center rounded-md border border-border bg-elevated text-ink-secondary transition-colors hover:bg-surface hover:text-ink-primary"
        >
          {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>Changer le thème</TooltipContent>
    </Tooltip>
  )
}

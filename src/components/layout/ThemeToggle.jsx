import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { track } from '@vercel/analytics'
import navContent from '../../content/nav.json'

// index.html sets <html data-theme> before the page paints (dark unless the
// visitor chose light before); this flips it and remembers the choice.
export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark')
  const next = theme === 'dark' ? 'light' : 'dark'
  const Icon = theme === 'dark' ? Sun : Moon

  function toggle() {
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // private mode: the choice lasts for this visit
    }
    setTheme(next)
    track('theme_switch', { theme: next })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={navContent.theme[next]}
      title={navContent.theme[next]}
      className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] text-slate transition-colors duration-150 hover:text-clay"
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  )
}

import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { track } from '@vercel/analytics'
import copy from '../content/another.json'
import navContent from '../content/nav.json'
import profile from '../content/profile.json'

export default function Nav({ mode, onToggle }) {
  const next = mode === 'blue' ? 'white' : 'blue'
  const label = next === 'white' ? copy.nav.toWhite : copy.nav.toBlue
  const Icon = mode === 'blue' ? Sun : Moon
  const items = [...navContent.items, { label: copy.nav.contact, href: '#contact' }]

  return (
    <header className="bp-sheet sticky top-0 z-50 print:hidden">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-5 py-3 md:px-8">
        <Link to="/another" className="bp-button text-ink">
          {profile.name}
        </Link>
        <ul className="hidden items-center gap-7 md:flex">
          {items.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="bp-button text-ink hover:text-clay">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(next)}
            aria-label={label}
            title={label}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center text-ink hover:text-clay"
          >
            <Icon size={18} aria-hidden="true" />
          </button>
          <a
            href={profile.links.resume}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('resume_download', { source: 'another_nav' })}
            className="bp-button border-2 border-ink px-3 py-1.5 text-ink hover:bg-ink hover:text-paper"
          >
            {navContent.resumeLabel} ↓
          </a>
        </div>
      </nav>
    </header>
  )
}

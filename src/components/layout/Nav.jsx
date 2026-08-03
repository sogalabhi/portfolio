import { useEffect, useState } from 'react'
import { Menu, X, Download } from 'lucide-react'
import { track } from '@vercel/analytics'
import navContent from '../../content/nav.json'
import profile from '../../content/profile.json'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = navContent.items
      .map((item) => document.querySelector(item.href))
      .filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`)
        })
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 print:hidden transition-colors duration-200 ${
        scrolled || menuOpen ? 'bg-paper border-b border-line' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 md:px-10">
        <a href="#" className="font-display text-lg font-semibold text-ink">
          {profile.name}
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {navContent.items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={active === item.href ? 'true' : undefined}
                className={`text-sm transition-colors duration-150 hover:text-clay ${
                  active === item.href ? 'font-medium text-clay' : 'text-slate'
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={profile.links.resume}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('resume_download', { source: 'nav' })}
            className="inline-flex items-center gap-2 rounded-[10px] bg-clay px-4 py-2 text-sm font-medium text-paper transition-colors duration-150 hover:bg-clay/90"
          >
            {navContent.resumeLabel}
            <Download size={16} aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          className="cursor-pointer p-2 md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 top-[65px] z-40 flex flex-col gap-6 bg-paper px-6 py-10 md:hidden">
          {navContent.items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="font-display text-2xl text-ink"
            >
              {item.label}
            </a>
          ))}
          <a
            href={profile.links.resume}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              track('resume_download', { source: 'nav_mobile' })
              setMenuOpen(false)
            }}
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-[10px] bg-clay px-5 py-3 text-base font-medium text-paper"
          >
            {navContent.resumeLabel}
            <Download size={18} aria-hidden="true" />
          </a>
        </div>
      )}
    </header>
  )
}

import { useEffect, useState } from 'react'
import { track } from '@vercel/analytics'
import profile from '../../content/profile.json'

function isTypingContext(target) {
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

export default function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handleKey = (e) => {
      if (isTypingContext(e.target) || e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'Escape') {
        setShowHelp(false)
        return
      }

      if (e.key === 't' || e.key === 'T') {
        document.querySelector('[data-tour-start]')?.click()
      } else if (e.key === 'r' || e.key === 'R') {
        track('resume_download', { source: 'keyboard_shortcut' })
        const link = document.createElement('a')
        link.href = profile.links.resume
        link.download = ''
        link.click()
      } else if (e.key === '?') {
        setShowHelp((v) => !v)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  if (!showHelp) return null

  return (
    <div
      role="dialog"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 p-6"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-line bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-semibold text-ink">Keyboard shortcuts</h2>
        <dl className="mt-4 space-y-3 text-sm text-slate">
          <div className="flex items-center justify-between">
            <dt>Take the tour</dt>
            <dd className="rounded border border-line bg-paper px-2 py-0.5 font-mono text-xs">t</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Download résumé</dt>
            <dd className="rounded border border-line bg-paper px-2 py-0.5 font-mono text-xs">r</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Toggle this menu</dt>
            <dd className="rounded border border-line bg-paper px-2 py-0.5 font-mono text-xs">?</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

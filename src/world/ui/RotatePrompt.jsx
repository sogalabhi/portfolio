import { useEffect, useState } from 'react'
import { RotateCw, X } from 'lucide-react'

// Portrait only — landscape on a phone gives ~380px of height, worse than
// portrait for a top-down game. The manifest's orientation lock only applies
// to installed PWAs, so this covers the in-browser case. Dismissible: someone
// who genuinely wants landscape shouldn't be trapped.
function isCramped() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(orientation: landscape)').matches && window.innerHeight < 500
}

export default function RotatePrompt() {
  const [cramped, setCramped] = useState(isCramped)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const update = () => setCramped(isCramped())
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  useEffect(() => {
    if (cramped) setDismissed(false)
  }, [cramped])

  if (!cramped || dismissed) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#2B2438]/95 px-6 text-center text-[#F4EDE2]">
      <RotateCw size={32} />
      <p className="max-w-[28ch] text-base">This world plays best in portrait.</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="mt-2 inline-flex items-center gap-2 rounded-lg border-2 border-[#F4EDE2]/30 px-4 py-2.5 text-sm"
      >
        <X size={16} />
        Continue in landscape
      </button>
    </div>
  )
}

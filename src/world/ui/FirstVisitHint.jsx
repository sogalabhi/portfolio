import { useState } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'world-hint-seen'

export default function FirstVisitHint() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // localStorage unavailable — just hide for this session
    }
  }

  if (dismissed) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-lg border-2 border-[#2B2438] bg-[#F4EDE2] px-4 py-2.5 text-sm text-[#2B2438] shadow-md">
      <p>WASD or click to move · E to interact</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss hint"
        className="cursor-pointer text-[#2B2438]/60 hover:text-[#2B2438]"
      >
        <X size={16} />
      </button>
    </div>
  )
}

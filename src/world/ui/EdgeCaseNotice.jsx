import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useLowFrameRate, useNarrowViewport } from '../useDeviceMode'

// Genuine edge cases only — a viewport too narrow to lay anything out in, or
// a device sustained below 30fps for 5+ seconds. Never auto-redirects; just
// offers the opt-out.
export default function EdgeCaseNotice() {
  const tooNarrow = useNarrowViewport(340)
  const lowFps = useLowFrameRate()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || (!tooNarrow && !lowFps)) return null

  const message = tooNarrow
    ? "This screen's a bit tight for the world."
    : 'This device is struggling to keep up with the world.'

  return (
    <div className="fixed inset-x-4 top-4 z-40 flex items-center gap-3 rounded-lg border-2 border-[#2B2438] bg-[#F4EDE2] px-4 py-2.5 text-sm text-[#2B2438] shadow-md">
      <p className="flex-1">{message}</p>
      <Link
        to="/"
        className="shrink-0 rounded-md bg-[#2B2438] px-3 py-1.5 text-xs font-medium text-[#F4EDE2]"
      >
        Go to portfolio
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 cursor-pointer text-[#2B2438]/60 hover:text-[#2B2438]"
      >
        <X size={16} />
      </button>
    </div>
  )
}

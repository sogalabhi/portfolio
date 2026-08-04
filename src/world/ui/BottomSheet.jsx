import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { bus, EVENTS } from '../bus'

const PEEK = 45
const OPEN = 85
const FULL = 96 // not 100 — leaves headroom so the handle clears env(safe-area-inset-top)
const SNAPS = [PEEK, OPEN, FULL]
const DISMISS_BELOW = 20 // heightPct — drag past here and it's a close, not a snap-to-peek
const FLICK_VELOCITY = 0.6 // px/ms downward — a fast flick dismisses even above DISMISS_BELOW
const RUBBER_BAND = 0.3 // resistance factor for dragging past FULL

// Hand-rolled rather than pulling in a modal/sheet library — pointer events
// + a CSS height transition covers drag, rubber-band, and velocity-based
// dismiss without another dependency. Opens at OPEN (85%), not PEEK — nobody
// wants an extra gesture just to read the content that was tapped open.
export default function BottomSheet({ title, onClose, onHeightChange, children }) {
  const [heightPct, setHeightPct] = useState(OPEN)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef(null)

  useEffect(() => {
    bus.emit(EVENTS.PAUSE_INPUT, true)
    return () => bus.emit(EVENTS.PAUSE_INPUT, false)
  }, [])

  useEffect(() => {
    onHeightChange?.(heightPct)
  }, [heightPct, onHeightChange])

  const handlePointerDown = (e) => {
    dragRef.current = {
      startY: e.clientY,
      startHeight: heightPct,
      lastY: e.clientY,
      lastT: performance.now(),
      velocity: 0,
    }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    const drag = dragRef.current
    if (!drag) return

    const vh = window.visualViewport?.height || window.innerHeight
    const deltaY = e.clientY - drag.startY
    let next = drag.startHeight - (deltaY / vh) * 100
    if (next > FULL) next = FULL + (next - FULL) * RUBBER_BAND
    setHeightPct(Math.max(next, -10))

    const now = performance.now()
    const dt = now - drag.lastT
    if (dt > 0) drag.velocity = (e.clientY - drag.lastY) / dt
    drag.lastY = e.clientY
    drag.lastT = now
  }

  const handlePointerUp = () => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    setDragging(false)

    if (drag.velocity > FLICK_VELOCITY || heightPct < DISMISS_BELOW) {
      onClose()
      return
    }
    setHeightPct(SNAPS.reduce((a, b) => (Math.abs(b - heightPct) < Math.abs(a - heightPct) ? b : a)))
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-black/20"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex w-full flex-col rounded-t-[20px] bg-[#2B2438] text-[#F4EDE2] shadow-2xl"
        style={{
          height: `${Math.max(heightPct, 0)}dvh`,
          transition: dragging ? 'none' : 'height 220ms cubic-bezier(0.32, 0.72, 0, 1)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="flex shrink-0 touch-none flex-col items-center gap-2 pb-1 pt-2.5"
        >
          <span className="h-1.5 w-10 rounded-full bg-[#F4EDE2]/25" />
        </div>

        <div className="flex shrink-0 items-center justify-between px-5 pb-2">
          <h2 className="text-sm" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-11 w-11 cursor-pointer items-center justify-center text-[#F4EDE2]/70"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 text-base leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}

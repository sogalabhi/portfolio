import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import useReducedMotion from '../../hooks/useReducedMotion'

// Walks the left margin as overall page-scroll progress goes 0->1, starting
// beside the hero. Position, not decoration - position: fixed (not tied to
// document flow like the Section decor sprites) and scrubbed directly off
// scroll, so it's the reader's scrolling that moves it, not a timer.
//
// Deliberately simpler than a per-section "pause and face the heading" -
// that needs coordinating a second set of ScrollTriggers against the same
// scrub and snapping between them, real engineering for a decorative touch.
// This is the continuous version; the pause-at-heading polish is a separate
// follow-up if it's worth the complexity once this is live.
const WALK_TOP_VH = 0.18
const WALK_RANGE_VH = 0.62

export default function MarginCharacter() {
  const charRef = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return undefined
    const el = charRef.current
    if (!el) return undefined

    let lastY = window.scrollY
    let facingLeft = false

    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const vh = window.innerHeight
        gsap.set(el, { top: vh * WALK_TOP_VH + self.progress * vh * WALK_RANGE_VH })

        const goingUp = window.scrollY < lastY
        lastY = window.scrollY
        if (goingUp !== facingLeft) {
          facingLeft = goingUp
          el.style.transform = facingLeft ? 'scaleX(-1)' : 'scaleX(1)'
        }
      },
    })

    return () => trigger.kill()
  }, [reduced])

  if (reduced) return null

  return (
    <img
      ref={charRef}
      src="/world/char.png"
      alt=""
      aria-hidden="true"
      className="pointer-events-none fixed left-8 z-10 hidden xl:block"
      style={{ height: 32, width: 'auto', imageRendering: 'pixelated', top: '18vh' }}
    />
  )
}

import { useEffect, useRef } from 'react'
import { ScrollTrigger } from '../../lib/gsap'
import useReducedMotion from '../../hooks/useReducedMotion'

// The avatar walking the road drawn down the left margin (MarginAlignment).
// position: fixed and driven off scroll, so it's the reader's scrolling that
// moves him: down the road while the page goes down, back up when it goes up.
// His feet stay between the two ends of the road (`start`/`end`, document
// px), so he waits at the first station while the hero is on screen and at
// the last one by the footer.
//
// The same update publishes where his feet are as `--margin-built` on the
// root element; the road draws itself "as built" (solid) down to there.
const WALK_TOP_VH = 0.18
const WALK_RANGE_VH = 0.62
const HEIGHT = 48 // 32x48: the 16x24 frames at 2x
const STEP_PX = 14 // feet travel per walk frame
const SETTLE_MS = 150
const DIRECTIONS = ['down', 'left', 'right', 'up'] // row order in avatar.png

const framePosition = (dir, frame) => `${((DIRECTIONS.indexOf(dir) * 4 + frame) / 15) * 100}% 0`

export default function MarginCharacter({ start, end }) {
  const charRef = useRef(null)
  const range = useRef({ start, end })
  const reduced = useReducedMotion()

  useEffect(() => {
    range.current = { start, end }
    ScrollTrigger.refresh()
  }, [start, end])

  useEffect(() => {
    if (reduced) return undefined
    const el = charRef.current
    const root = document.documentElement
    if (!el) return undefined

    let lastFeet = null
    let settle = 0

    function place(progress) {
      const vh = window.innerHeight
      const { start: lo, end: hi } = range.current
      const wanted = window.scrollY + vh * (WALK_TOP_VH + progress * WALK_RANGE_VH) + HEIGHT
      const feet = Math.round(Math.max(lo, Math.min(hi, wanted)))
      el.style.top = `${feet - HEIGHT - window.scrollY}px`
      root.style.setProperty('--margin-built', `${feet}px`)

      if (lastFeet !== null && feet !== lastFeet) {
        const dir = feet > lastFeet ? 'down' : 'up'
        el.style.backgroundPosition = framePosition(dir, Math.floor(feet / STEP_PX) % 4)
        clearTimeout(settle)
        settle = setTimeout(() => (el.style.backgroundPosition = framePosition('down', 0)), SETTLE_MS)
      }
      lastFeet = feet
    }

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => place(self.progress),
      onRefresh: (self) => place(self.progress),
    })
    place(trigger.progress)

    return () => {
      trigger.kill()
      clearTimeout(settle)
      root.style.removeProperty('--margin-built')
    }
  }, [reduced])

  if (reduced) return null

  return (
    <div
      ref={charRef}
      className="avatar-sprite pointer-events-none fixed left-8 z-10 hidden xl:block print:hidden"
      style={{ width: 32, height: HEIGHT, top: '-100px' }}
      aria-hidden="true"
    />
  )
}

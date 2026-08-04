import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { track } from '@vercel/analytics'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import useReducedMotion from '../../hooks/useReducedMotion'

// Shrinks the big island banner (#world-banner, IslandDivider.jsx) into a
// corner pill once it scrolls out of view, and reverses when you scroll
// back up to it - a GSAP-driven cross-fade between two elements rather than
// morphing one element's position type (document flow -> fixed), which
// doesn't animate cleanly with transforms.
export default function WorldMiniBanner() {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    gsap.set(el, { scale: 0, opacity: 0, transformOrigin: 'bottom right' })

    const trigger = ScrollTrigger.create({
      trigger: '#world-banner',
      start: 'bottom top',
      onEnter: () => gsap.to(el, { scale: 1, opacity: 1, duration: reduced ? 0 : 0.35, ease: 'back.out(1.7)' }),
      onLeaveBack: () => gsap.to(el, { scale: 0, opacity: 0, duration: reduced ? 0 : 0.25, ease: 'power2.in' }),
    })

    return () => trigger.kill()
  }, [reduced])

  return (
    <Link
      ref={ref}
      to="/world"
      onClick={() => track('world_explore_click', { source: 'mini_banner' })}
      aria-label="Visit the interactive world"
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-lg border-2 border-[#2B2438] bg-[#5FA65A] px-4 py-3 font-mono text-xs uppercase tracking-wide text-[#F4EDE2] shadow-md transition-colors duration-150 hover:bg-[#4A7C4E] print:hidden"
      style={{ transform: 'scale(0)', opacity: 0 }}
    >
      Explore my world →
    </Link>
  )
}

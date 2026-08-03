import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import useReducedMotion from './useReducedMotion'

// mirrors scrollTrigger's `start: 'top 85%'` so we can detect, at creation time,
// whether a hard refresh already landed the page past a trigger's start line —
// ScrollTrigger's own position measurement is deferred a tick, too late to rely on here
function isPastEightyFivePercent(el) {
  const top = el.getBoundingClientRect().top
  return top < window.innerHeight * 0.85
}

export default function useGsapReveal({
  stagger = 0.08,
  y = 24,
  selector = '[data-reveal]',
  batch = false,
} = {}) {
  const scope = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      const targets = gsap.utils.toArray(selector, scope.current)
      if (!targets.length) return

      if (reduced) {
        gsap.set(targets, { opacity: 1, y: 0 })
        return
      }

      if (batch) {
        const alreadyVisible = []
        const pending = []
        targets.forEach((el) => (isPastEightyFivePercent(el) ? alreadyVisible : pending).push(el))

        if (alreadyVisible.length) gsap.set(alreadyVisible, { opacity: 1, y: 0 })

        if (pending.length) {
          ScrollTrigger.batch(pending, {
            start: 'top 85%',
            once: true,
            onEnter: (elements) =>
              gsap.from(elements, {
                opacity: 0,
                y,
                duration: 0.6,
                ease: 'power2.out',
                stagger,
                overwrite: true,
              }),
          })
        }
        return
      }

      if (isPastEightyFivePercent(scope.current)) {
        gsap.set(targets, { opacity: 1, y: 0 })
        return
      }

      gsap.from(targets, {
        opacity: 0,
        y,
        duration: 0.6,
        ease: 'power2.out',
        stagger,
        scrollTrigger: {
          trigger: scope.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope, dependencies: [reduced, selector, stagger, y, batch] },
  )

  return scope
}

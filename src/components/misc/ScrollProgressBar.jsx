import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '../../lib/gsap'

export default function ScrollProgressBar() {
  const barRef = useRef(null)

  useGSAP(() => {
    if (!barRef.current) return

    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => gsap.set(barRef.current, { scaleX: self.progress }),
    })

    return () => trigger.kill()
  }, [])

  return (
    <div
      ref={barRef}
      className="fixed left-0 top-0 z-[60] h-0.5 w-full origin-left scale-x-0 bg-clay print:hidden"
      aria-hidden="true"
    />
  )
}

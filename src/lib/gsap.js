import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.defaults({ duration: 0, ease: 'none' })
  ScrollTrigger.config({ ignoreMobileResize: true })
}

export { gsap, ScrollTrigger, ScrollToPlugin }

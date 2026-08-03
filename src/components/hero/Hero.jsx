import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { Download } from 'lucide-react'
import { track } from '@vercel/analytics'
import { gsap } from '../../lib/gsap'
import useReducedMotion from '../../hooks/useReducedMotion'
import profile from '../../content/profile.json'
import { GithubIcon, LinkedinIcon } from '../misc/BrandIcons'
import AvailabilityBadge from './AvailabilityBadge'
import StatStrip from './StatStrip'

export default function Hero() {
  const scope = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      const items = gsap.utils.toArray('[data-hero-item]', scope.current)
      if (!items.length) return

      if (reduced) {
        gsap.set(items, { opacity: 1, y: 0 })
        return
      }

      gsap.from(items, {
        opacity: 0,
        y: 16,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.07,
      })
    },
    { scope, dependencies: [reduced] },
  )

  return (
    <section id="hero" ref={scope} className="scroll-mt-20 pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="mx-auto max-w-5xl px-6 md:px-10">
        <div data-hero-item>
          <AvailabilityBadge text={profile.availability} />
        </div>

        <h1 data-hero-item className="mt-6 text-ink">
          {profile.name}
        </h1>

        <p data-hero-item className="mt-6 max-w-[30ch] text-xl leading-relaxed text-slate">
          {profile.tagline}
        </p>

        <div data-hero-item className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href={profile.links.resume}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('resume_download', { source: 'hero' })}
            className="inline-flex items-center gap-2 rounded-[10px] bg-clay px-5 py-3 text-sm font-medium text-paper transition-colors duration-150 hover:bg-clay/90"
          >
            Download résumé
            <Download size={16} aria-hidden="true" />
          </a>
          <a
            href={profile.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[10px] border border-line px-5 py-3 text-sm font-medium text-ink transition-colors duration-150 hover:border-clay hover:text-clay"
          >
            <GithubIcon size={16} />
            GitHub
          </a>
          <a
            href={profile.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[10px] border border-line px-5 py-3 text-sm font-medium text-ink transition-colors duration-150 hover:border-clay hover:text-clay"
          >
            <LinkedinIcon size={16} />
            LinkedIn
          </a>
        </div>

        <div data-hero-item>
          <StatStrip stats={profile.stats} />
        </div>
      </div>
    </section>
  )
}

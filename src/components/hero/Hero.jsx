import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { Download, Crosshair } from 'lucide-react'
import { track } from '@vercel/analytics'
import { gsap } from '../../lib/gsap'
import useReducedMotion from '../../hooks/useReducedMotion'
import profile from '../../content/profile.json'
import sitePlan from '../../content/site-plan.json'
import StatStrip from './StatStrip'
import SitePlan from './SitePlan'

const GRID_COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const GRID_ROWS = ['1', '2', '3', '4']

// The hero is one drawing sheet: the intro on the left, the island's site
// plan on the right (it builds into the /world art as the avatar walks and the
// cursor moves; the only place on the page the game shows), and the stats in
// the title block along the bottom edge.
export default function Hero() {
  const scope = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      const items = gsap.utils.toArray('[data-hero-item]', scope.current)
      if (!items.length || reduced) return

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
    <section id="hero" ref={scope} className="scroll-mt-20 px-3 pt-[4.5rem] sm:px-5 md:pt-20">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden border border-ink/35 bg-paper">
        {/* the sheet's inner rule and grid references */}
        <div className="pointer-events-none absolute inset-[5px] border border-ink/15" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-x-[5px] top-[5px] hidden justify-around font-mono text-[9px] leading-[14px] text-faint lg:flex"
          aria-hidden="true"
        >
          {GRID_COLUMNS.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-y-[5px] left-[5px] hidden w-[14px] flex-col justify-around text-center font-mono text-[9px] text-faint lg:flex"
          aria-hidden="true"
        >
          {GRID_ROWS.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>

        <div className="relative grid items-center lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.5fr)]">
          <div className="relative z-10 px-6 pt-12 sm:px-10 lg:py-14 lg:pl-14 lg:pr-0">
            <h1 data-hero-item className="text-ink">
              {profile.name}
            </h1>

            <p data-hero-item className="mt-6 max-w-[38ch] text-lg leading-relaxed text-ink md:text-xl">
              {profile.tagline}
            </p>
            <p data-hero-item className="mt-4 max-w-[38ch] leading-relaxed text-slate">
              {profile.intro}
            </p>

            <div data-hero-item className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                href={profile.links.resume}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('resume_download', { source: 'hero' })}
                className="inline-flex min-h-11 items-center gap-2 border border-ink px-5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-ink hover:text-paper"
              >
                {profile.actions.resume}
                <Download size={16} aria-hidden="true" />
              </a>
              <a
                href="#contact"
                className="inline-flex min-h-11 items-center text-sm font-medium text-slate underline decoration-ink/30 underline-offset-4 transition-colors duration-150 hover:text-clay hover:decoration-current"
              >
                {profile.actions.contact}
              </a>
            </div>

            <p data-hero-item className="mt-8 flex items-center gap-2 text-sm text-faint">
              <Crosshair size={15} className="shrink-0 text-clay" aria-hidden="true" />
              <span className="pointer-coarse:hidden">{sitePlan.hint}</span>
              <span className="hidden pointer-coarse:inline">{sitePlan.hintTouch}</span>
            </p>
          </div>

          <div className="relative px-3 pb-8 pt-8 sm:px-8 sm:pb-12 lg:py-10 lg:pl-4 lg:pr-10">
            <SitePlan />
          </div>
        </div>

        <StatStrip stats={profile.stats} />
      </div>
    </section>
  )
}

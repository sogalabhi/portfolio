import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Download, Crosshair } from 'lucide-react'
import { track } from '@vercel/analytics'
import { gsap } from '../../lib/gsap'
import useReducedMotion from '../../hooks/useReducedMotion'
import profile from '../../content/profile.json'
import navContent from '../../content/nav.json'
import sitePlan from '../../content/site-plan.json'
import { GithubIcon, LinkedinIcon } from '../misc/BrandIcons'
import AvailabilityBadge from './AvailabilityBadge'
import StatStrip from './StatStrip'
import SitePlan from './SitePlan'

const GRID_COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const GRID_ROWS = ['1', '2', '3', '4']

// The hero is one drawing sheet: the intro on the left, the island's site
// plan on the right, and the stats in the title block along the bottom edge,
// where a drawing keeps the facts about itself.
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
    <section id="hero" ref={scope} className="scroll-mt-20 px-3 pt-[4.5rem] sm:px-5 md:pt-20">
      <div
        id="world-banner"
        className="relative mx-auto max-w-[1400px] overflow-hidden border border-ink/35 bg-paper"
      >
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
          <div className="relative z-10 px-6 pt-10 sm:px-10 lg:py-14 lg:pl-14 lg:pr-0">
            <div data-hero-item>
              <AvailabilityBadge text={profile.availability} />
            </div>

            <h1 data-hero-item className="mt-6 text-ink">
              {profile.name}
            </h1>

            <p data-hero-item className="mt-5 max-w-[36ch] text-lg leading-relaxed text-slate md:text-xl">
              {profile.tagline}
            </p>

            <div data-hero-item className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={profile.links.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('resume_download', { source: 'hero' })}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-clay px-4 py-3 text-sm font-medium text-paper transition-colors duration-150 hover:bg-clay/90 sm:px-5"
                >
                  {profile.actions?.resume ?? navContent.resumeLabel}
                  <Download size={16} aria-hidden="true" />
                </a>
                <Link
                  to="/world"
                  onClick={() => track('world_explore_click', { source: 'hero' })}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-ink/25 bg-paper px-4 py-3 text-sm font-medium text-ink transition-colors duration-150 hover:border-clay hover:text-clay sm:px-5"
                >
                  {profile.actions?.explore ?? navContent.exploreLabel}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={profile.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  title="GitHub"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate transition-colors duration-150 hover:text-clay"
                >
                  <GithubIcon size={20} />
                </a>
                <a
                  href={profile.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  title="LinkedIn"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate transition-colors duration-150 hover:text-clay"
                >
                  <LinkedinIcon size={20} />
                </a>
              </div>
            </div>

            <p
              data-hero-item
              className="mt-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-faint"
            >
              <Crosshair size={14} className="shrink-0 text-clay" aria-hidden="true" />
              <span className="pointer-coarse:hidden">{sitePlan.hint}</span>
              <span className="hidden pointer-coarse:inline">{sitePlan.hintTouch}</span>
            </p>
          </div>

          <div className="relative px-3 pb-8 pt-6 sm:px-8 sm:pb-12 lg:py-10 lg:pl-4 lg:pr-10">
            <SitePlan />
          </div>
        </div>

        <StatStrip stats={profile.stats} />
      </div>
    </section>
  )
}

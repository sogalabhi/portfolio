import { Link } from 'react-router-dom'
import { track } from '@vercel/analytics'
import SitePlan from '../components/hero/SitePlan'
import copy from '../content/another.json'
import navContent from '../content/nav.json'
import profile from '../content/profile.json'
import sitePlan from '../content/site-plan.json'
import sections from '../content/sections.json'

const { hero } = copy
const { titleBlock } = sitePlan

function Cell({ label, value, className = '' }) {
  return (
    <div className={`border-ink px-3 py-1.5 ${className}`}>
      <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint">{label}</dt>
      <dd className="bp-button text-ink">{value}</dd>
    </div>
  )
}

export default function Hero() {
  const link = 'bp-button text-ink underline decoration-2 underline-offset-4 hover:text-clay'
  return (
    <section id="hero" className="bp-sheet px-5 pb-8 pt-4 md:px-8">
      <div className="mx-auto grid max-w-[1400px] items-center gap-x-6 gap-y-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)]">
        <div className="relative z-10">
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-faint">{hero.eyebrow}</p>
          {/* the stamp */}
          <p className="bp-hand mt-4 inline-block -rotate-3 border-[3px] border-current px-3 py-1">
            <span className="bp-button block !text-current">
              {hero.stamp}: {profile.availability}
            </span>
          </p>
          <h1 className="mt-4 max-w-[8ch] text-ink">{profile.name}</h1>
          <p className="mt-5 max-w-[36ch] text-lg leading-relaxed text-slate">{profile.tagline}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href={profile.links.resume}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('resume_download', { source: 'another_hero' })}
              className="bp-button bg-ink px-5 py-2.5 text-paper"
            >
              {navContent.resumeLabel} ↓
            </a>
            <Link to="/world" className="bp-button border-2 border-ink px-5 py-2 text-ink hover:bg-ink hover:text-paper">
              {hero.explore} →
            </Link>
            <span className="flex gap-5">
              <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className={link}>
                {sections.contact.github}
              </a>
              <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className={link}>
                {sections.contact.linkedin}
              </a>
            </span>
          </div>
        </div>

        <div id="world-banner">
          <SitePlan />
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <p className="bp-hand max-w-[26ch] -rotate-2 text-lg max-sm:hidden">↑ {hero.note}</p>
            <dl className="ml-auto grid w-full max-w-sm grid-cols-[1.4fr_1fr_0.8fr] border-2 border-ink">
              <Cell label={titleBlock.drawingLabel} value={titleBlock.drawing} className="col-span-3 border-b" />
              <Cell label={hero.drawnLabel} value={hero.drawn} />
              <Cell label={hero.scaleLabel} value={hero.scale} className="border-l" />
              <Cell label={titleBlock.sheetLabel} value={titleBlock.sheet} className="border-l" />
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}

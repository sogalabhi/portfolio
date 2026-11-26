import { useEffect, useState } from 'react'
import { ScrollTrigger } from '../lib/gsap'
import { FIGURES } from '../components/work/figures'
import ProjectGrid from '../components/work/ProjectGrid'
import fill from '../lib/fill'
import copy from '../content/another.json'
import sections from '../content/sections.json'
import projects from '../content/projects.json'

const { tracks, card, index } = sections.work
const ordered = [...projects].sort((a, b) => a.order - b.order)
const LINKS = [
  ['live', card.live],
  ['playStore', card.playStore],
  ['demo', card.demo],
  ['github', card.github],
]

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-2 border-b border-line py-1.5">
      <dt className="bp-button !text-sm text-faint">{label}</dt>
      <dd className="text-[13px] leading-snug text-ink">{children}</dd>
    </div>
  )
}

function Card({ project, number }) {
  const [view, setView] = useState('drawing')
  const extra = copy.projects[project.id] ?? {}
  const Figure = FIGURES[project.figure?.type]
  const shot = project.screenshot
  const built = shot && view === 'built'

  return (
    <li className="flex flex-col">
      <p className="bp-hand mb-1 h-6 -rotate-1 text-right text-[15px]">{extra.note && `${extra.note} ↓`}</p>
      <div className="bp-plate relative aspect-[16/10] overflow-hidden border-2 border-ink/80">
        {built ? (
          <a href={shot.src} target="_blank" rel="noopener noreferrer">
            <img
              src={shot.src}
              alt={shot.alt}
              className={`h-full w-full ${shot.fit === 'contain' ? 'object-contain' : 'object-cover object-top'}`}
            />
          </a>
        ) : (
          Figure && <Figure figure={project.figure} title={project.figure.caption} active />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-faint">
          {card.figure} {number} · {built ? shot.caption : project.figure?.caption}
        </p>
        {shot && (
          <button
            type="button"
            onClick={() => setView(built ? 'drawing' : 'built')}
            className="bp-button min-h-8 shrink-0 cursor-pointer !text-sm text-ink underline underline-offset-4 hover:text-clay"
          >
            {built ? card.drawing : card.built}
          </button>
        )}
      </div>
      <h3 className="mt-2 text-ink">{project.title}</h3>
      {project.result && <p className="mt-1 text-sm font-semibold text-ink">{project.result}</p>}
      <p className="mt-1 text-sm leading-relaxed text-slate">{project.tagline}</p>
      <dl className="mt-auto pt-3">
        <div className="border-t-2 border-ink" />
        {extra.role && <Row label={copy.labels.role}>{extra.role}</Row>}
        <Row label={copy.labels.stack}>{project.stack.slice(0, 6).join(', ')}</Row>
        <Row label={copy.labels.links}>
          <span className="flex flex-wrap gap-4">
            {LINKS.filter(([key]) => project.links[key]).map(([key, label]) => (
              <a
                key={key}
                href={project.links[key]}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-clay"
              >
                {label} ↗
              </a>
            ))}
          </span>
        </Row>
      </dl>
    </li>
  )
}

export default function Work() {
  const [trackId, setTrackId] = useState(() => {
    const wanted = new URLSearchParams(window.location.search).get('role')
    return tracks.some((t) => t.id === wanted) ? wanted : tracks[0].id
  })
  const [open, setOpen] = useState(false)
  const picked = tracks.find((t) => t.id === trackId).projects
  const featured = picked.map((id) => projects.find((p) => p.id === id))
  const more = ordered.filter((p) => !picked.includes(p.id))

  useEffect(() => {
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [open, trackId])

  return (
    <div className="mt-6">
      <div role="group" aria-label={sections.work.tracksLabel} className="inline-flex border-2 border-ink">
        {tracks.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={trackId === t.id}
            onClick={() => setTrackId(t.id)}
            className={`bp-button min-h-11 cursor-pointer px-5 ${trackId === t.id ? 'bg-ink text-paper' : 'text-ink hover:text-clay'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul key={trackId} className="mt-4 grid gap-x-8 gap-y-8 md:grid-cols-2">
        {featured.map((project, i) => (
          <Card key={project.id} project={project} number={i + 1} />
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="bp-button mt-8 min-h-11 cursor-pointer text-ink underline underline-offset-4 hover:text-clay"
      >
        {open ? index.hide : fill(index.show, { count: more.length })}
      </button>
      {open && <ProjectGrid key={trackId} projects={more} label={index.indexLabel} compact />}
    </div>
  )
}

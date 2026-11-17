import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { track } from '@vercel/analytics'
import { GithubIcon } from '../misc/BrandIcons'
import { FIGURES } from './figures'
import sections from '../../content/sections.json'
import fill from '../../lib/fill'

const copy = sections.work.card
const ROLES = sections.work.roles

function primaryLink(project) {
  const { live, playStore, demo, github } = project.links
  const external = live || playStore || demo
  const label = live ? copy.live : playStore ? copy.playStore : copy.demo
  return { external, label, title: external || github, titleType: external ? 'live' : 'github' }
}

function Links({ project }) {
  const { external, label } = primaryLink(project)
  const linkClass =
    'inline-flex min-h-6 items-center gap-1.5 text-sm text-slate transition-colors duration-150 hover:text-clay'
  return (
    <div className="flex flex-wrap items-center gap-4">
      {project.links.github && (
        <a
          href={project.links.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={fill(copy.githubLabel, { title: project.title })}
          onClick={() => track('project_link_click', { project: project.id, type: 'github' })}
          className={linkClass}
        >
          <GithubIcon size={14} aria-hidden="true" />
          {copy.github}
        </a>
      )}
      {external && (
        <a
          href={external}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${project.title} ${label}`}
          onClick={() => track('project_link_click', { project: project.id, type: 'live' })}
          className={linkClass}
        >
          {label}
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
      {!project.links.github && !external && <span className="text-sm text-slate">{copy.private}</span>}
    </div>
  )
}

function Title({ project, className }) {
  const { title, titleType } = primaryLink(project)
  return (
    <h3 className={className}>
      {title ? (
        <a
          href={title}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('project_link_click', { project: project.id, type: titleType })}
          className="transition-colors duration-150 hover:text-clay"
        >
          {project.title}
        </a>
      ) : (
        project.title
      )}
    </h3>
  )
}

// The figure plate: the drawing by default and, when the project has a
// screenshot, the built thing behind the Drawing | Built switch (ViewSwitch,
// a tab on the plate's top edge, so it never covers the drawing).
function Plate({ project, view }) {
  const Figure = FIGURES[project.figure?.type]
  const shot = project.screenshot
  const built = view === 'built' || !Figure

  return (
    <div className="relative aspect-[16/10] overflow-hidden border border-ink/30 bg-paper max-sm:-mx-6 max-sm:border-x-0">
      {Figure && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${built ? 'opacity-0' : 'opacity-100'}`}
          aria-hidden={built}
        >
          <Figure figure={project.figure} title={project.figure.caption} active={!built} />
        </div>
      )}
      {shot && (
        <a
          href={shot.src}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={fill(copy.openFull, { title: project.title })}
          onClick={() => track('project_link_click', { project: project.id, type: 'screenshot' })}
          className={`absolute inset-0 block transition-opacity duration-300 ${built ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          tabIndex={built ? 0 : -1}
          aria-hidden={!built}
        >
          <img
            src={shot.src}
            alt={shot.alt}
            width={shot.width}
            height={shot.height}
            loading="lazy"
            className={`h-full w-full ${shot.fit === 'contain' ? 'object-contain' : 'object-cover object-top'}`}
          />
        </a>
      )}

    </div>
  )
}

function ViewSwitch({ view, setView }) {
  return (
    <div
      role="group"
      aria-label={copy.viewLabel}
      className="flex h-8 border border-b-0 border-ink/30 font-mono text-[10px] uppercase tracking-[0.08em]"
    >
      {['drawing', 'built'].map((key, i) => (
        <button
          key={key}
          type="button"
          aria-pressed={view === key}
          onClick={() => setView(key)}
          className={`h-full cursor-pointer px-2.5 transition-colors duration-150 ${i ? 'border-l border-ink/30' : ''} ${
            view === key ? 'bg-ink text-paper' : 'text-slate hover:text-clay'
          }`}
        >
          {copy[key]}
        </button>
      ))}
    </div>
  )
}

function FeaturedCard({ project, number }) {
  const [view, setView] = useState('drawing')
  const switchable = Boolean(project.figure && FIGURES[project.figure.type] && project.screenshot)
  return (
    <li data-reveal className="flex flex-col">
      <figure>
        <div className="flex h-8 items-end justify-between font-mono text-[11px] uppercase tracking-[0.08em]">
          <span className="pb-1.5 text-ink">
            {copy.figure} {number}
          </span>
          {switchable && <ViewSwitch view={view} setView={setView} />}
        </div>
        <Plate project={project} view={switchable ? view : 'drawing'} />
        <figcaption className="mt-2.5 flex items-start justify-between gap-4 font-mono text-[11px] uppercase leading-snug tracking-[0.06em]">
          <span className="text-slate">
            {switchable && view === 'built' ? project.screenshot.caption : project.figure?.caption}
          </span>
          <span className="flex shrink-0 gap-1">
            {project.roles.map((role) => (
              <span key={role} className="border border-ink/25 px-1.5 text-[10px] text-slate">
                {ROLES[role]}
              </span>
            ))}
          </span>
        </figcaption>
      </figure>

      <Title project={project} className="mt-6 font-display text-2xl font-semibold text-ink" />
      {project.result && <p className="mt-1.5 font-mono text-xs leading-relaxed text-moss">{project.result}</p>}
      <p className="mt-3 text-[15px] leading-relaxed text-slate">{project.tagline}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={copy.stackLabel}>
        {project.stack.slice(0, 6).map((item) => (
          <li key={item} className="bg-sand/60 px-1.5 py-0.5 font-mono text-[11px] leading-tight text-ink/80">
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-5">
        <Links project={project} />
      </div>
    </li>
  )
}

// one line of the index: register number, title, roles, tagline, stack
function IndexRow({ project }) {
  return (
    <li data-reveal className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-2 border-b border-line py-4">
      <span className="pt-1 font-mono text-[11px] text-faint">{String(project.order).padStart(2, '0')}</span>
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <Title project={project} className="font-display text-lg font-semibold leading-snug text-ink" />
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-faint">
            {project.roles.map((role) => ROLES[role]).join(' · ')}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate">{project.tagline}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="font-mono text-[11px] text-faint">{project.stack.slice(0, 4).join(' · ')}</p>
          <Links project={project} />
        </div>
      </div>
    </li>
  )
}

export default function ProjectCard({ project, compact = false, number }) {
  return compact ? <IndexRow project={project} /> : <FeaturedCard project={project} number={number} />
}

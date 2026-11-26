import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { track } from '@vercel/analytics'
import { ScrollTrigger } from '../../lib/gsap'
import sections from '../../content/sections.json'
import fill from '../../lib/fill'
import ProjectGrid from './ProjectGrid'

const copy = sections.work.index
const ROLES = sections.work.roles
const TRACKS = sections.work.tracks

// ?role=ai opens the page on that track, so each kind of recruiter can be
// sent their own link
function initialTrack() {
  const wanted = new URLSearchParams(window.location.search).get('role')
  return TRACKS.some((t) => t.id === wanted) ? wanted : TRACKS[0].id
}

// The chosen track's featured plates, then everything else as an index: a register of
// compact rows, filterable by the role tags every project carries.
export default function ProjectExplorer({ projects }) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState('all')
  const [trackId, setTrackId] = useState(initialTrack)
  const picked = TRACKS.find((t) => t.id === trackId).projects
  const featured = picked.map((id) => projects.find((project) => project.id === id))
  const more = projects.filter((project) => !picked.includes(project.id))
  const shown = role === 'all' ? more : more.filter((project) => project.roles.includes(role))
  const filters = [
    ['all', copy.all, more.length],
    ...Object.entries(ROLES).map(([key, label]) => [key, label, more.filter((p) => p.roles.includes(key)).length]),
  ]

  // the page below just changed height; re-measure every scroll trigger
  useEffect(() => {
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [open, role, trackId])

  function toggleMore() {
    setOpen((value) => !value)
    track('more_projects_toggle', { expanded: !open })
  }

  function pickTrack(id) {
    setTrackId(id)
    const url = new URL(window.location.href)
    url.searchParams.set('role', id)
    window.history.replaceState(window.history.state, '', url)
    track('track_switch', { track: id })
  }

  function pick(key) {
    setRole(key)
    track('project_filter', { role: key })
  }

  return (
    <div>
      <div role="group" aria-label={sections.work.tracksLabel} className="mb-10 inline-flex border border-ink/30 print:hidden">
        {TRACKS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={trackId === t.id}
            onClick={() => pickTrack(t.id)}
            className={`min-h-11 cursor-pointer px-5 font-mono text-xs uppercase tracking-[0.08em] transition-colors duration-150 ${i ? 'border-l border-ink/30' : ''} ${
              trackId === t.id ? 'bg-ink text-paper' : 'text-slate hover:text-clay'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* keyed, so a new track gets fresh plates and reveals */}
      <ProjectGrid key={trackId} projects={featured} label={copy.featuredLabel} />

      {more.length > 0 && (
        <div className="mt-16 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-ink/25 pt-4">
            <button
              type="button"
              onClick={toggleMore}
              aria-expanded={open}
              aria-controls="more-projects"
              className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 font-mono text-xs uppercase tracking-[0.08em] text-clay"
            >
              {open ? copy.hide : fill(copy.show, { count: more.length })}
              <ChevronDown
                size={16}
                className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {open && (
              <div role="group" aria-label={copy.filterLabel} className="flex flex-wrap gap-1.5">
                {filters.map(([key, label, count]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={role === key}
                    onClick={() => pick(key)}
                    className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 border px-2.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors duration-150 ${
                      role === key
                        ? 'border-ink bg-ink text-paper'
                        : 'border-ink/25 text-slate hover:border-clay hover:text-clay'
                    }`}
                  >
                    {label}
                    <span className={role === key ? 'text-paper/70' : 'text-faint'}>{count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div id="more-projects" hidden={!open} className="mt-2">
            {open && <ProjectGrid key={role} projects={shown} label={copy.indexLabel} compact />}
          </div>
        </div>
      )}
    </div>
  )
}

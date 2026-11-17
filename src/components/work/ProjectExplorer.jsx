import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { track } from '@vercel/analytics'
import { ScrollTrigger } from '../../lib/gsap'
import sections from '../../content/sections.json'
import fill from '../../lib/fill'
import ProjectGrid from './ProjectGrid'

const copy = sections.work.index
const ROLES = sections.work.roles

// The four featured plates, then everything else as an index: a register of
// compact rows, filterable by the role tags every project carries.
export default function ProjectExplorer({ projects }) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState('all')
  const featured = projects
    .filter((project) => project.featured)
    .sort((a, b) => a.featuredOrder - b.featuredOrder)
  const more = projects.filter((project) => !project.featured)
  const shown = role === 'all' ? more : more.filter((project) => project.roles.includes(role))
  const filters = [
    ['all', copy.all, more.length],
    ...Object.entries(ROLES).map(([key, label]) => [key, label, more.filter((p) => p.roles.includes(key)).length]),
  ]

  // the page below just changed height; re-measure every scroll trigger
  useEffect(() => {
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [open, role])

  function toggleMore() {
    setOpen((value) => !value)
    track('more_projects_toggle', { expanded: !open })
  }

  function pick(key) {
    setRole(key)
    track('project_filter', { role: key })
  }

  return (
    <div>
      <ProjectGrid projects={featured} label={copy.featuredLabel} />

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

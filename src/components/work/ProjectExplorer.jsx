import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { track } from '@vercel/analytics'
import { ScrollTrigger } from '../../lib/gsap'
import ProjectGrid from './ProjectGrid'

export default function ProjectExplorer({ projects }) {
  const [open, setOpen] = useState(false)
  const featured = projects
    .filter((project) => project.featured)
    .sort((a, b) => a.featuredOrder - b.featuredOrder)
  const more = projects.filter((project) => !project.featured)

  useEffect(() => {
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [open])

  function toggleMore() {
    setOpen((value) => !value)
    track('more_projects_toggle', { expanded: !open })
  }

  return (
    <div>
      <ProjectGrid projects={featured} label="Featured projects" />

      {more.length > 0 && (
        <div className="mt-6 print:hidden">
          <button
            type="button"
            onClick={toggleMore}
            aria-expanded={open}
            aria-controls="more-projects"
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-medium text-clay"
          >
            {open ? 'Hide extra projects' : `Show ${more.length} more`}
            <ChevronDown
              size={16}
              className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
          <div id="more-projects" hidden={!open} className="mt-4">
            {open && <ProjectGrid projects={more} label="More projects" compact />}
          </div>
        </div>
      )}
    </div>
  )
}

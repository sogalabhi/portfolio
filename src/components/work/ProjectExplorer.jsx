import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { track } from '@vercel/analytics'
import { ScrollTrigger } from '../../lib/gsap'
import sections from '../../content/sections.json'
import fill from '../../lib/fill'
import ProjectGrid from './ProjectGrid'

const copy = sections.work.index
const FEATURED = sections.work.featured

// The best work first, as figure plates, in the order sections.json lists
// it; everything else in an index underneath, closed until asked for.
export default function ProjectExplorer({ projects }) {
  const [open, setOpen] = useState(false)
  const featured = FEATURED.map((id) => projects.find((project) => project.id === id))
  const more = projects.filter((project) => !FEATURED.includes(project.id))

  // the page below just changed height; re-measure every scroll trigger
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
      <ProjectGrid projects={featured} label={copy.featuredLabel} />

      {more.length > 0 && (
        <div className="mt-16 print:hidden">
          <div className="border-t border-ink/25 pt-4">
            <button
              type="button"
              onClick={toggleMore}
              aria-expanded={open}
              aria-controls="more-projects"
              className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-medium text-clay"
            >
              {open ? copy.hide : fill(copy.show, { count: more.length })}
              <ChevronDown
                size={16}
                className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>
          <div id="more-projects" hidden={!open} className="mt-2">
            {open && <ProjectGrid projects={more} label={copy.indexLabel} compact />}
          </div>
        </div>
      )}
    </div>
  )
}

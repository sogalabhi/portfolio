import { ExternalLink } from 'lucide-react'
import useGsapReveal from '../../hooks/useGsapReveal'
import achievements from '../../content/achievements.json'
import sections from '../../content/sections.json'
import fill from '../../lib/fill'
import { GithubIcon } from './BrandIcons'

const copy = sections.achievements.links

export default function Achievements() {
  const revealRef = useGsapReveal({ batch: true, stagger: 0.06 })

  return (
    <div>
      <p className="mb-6 font-mono text-sm text-moss">{achievements.summary}</p>

      <ul ref={revealRef} className="divide-y divide-line border-t border-line">
        {achievements.hackathons.map((item) => {
          const project = item.project.split(': ')[0]
          return (
            <li key={item.event} data-reveal className="grid gap-x-8 gap-y-2 py-6 sm:grid-cols-[12rem_minmax(0,1fr)]">
              <span className="font-mono text-lg leading-snug text-clay">{item.result}</span>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">{item.event}</h3>
                <p className="mt-1 text-sm text-slate">{item.project}</p>
                {item.oneLiner && item.oneLiner !== 'NEEDS_INPUT' && (
                  <p className="mt-1 text-sm text-faint">{item.oneLiner}</p>
                )}
                {(item.links.github || item.links.demo) && (
                  <div className="mt-3 flex flex-wrap gap-4">
                    {item.links.github && (
                      <a
                        href={item.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={fill(copy.githubLabel, { project })}
                        className="inline-flex min-h-6 items-center gap-1.5 text-sm text-slate transition-colors duration-150 hover:text-clay"
                      >
                        <GithubIcon size={14} aria-hidden="true" />
                        {copy.github}
                      </a>
                    )}
                    {item.links.demo && (
                      <a
                        href={item.links.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={fill(copy.demoLabel, { project })}
                        className="inline-flex min-h-6 items-center gap-1.5 text-sm text-slate transition-colors duration-150 hover:text-clay"
                      >
                        {copy.demo}
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

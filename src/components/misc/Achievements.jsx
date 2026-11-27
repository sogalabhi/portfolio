import { ExternalLink } from 'lucide-react'
import useGsapReveal from '../../hooks/useGsapReveal'
import achievements from '../../content/achievements.json'
import sections from '../../content/sections.json'
import fill from '../../lib/fill'
import { GithubIcon } from './BrandIcons'
import Logo from './Logo'
import StackLine from './StackLine'

const copy = sections.achievements.links
const linkClass =
  'inline-flex min-h-6 items-center gap-1.5 text-sm text-slate transition-colors duration-150 hover:text-clay'

export default function Achievements() {
  const revealRef = useGsapReveal({ batch: true, stagger: 0.06 })

  return (
    <ul ref={revealRef} className="mt-2 divide-y divide-line">
      {achievements.hackathons.map((item) => (
        <li
          key={item.event}
          data-reveal
          className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 py-7"
        >
          <div>{item.logo && <Logo src={item.logo} alt="" />}</div>
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <h3 className="text-lg text-ink">{item.event}</h3>
              <span className="font-mono text-[13px] text-faint">{item.date}</span>
            </div>
            <p className="text-moss">
              {item.result}
              <span className="text-slate"> · {item.project}</span>
            </p>
            <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-slate">{item.oneLiner}</p>
            <StackLine items={item.stack} className="mt-2" />
            {(item.links.github || item.links.demo) && (
              <div className="mt-3 flex flex-wrap gap-4">
                {item.links.github && (
                  <a
                    href={item.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={fill(copy.githubLabel, { project: item.project })}
                    className={linkClass}
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
                    aria-label={fill(copy.demoLabel, { project: item.project })}
                    className={linkClass}
                  >
                    {copy.demo}
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

import { ExternalLink, Trophy } from 'lucide-react'
import { track } from '@vercel/analytics'
import { GithubIcon } from '../misc/BrandIcons'

export default function ProjectCard({ project }) {
  return (
    <li data-reveal className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 py-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h3 className="font-display text-lg font-semibold text-ink">{project.title}</h3>
          {project.hackathon && (
            <span className="inline-flex items-center gap-1 font-mono text-xs text-clay">
              <Trophy size={11} aria-hidden="true" />
              {project.hackathon}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate">{project.tagline}</p>
        {project.stack.length > 0 && (
          <p className="mt-2 font-mono text-xs text-faint">{project.stack.slice(0, 3).join('  ·  ')}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {project.links.github && (
          <a
            href={project.links.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} on GitHub`}
            onClick={() => track('project_link_click', { project: project.id, type: 'github' })}
            className="text-ink transition-colors duration-150 hover:text-clay"
          >
            <GithubIcon size={16} />
          </a>
        )}
        {(project.links.live || project.links.demo) && (
          <a
            href={project.links.live || project.links.demo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} live link`}
            onClick={() => track('project_link_click', { project: project.id, type: 'live' })}
            className="text-ink transition-colors duration-150 hover:text-clay"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </li>
  )
}

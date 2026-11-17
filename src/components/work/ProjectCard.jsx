import { ExternalLink } from 'lucide-react'
import { track } from '@vercel/analytics'
import { GithubIcon } from '../misc/BrandIcons'

export default function ProjectCard({ project, compact = false }) {
  const externalLink = project.links.live || project.links.playStore || project.links.demo
  const externalLabel = project.links.live ? 'Live' : project.links.playStore ? 'Play Store' : 'Demo'
  const titleLink = externalLink || project.links.github
  const titleLinkType = externalLink ? 'live' : 'github'

  return (
    <li
      data-reveal
      className={compact
        ? 'py-5'
        : 'flex flex-col rounded-xl border border-line bg-card/70 p-5 transition-colors duration-150 hover:border-clay/40 md:p-6'}
    >
      <h3 className="font-display text-xl font-semibold text-ink">
        {titleLink ? (
          <a
            href={titleLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('project_link_click', { project: project.id, type: titleLinkType })}
            className="transition-colors duration-150 hover:text-clay"
          >
            {project.title}
          </a>
        ) : project.title}
      </h3>
      {!compact && project.result && (
        <p className="mt-2 font-mono text-xs leading-relaxed text-moss">{project.result}</p>
      )}
      <div className="mb-4 mt-3 flex flex-col items-start gap-4 sm:flex-row">
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-slate">{project.tagline}</p>
        {!compact && project.screenshot && (
          <a
            href={project.screenshot.src}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View full screenshot of ${project.title}`}
            onClick={() => track('project_link_click', { project: project.id, type: 'screenshot' })}
            className="block w-36 shrink-0 overflow-hidden rounded-lg border border-line transition-opacity duration-150 hover:opacity-80 sm:w-32"
          >
            <img
              src={project.screenshot.src}
              alt={project.screenshot.alt}
              width={project.screenshot.width}
              height={project.screenshot.height}
              loading="lazy"
              className="h-auto w-full"
            />
          </a>
        )}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-4">
        {project.links.github && (
          <a
            href={project.links.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} on GitHub`}
            onClick={() => track('project_link_click', { project: project.id, type: 'github' })}
            className="inline-flex min-h-6 items-center gap-1.5 text-sm text-slate transition-colors duration-150 hover:text-clay"
          >
            <GithubIcon size={14} aria-hidden="true" />
            GitHub
          </a>
        )}
        {externalLink && (
          <a
            href={externalLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} ${externalLabel}`}
            onClick={() => track('project_link_click', { project: project.id, type: 'live' })}
            className="inline-flex min-h-6 items-center gap-1.5 text-sm text-slate transition-colors duration-150 hover:text-clay"
          >
            {externalLabel}
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
        {!project.links.github && !externalLink && (
          <span className="text-sm text-slate">Private project</span>
        )}
      </div>
    </li>
  )
}

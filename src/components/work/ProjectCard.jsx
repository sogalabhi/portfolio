import { ExternalLink, Trophy } from 'lucide-react'
import { track } from '@vercel/analytics'
import { GithubIcon } from '../misc/BrandIcons'

export default function ProjectCard({ project }) {
  return (
    <article
      data-reveal
      className="flex flex-col rounded-2xl border border-line bg-card p-6 transition-shadow duration-150 hover:shadow-sm"
    >
      {project.hackathon && (
        <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-clay/10 px-3 py-1 text-xs font-medium text-clay">
          <Trophy size={12} aria-hidden="true" />
          {project.hackathon}
        </span>
      )}

      <h3 className="font-display text-lg font-semibold text-ink">{project.title}</h3>
      <p className="mt-2 flex-1 text-sm text-slate">{project.tagline}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.stack.slice(0, 3).map((tech, i) => (
          <span
            key={i}
            className="rounded-full bg-sand px-2.5 py-1 font-mono text-xs text-ink"
          >
            {tech}
          </span>
        ))}
      </div>

      <div className="mt-5 flex gap-4">
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
    </article>
  )
}

import { ExternalLink, Smartphone } from 'lucide-react'
import { track } from '@vercel/analytics'
import { GithubIcon } from '../misc/BrandIcons'

export default function FeaturedCard({ project, index }) {
  const reversed = index % 2 === 1
  const order = String(index + 1).padStart(2, '0')

  return (
    <article
      data-reveal
      className="grid gap-8 rounded-2xl border border-line bg-card p-6 md:grid-cols-2 md:gap-10 md:p-8"
    >
      <div
        className={`flex aspect-video items-center justify-center rounded-xl border border-dashed border-line bg-paper text-sm text-faint md:aspect-auto ${
          reversed ? 'md:order-2' : ''
        }`}
      >
        {project.media?.[0] ? (
          <img
            src={project.media[0]}
            alt={`Screenshot of ${project.title}`}
            className="h-full w-full rounded-xl object-cover"
            loading="lazy"
            width={640}
            height={400}
          />
        ) : (
          <span>Screenshot / diagram needed</span>
        )}
      </div>

      <div className={`flex flex-col justify-center ${reversed ? 'md:order-1' : ''}`}>
        <p className="font-mono text-sm text-faint">
          {order} · {project.domain}
        </p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-ink">
          {project.title}
        </h3>
        <p className="mt-3 text-slate">{project.tagline}</p>

        {project.links.playStore && (
          <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-moss/10 px-3 py-1.5 text-sm font-medium text-moss">
            <Smartphone size={14} aria-hidden="true" />
            {project.impact}
          </div>
        )}

        {!project.links.playStore && project.impact && (
          <p className="mt-4 font-mono text-sm text-moss">{project.impact}</p>
        )}

        <ul className="mt-4 space-y-2 text-slate">
          {project.whatIBuilt.map((bullet, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-2">
          {project.stack.map((tech, i) => (
            <span
              key={i}
              className="rounded-full bg-sand px-3 py-1 font-mono text-xs text-ink"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="mt-6 flex gap-4">
          {project.links.github && (
            <a
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('project_link_click', { project: project.id, type: 'github' })}
              className="inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors duration-150 hover:text-clay"
            >
              <GithubIcon size={16} />
              GitHub
            </a>
          )}
          {(project.links.live || project.links.playStore || project.links.demo) && (
            <a
              href={project.links.live || project.links.playStore || project.links.demo}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('project_link_click', { project: project.id, type: 'live' })}
              className="inline-flex items-center gap-2 text-sm font-medium text-clay"
            >
              Live
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

import useGsapReveal from '../../hooks/useGsapReveal'
import ProjectCard from './ProjectCard'

export default function ProjectGrid({ projects, label, compact = false }) {
  const revealRef = useGsapReveal({ batch: true, stagger: 0.06 })

  if (projects.length === 0) return null

  return (
    <ul
      ref={revealRef}
      aria-label={label}
      className={compact ? 'divide-y divide-line border-t border-line' : 'grid grid-cols-1 gap-4 md:grid-cols-2'}
    >
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} compact={compact} />
      ))}
    </ul>
  )
}

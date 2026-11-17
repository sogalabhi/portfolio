import useGsapReveal from '../../hooks/useGsapReveal'
import ProjectCard from './ProjectCard'

export default function ProjectGrid({ projects, label, compact = false }) {
  const revealRef = useGsapReveal({ batch: true, stagger: 0.06 })

  if (projects.length === 0) return null

  return (
    <ul
      ref={revealRef}
      aria-label={label}
      className={
        compact
          ? 'border-t border-line md:grid md:grid-cols-2 md:gap-x-10'
          : 'grid grid-cols-1 gap-x-10 gap-y-16 md:grid-cols-2'
      }
    >
      {projects.map((project, i) => (
        <ProjectCard key={project.id} project={project} compact={compact} number={i + 1} />
      ))}
    </ul>
  )
}

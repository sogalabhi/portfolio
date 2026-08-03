import useGsapReveal from '../../hooks/useGsapReveal'
import ProjectCard from './ProjectCard'

export default function ProjectGrid({ projects }) {
  const revealRef = useGsapReveal({ batch: true, stagger: 0.06 })

  if (projects.length === 0) return null

  return (
    <div ref={revealRef} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

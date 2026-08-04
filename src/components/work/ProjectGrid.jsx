import useGsapReveal from '../../hooks/useGsapReveal'
import ProjectCard from './ProjectCard'

export default function ProjectGrid({ projects }) {
  const revealRef = useGsapReveal({ batch: true, stagger: 0.06 })

  if (projects.length === 0) return null

  return (
    <ul ref={revealRef} className="divide-y divide-line border-t border-line">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </ul>
  )
}

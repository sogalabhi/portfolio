import skills from '../../content/skills-summary.json'
import useGsapReveal from '../../hooks/useGsapReveal'
import SkillGroup from './SkillGroup'

export default function SkillsSummary() {
  const revealRef = useGsapReveal({ stagger: 0.02, y: 8 })

  return (
    <div ref={revealRef} className="mt-8 divide-y divide-line border-t border-line">
      {skills.map((group) => (
        <SkillGroup key={group.group} group={group.group} skills={group.skills} />
      ))}
    </div>
  )
}

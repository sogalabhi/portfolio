export default function SkillGroup({ group, skills }) {
  return (
    <div>
      <h3 className="font-display text-base font-semibold text-ink">{group}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {skills.map((skill, i) => (
          <span
            key={i}
            data-reveal
            className="rounded-full bg-sand px-3 py-1.5 font-mono text-[13px] text-ink"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
}

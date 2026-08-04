export default function SkillGroup({ group, skills }) {
  return (
    <div data-reveal className="flex flex-col gap-2 py-5 sm:flex-row sm:items-baseline sm:gap-8">
      <h3 className="shrink-0 font-mono text-xs uppercase tracking-[0.08em] text-faint sm:w-44">
        {group}
      </h3>
      <p className="font-mono text-[15px] leading-relaxed text-ink">{skills.join('  ·  ')}</p>
    </div>
  )
}

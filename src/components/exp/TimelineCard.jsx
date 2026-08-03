export default function TimelineCard({ experience }) {
  return (
    <div data-reveal className="relative pl-8">
      <span className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-clay" aria-hidden="true" />

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-xl font-semibold text-ink">{experience.org}</h3>
        <span className="text-sm text-faint">{experience.period}</span>
      </div>

      <p className="mt-1 font-mono text-xs text-faint">{experience.stack.join(' · ')}</p>

      <ul className="mt-4 space-y-1 border-l border-line pl-4">
        {experience.roles.map((role) => (
          <li key={`${role.title}-${role.period}`} className="flex flex-wrap justify-between gap-x-4 text-sm">
            <span className="text-ink">{role.title}</span>
            <span className="text-faint">{role.period}</span>
          </li>
        ))}
      </ul>

      <ul className="mt-4 space-y-2 text-slate">
        {experience.bullets.map((bullet, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden="true">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      {experience.note && (
        <p className="mt-3 rounded-lg border border-dashed border-line bg-paper p-3 font-mono text-xs text-faint">
          {experience.note}
        </p>
      )}
    </div>
  )
}

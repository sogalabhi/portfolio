export default function TimelineCard({ experience }) {
  return (
    <div data-reveal className="grid gap-x-8 gap-y-3 border-b border-line py-8 sm:grid-cols-[13rem_1fr]">
      <div className="font-mono text-xs text-faint">
        <p className="text-sm text-ink">{experience.org}</p>
        <p className="mt-1">{experience.period}</p>
        <p className="mt-3">{experience.stack.join('  ·  ')}</p>
      </div>

      <div>
        <ul className="space-y-1">
          {experience.roles.map((role) => (
            <li key={`${role.title}-${role.period}`} className="flex flex-wrap justify-between gap-x-4 text-sm">
              <span className="text-ink">{role.title}</span>
              <span className="font-mono text-xs text-faint">{role.period}</span>
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

        {experience.note && <p className="mt-3 font-mono text-xs text-faint">{experience.note}</p>}
      </div>
    </div>
  )
}

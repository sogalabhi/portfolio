export default function EducationBlock({ education }) {
  return (
    <div className="space-y-6">
      {education.map((entry) => (
        <div key={entry.institution}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 className="font-display text-lg font-semibold text-ink">{entry.institution}</h3>
            <span className="text-sm text-faint">{entry.period}</span>
          </div>
          <ul className="mt-2 space-y-1 text-slate">
            {entry.degrees.map((degree) => (
              <li key={degree.label}>
                {degree.label} - {degree.detail}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

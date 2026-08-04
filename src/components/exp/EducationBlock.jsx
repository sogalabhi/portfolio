export default function EducationBlock({ education }) {
  return (
    <div className="divide-y divide-line border-t border-line">
      {education.map((entry) => (
        <div key={entry.institution} className="py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 className="font-display text-lg font-semibold text-ink">{entry.institution}</h3>
            <span className="font-mono text-xs text-faint">{entry.period}</span>
          </div>
          <p className="mt-1 text-slate">
            {entry.degrees.map((d) => `${d.label} - ${d.detail}`).join('  ·  ')}
          </p>
        </div>
      ))}
    </div>
  )
}

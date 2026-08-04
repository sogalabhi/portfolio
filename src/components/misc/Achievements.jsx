import useGsapReveal from '../../hooks/useGsapReveal'
import achievements from '../../content/achievements.json'

export default function Achievements() {
  const revealRef = useGsapReveal({ batch: true, stagger: 0.06 })

  return (
    <div>
      <p className="mb-8 font-mono text-sm text-moss">{achievements.summary}</p>

      <ul ref={revealRef} className="divide-y divide-line border-t border-line">
        {achievements.hackathons.map((item) => (
          <li key={item.event} data-reveal className="flex flex-wrap items-baseline gap-x-6 gap-y-2 py-6">
            <span className="font-mono text-3xl font-medium text-clay sm:w-40 sm:shrink-0">
              {item.result}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-semibold text-ink">{item.event}</h3>
              <p className="mt-1 text-sm text-slate">{item.project}</p>
              {item.oneLiner && item.oneLiner !== 'NEEDS_INPUT' && (
                <p className="mt-1 text-sm text-faint">{item.oneLiner}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

import useGsapReveal from '../../hooks/useGsapReveal'
import achievements from '../../content/achievements.json'

export default function Achievements() {
  const revealRef = useGsapReveal({ batch: true, stagger: 0.06 })

  return (
    <div>
      <p className="mb-8 font-mono text-sm text-moss">{achievements.summary}</p>

      <ul ref={revealRef} className="divide-y divide-line border-t border-line">
        {achievements.hackathons.map((item) => (
          <li key={item.event} data-reveal className="flex flex-col gap-1 py-6">
            <span className="font-mono text-xl font-medium text-clay sm:text-2xl">{item.result}</span>
            <div>
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

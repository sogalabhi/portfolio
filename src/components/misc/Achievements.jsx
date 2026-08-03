import { Trophy } from 'lucide-react'
import useGsapReveal from '../../hooks/useGsapReveal'
import achievements from '../../content/achievements.json'

export default function Achievements() {
  const revealRef = useGsapReveal({ batch: true, stagger: 0.06 })

  return (
    <div>
      <p className="mb-6 font-mono text-sm text-moss">{achievements.summary}</p>

      <div ref={revealRef} className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {achievements.hackathons.map((item) => (
          <article
            key={item.event}
            data-reveal
            className="rounded-2xl border border-line bg-card p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-base font-semibold text-ink">{item.event}</h3>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-clay/10 px-3 py-1 text-xs font-medium text-clay">
                <Trophy size={12} aria-hidden="true" />
                {item.result}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate">{item.project}</p>
            {item.oneLiner && item.oneLiner !== 'NEEDS_INPUT' && (
              <p className="mt-2 text-sm text-faint">{item.oneLiner}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

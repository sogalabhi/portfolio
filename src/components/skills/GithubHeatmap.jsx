import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '../../lib/gsap'
import useReducedMotion from '../../hooks/useReducedMotion'
import useGithubContributions from '../../hooks/useGithubContributions'

const LEVEL_COLORS = ['bg-line', 'bg-moss/25', 'bg-moss/50', 'bg-moss/75', 'bg-moss']

export default function GithubHeatmap() {
  const state = useGithubContributions()
  const gridRef = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (state.status !== 'ready' || reduced) return
      const cells = gsap.utils.toArray('[data-heatmap-cell]', gridRef.current)
      if (!cells.length) return

      gsap.from(cells, {
        opacity: 0,
        duration: 0.3,
        ease: 'power1.out',
        stagger: { each: 0.002, from: 'start' },
      })
    },
    { scope: gridRef, dependencies: [state.status, reduced] },
  )

  if (state.status === 'hidden' || state.status === 'loading') {
    return state.status === 'loading' ? (
      <div className="h-32 animate-pulse rounded-xl bg-line/40" aria-hidden="true" />
    ) : null
  }

  return (
    <div ref={gridRef} className="print:hidden">
      <div
        ref={(el) => {
          if (el) el.scrollLeft = el.scrollWidth
        }}
        className="flex gap-1 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]"
        role="img"
        aria-label={`GitHub contribution heatmap: ${state.total.toLocaleString()} contributions in the last year, ${state.streak}-day current streak`}
      >
        {state.weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                data-heatmap-cell
                title={`${day.count} contributions on ${day.date}`}
                className={`h-2.5 w-2.5 shrink-0 rounded-sm ${LEVEL_COLORS[day.level] ?? LEVEL_COLORS[0]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-sm text-faint">
        {state.total.toLocaleString()} contributions in the last year · {state.streak}-day streak
      </p>
    </div>
  )
}

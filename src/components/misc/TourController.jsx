import { useEffect, useRef } from 'react'
import { Play, Pause, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTourContext } from '../../hooks/TourContext'

export default function TourController() {
  const { state, index, stops, exit, pause, resume, next, prev, goTo } = useTourContext()
  const cardRef = useRef(null)
  const hasRunRef = useRef(false)

  const active = state !== 'idle'

  useEffect(() => {
    if (active) {
      hasRunRef.current = true
      cardRef.current?.focus()
    } else if (hasRunRef.current) {
      // the launcher lives in Hero now, not here - same data-tour-start
      // attribute KeyboardShortcuts already uses to trigger it via 't'
      document.querySelector('[data-tour-start]')?.focus()
    }
  }, [active])

  useEffect(() => {
    if (!active) return undefined

    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) exit()
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [active, exit])

  if (!active) return null

  const current = stops[index]
  const isFirst = index === 0
  const isLast = index === stops.length - 1

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-live="polite"
      aria-label="Guided tour"
      tabIndex={-1}
      className="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-line bg-card p-5 shadow-md outline-none print:hidden sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[360px]"
      style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="font-display text-sm font-semibold text-ink">{current?.title}</p>
        <button
          type="button"
          onClick={exit}
          aria-label="Exit tour"
          className="cursor-pointer text-faint transition-colors duration-150 hover:text-clay"
        >
          <X size={18} />
        </button>
      </div>

      <p className="mt-2 text-sm text-slate">{current?.note}</p>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {stops.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to ${s.title}`}
              aria-current={i === index}
              className={`h-1.5 cursor-pointer rounded-full transition-all duration-150 ${
                i === index ? 'w-6 bg-clay' : i < index ? 'w-1.5 bg-clay/40' : 'w-1.5 bg-line'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prev}
            disabled={isFirst}
            aria-label="Previous stop"
            className="cursor-pointer rounded-lg p-1.5 text-ink transition-colors duration-150 hover:text-clay disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={state === 'running' ? pause : resume}
            aria-label={state === 'running' ? 'Pause tour' : 'Resume tour'}
            className="cursor-pointer rounded-lg p-1.5 text-ink transition-colors duration-150 hover:text-clay"
          >
            {state === 'running' ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={isLast}
            aria-label="Next stop"
            className="cursor-pointer rounded-lg p-1.5 text-ink transition-colors duration-150 hover:text-clay disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

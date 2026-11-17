import { useEffect, useId, useRef, useState } from 'react'

// The sheet every project figure is drawn on: a 480x300 (16:10) viewBox on
// paper with the hero's survey grid, and the plan's 45-degree hatch for cut
// material (`hatch` is its fill url, unique per figure).
//
// Each figure animates in CSS (figures.css) on one loop of about 8s, written
// so that 0% and 100% are both the complete drawing: the reset happens in
// the first few percent, then the drawing builds back up. That way the loop
// is seamless, a paused figure shows a finished drawing, and the global
// reduced-motion rule (one 0.01ms iteration, fill-mode both) lands on it too.
// The loop only runs while the plate is on screen and `active`.
export const VIEW_W = 480
export const VIEW_H = 300
const GRID = 60

let CROSSES = ''
for (let y = GRID; y < VIEW_H; y += GRID) {
  for (let x = GRID; x < VIEW_W; x += GRID) CROSSES += `M${x - 3} ${y}h6M${x} ${y - 3}v6`
}

export function Drawing({ type, title, active = true, children }) {
  const ref = useRef(null)
  const [onScreen, setOnScreen] = useState(false)
  const hatch = `hatch-${useId().replace(/:/g, '')}`

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.15 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={`fig fig-${type} block h-full w-full text-ink`}
      data-playing={onScreen && active ? '' : undefined}
      role="img"
      aria-label={title}
    >
      <defs>
        <pattern id={hatch} width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
        </pattern>
      </defs>
      <g data-hair>
        <path d={CROSSES} stroke="currentColor" opacity="0.22" fill="none" />
      </g>
      {children(`url(#${hatch})`)}
    </svg>
  )
}

// A label with a leader that ends in a dot on the thing it names, as on the
// hero's site plan. `at` is the dot, `to` where the line meets the text;
// `anchor` is the text's alignment at `to`.
export function Leader({ at, to, anchor = 'start', children, className = '', dy = 3.5 }) {
  const pad = anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0
  return (
    <g className={className}>
      <g data-hair stroke="currentColor" fill="none" opacity="0.7">
        <path d={`M${at[0]} ${at[1]}L${to[0]} ${to[1]}`} />
      </g>
      <circle cx={at[0]} cy={at[1]} r="2" fill="currentColor" />
      <text x={to[0] + pad} y={to[1] + dy} textAnchor={anchor} className="fig-label">
        {children}
      </text>
    </g>
  )
}

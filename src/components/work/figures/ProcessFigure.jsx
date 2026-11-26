import { Drawing } from './Drawing'

// Fig. 4, Process Mining: an event log on the left becomes a Directly-Follows
// Graph on the right. Moving parts (figures.css): the log fills in, the steps
// of the process appear in order, then the slow edge is picked out in clay.

const STEPS = [
  ['order', 210, 54],
  ['payment', 210, 112],
  ['packing', 210, 188],
  ['shipping', 210, 246],
]

export default function ProcessFigure({ figure, title, active }) {
  const { labels } = figure
  return (
    <Drawing type="process" title={title} active={active}>
      {() => (
        <>
          {/* the event log */}
          <text x="24" y="44" className="fig-label">
            {labels.log}
          </text>
          <g data-hair fill="none" stroke="currentColor" opacity="0.7">
            <rect x="24" y="54" width="124" height="220" fill="var(--color-paper)" />
            <path d="M24 74H148M60 54V274" opacity="0.5" />
          </g>
          <g className="fig-pm-rows" fill="currentColor" opacity="0.4">
            {Array.from({ length: 13 }, (_, i) => (
              <g key={i}>
                <rect x="32" y={84 + i * 14.5} width="18" height="3" />
                <rect x="70" y={84 + i * 14.5} width={34 + ((i * 29) % 36)} height="3" />
              </g>
            ))}
          </g>

          <g data-hair fill="none" stroke="currentColor" opacity="0.6">
            <path d="M148 164H184l-6 -4M184 164l-6 4" />
          </g>

          {/* the graph: the usual path, plus the rework loop */}
          <text x="456" y="34" textAnchor="end" className="fig-label">
            {labels.graph}
          </text>
          <g data-hair fill="none" stroke="currentColor" opacity="0.7">
            <path className="fig-pm-edge fig-pm-edge-1" d="M260 82V112" />
            <path className="fig-pm-edge fig-pm-edge-3" d="M260 216V246" />
            <path className="fig-pm-rework" d="M310 202C362 202 362 126 310 126" strokeDasharray="4 3" />
          </g>
          <text x="344" y="210" className="fig-pm-rework fig-label fig-label-sm">
            {labels.rework}
          </text>

          {/* the bottleneck */}
          <g className="fig-pm-slow text-clay">
            <path d="M260 140V188" fill="none" stroke="currentColor" strokeWidth="3" />
            <g data-hair stroke="currentColor" fill="none">
              <path d="M268 164H376" />
            </g>
            <text x="380" y="167.5" className="fig-label fig-label-sm">
              {labels.bottleneck}
            </text>
          </g>

          {STEPS.map(([key, x, y], i) => (
            <g key={key} className={`fig-pm-step fig-pm-step-${i + 1}`}>
              <g data-hair stroke="currentColor">
                <rect x={x} y={y} width="100" height="28" rx="4" fill="var(--color-paper)" />
              </g>
              <text x={x + 50} y={y + 18} textAnchor="middle" className="fig-label">
                {labels[key]}
              </text>
            </g>
          ))}
        </>
      )}
    </Drawing>
  )
}

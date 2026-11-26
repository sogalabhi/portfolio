import { Drawing } from './Drawing'

// SysSight: agents on each host report to one server, which stores the
// metrics and sends one alert for a sustained spike. Moving parts
// (figures.css): packets run along the lines, then the single alert arrives.

const HOSTS = [56, 130, 204]

function Box({ x, y, w, label }) {
  return (
    <g>
      <g data-hair stroke="currentColor">
        <rect x={x} y={y} width={w} height="40" rx="4" fill="var(--color-paper)" />
      </g>
      <text x={x + w / 2} y={y + 24} textAnchor="middle" className="fig-label">
        {label}
      </text>
    </g>
  )
}

export default function MonitorFigure({ figure, title, active }) {
  const { labels } = figure
  return (
    <Drawing type="monitor" title={title} active={active}>
      {() => (
        <>
          <g data-hair stroke="currentColor" fill="none" opacity="0.5">
            {HOSTS.map((y) => (
              <path key={y} d={`M108 ${y + 20}C140 ${y + 20} 140 150 172 150`} />
            ))}
            <path d="M262 150H300M300 150V90H340M300 150V216H340" />
          </g>
          {HOSTS.map((y, i) => (
            <path
              key={y}
              className={`fig-mon-packet fig-mon-packet-${i + 1} text-clay`}
              d={`M108 ${y + 20}C140 ${y + 20} 140 150 172 150`}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="6 80"
            />
          ))}

          {HOSTS.map((y) => (
            <Box key={y} x={28} y={y} w={80} label={labels.agent} />
          ))}
          <Box x={172} y={130} w={90} label={labels.server} />
          <Box x={340} y={70} w={116} label={labels.store} />
          <g className="fig-mon-alert text-clay">
            <Box x={340} y={196} w={116} label={labels.alert} />
          </g>
          <text x="398" y="256" textAnchor="middle" className="fig-label fig-label-sm">
            {labels.dedup}
          </text>
        </>
      )}
    </Drawing>
  )
}

import { Drawing } from './Drawing'

// Fig. 3, OpenLake: the two paths through the lakehouse, named as in the
// Mermaid diagram in the project's README (section 2). Batch: the CSV is
// copied server-side into bronze, PySpark cleans it into silver. Stream: the
// live order generator produces into Redpanda, Spark Structured Streaming
// writes into silver. The two meet at silver; dbt builds gold, which feeds the
// dashboards, the churn model and, by reverse ETL, the CRM.
// Moving parts (figures.css): the batch path carries spaced groups, the stream
// a fast continuous run, and the three layers fill in turn.

const STACK = { x: 208, w: 84 }
const LAYERS = [
  ['bronze', 84],
  ['silver', 140],
  ['gold', 196],
]
const LAYER_H = 24
const BATCH_Y = 96
const STREAM_Y = 250
const RISE_X = 186
const SILVER_IN = 156
const OUTPUTS = [
  ['dashboards', 162],
  ['churn', 208],
  ['crm', 254],
]

function Box({ x, y, w, h, lines }) {
  return (
    <g>
      <g data-hair>
        <rect x={x} y={y} width={w} height={h} rx="3" fill="var(--color-paper)" stroke="currentColor" opacity="0.85" />
      </g>
      <text x={x + w / 2} y={y + h / 2 + (lines.length > 1 ? -2 : 3.5)} textAnchor="middle" className="fig-label">
        {lines.map((line, i) => (
          <tspan key={i} x={x + w / 2} dy={i ? 12 : 0}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}

export default function PipelineFigure({ figure, title, active }) {
  const { labels } = figure
  const right = STACK.x + STACK.w
  const mid = STACK.x + STACK.w / 2
  return (
    <Drawing type="pipeline" title={title} active={active}>
      {() => (
        <g transform="translate(0 -16)">
          {/* the two paths: batch along the top into bronze, stream along the
              bottom and up into silver */}
          <g data-hair fill="none" stroke="currentColor" opacity="0.7">
            <path d={`M40 ${BATCH_Y}H${STACK.x}`} />
            <path d={`M40 ${STREAM_Y}H${RISE_X}V${SILVER_IN}H${STACK.x}`} />
            <path d={`M${mid} ${LAYERS[0][1] + LAYER_H}V${LAYERS[1][1]}M${mid} ${LAYERS[1][1] + LAYER_H}V${LAYERS[2][1]}`} />
            {OUTPUTS.map(([key, y]) => (
              <path key={key} d={`M${right} ${LAYERS[2][1] + LAYER_H / 2}C${right + 34} ${LAYERS[2][1] + LAYER_H / 2} ${right + 40} ${y} ${378} ${y}`} />
            ))}
          </g>
          <g fill="currentColor" opacity="0.8">
            <path d={`M${STACK.x} ${BATCH_Y}l-7 -3.5v7z`} />
            <path d={`M${STACK.x} ${SILVER_IN}l-7 -3.5v7z`} />
            <path d={`M${mid} ${LAYERS[1][1]}l-3.5 -7h7z`} />
            <path d={`M${mid} ${LAYERS[2][1]}l-3.5 -7h7z`} />
            {OUTPUTS.map(([key, y]) => (
              <path key={key} d={`M378 ${y}l-7 -3.5v7z`} />
            ))}
          </g>

          {/* packets: spaced groups on the batch path, a steady run on the
              stream. Drawn under the boxes, so they pass through them */}
          <g className="text-clay" fill="currentColor">
            {[0, 1].map((g) => (
              <g key={g} className="fig-pl-batch" style={{ animationDelay: `${-g * 4}s` }}>
                {[0, 1, 2].map((k) => (
                  <rect key={k} x={36 - k * 8} y={BATCH_Y - 2} width="4" height="4" />
                ))}
              </g>
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <circle
                key={i}
                className="fig-pl-stream"
                style={{ animationDelay: `${-i * 0.25}s` }}
                cx="40"
                cy={STREAM_Y}
                r="1.8"
              />
            ))}
          </g>
          {/* sources: the CSV, and the live order stream */}
          <g data-hair fill="none" stroke="currentColor" opacity="0.85">
            <path d={`M16 ${BATCH_Y - 15}h14l7 7v23h-21z M30 ${BATCH_Y - 15}v7h7`} />
            <path d={`M19 ${BATCH_Y - 3}h14M19 ${BATCH_Y + 2}h14M19 ${BATCH_Y + 7}h10`} opacity="0.6" />
            <circle cx="26" cy={STREAM_Y} r="4" />
            <path d={`M19 ${STREAM_Y - 7}a10 10 0 0 0 0 14M33 ${STREAM_Y - 7}a10 10 0 0 1 0 14`} opacity="0.7" />
            <path d={`M15 ${STREAM_Y - 11}a16 16 0 0 0 0 22M37 ${STREAM_Y - 11}a16 16 0 0 1 0 22`} opacity="0.4" />
          </g>
          <text x="10" y={BATCH_Y - 24} className="fig-label">
            {labels.csv}
          </text>
          <text x="10" y={STREAM_Y + 30} className="fig-label">
            {labels.stream}
          </text>

          <Box x={64} y={BATCH_Y - 16} w={100} h={32} lines={labels.copy} />
          <Box x={64} y={STREAM_Y - 16} w={100} h={32} lines={labels.redpanda} />
          <text x={RISE_X - 6} y={SILVER_IN + 46} textAnchor="end" className="fig-label">
            {labels.streaming.map((line, i) => (
              <tspan key={i} x={RISE_X - 6} dy={i ? 12 : 0}>
                {line}
              </tspan>
            ))}
          </text>

          {/* the store: bronze, silver, gold */}
          {LAYERS.map(([key, y]) => (
            <g key={key}>
              <rect
                className={`fig-pl-fill fig-pl-fill-${key}`}
                x={STACK.x}
                y={y}
                width={STACK.w}
                height={LAYER_H}
                fill="currentColor"
                opacity="0.13"
              />
              <g data-hair>
                <rect x={STACK.x} y={y} width={STACK.w} height={LAYER_H} fill="none" stroke="currentColor" opacity="0.85" />
              </g>
              <text x={mid} y={y + LAYER_H / 2 + 3.5} textAnchor="middle" className="fig-label">
                {labels[key]}
              </text>
            </g>
          ))}
          <text x={right + 6} y={LAYERS[1][1] - 12} className="fig-label">
            {labels.pyspark}
          </text>
          <text x={right + 6} y={LAYERS[2][1] - 12} className="fig-label">
            {labels.dbt}
          </text>

          {/* what gold serves */}
          {OUTPUTS.map(([key, y]) => (
            <text key={key} x="384" y={y + 3.5} className="fig-label">
              {labels[key]}
            </text>
          ))}

        </g>
      )}
    </Drawing>
  )
}

import { Drawing } from './Drawing'

// Fig. 2, BriefForge: the three inputs on the left (artwork, content sheet,
// rulebook), the check in the middle and the three verdicts on the right.
// Moving parts (figures.css): a scan line reads the carton, marks appear on
// it as it passes, and the verdicts come in one after another.

const PANELS = [34, 74, 114, 154]
// where the problems are found, top to bottom
const MARKS = [
  [54, 92],
  [134, 116],
  [94, 142],
]
const VERDICTS = [
  ['fail', 'text-clay', 66],
  ['review', 'text-ink', 128],
  ['pass', 'text-moss', 190],
]

export default function ReviewFigure({ figure, title, active }) {
  const { labels } = figure
  return (
    <Drawing type="review" title={title} active={active}>
      {(hatch) => (
        <>
          {/* the carton, unfolded: four panels, the flaps cut material */}
          <text x="34" y="44" className="fig-label">
            {labels.artwork}
          </text>
          <g data-hair fill="none" stroke="currentColor" opacity="0.85">
            {PANELS.map((x) => (
              <rect key={x} x={x} y="68" width="40" height="92" fill="var(--color-paper)" />
            ))}
            <path d="M74 68l8 -14h24l8 14" />
          </g>
          <g data-hair stroke="currentColor" opacity="0.5" fill={hatch}>
            {PANELS.map((x) => (
              <path key={x} d={`M${x} 160h40l-6 12h-28z`} />
            ))}
          </g>
          <g data-hair stroke="currentColor" fill="none" opacity="0.4">
            <circle cx="94" cy="96" r="12" />
            <path d="M42 84h24M42 92h24M42 100h16M82 120h24M84 128h20M122 80h24M122 88h24M122 96h24M122 104h18M162 90h24M162 98h20M42 132h24M42 140h18" />
          </g>

          <g className="fig-rv-scan text-clay">
            <g data-hair stroke="currentColor" fill="none">
              <path d="M34 56V176" />
            </g>
          </g>
          {MARKS.map(([x, y], i) => (
            <g key={i} data-hair className={`fig-rv-mark fig-rv-mark-${i + 1} text-clay`} stroke="currentColor" fill="none">
              <ellipse cx={x} cy={y} rx="17" ry="9" />
            </g>
          ))}

          {/* what the artwork is checked against */}
          {[
            ['sheet', 34],
            ['rulebook', 120],
          ].map(([key, x]) => (
            <g key={key}>
              <g data-hair fill="none" stroke="currentColor" opacity="0.7">
                <path d={`M${x} 204h58l10 10v44h-68z M${x + 58} 204v10h10`} />
                <path d={`M${x + 10} 222h46M${x + 10} 232h46M${x + 10} 242h30`} opacity="0.5" />
              </g>
              <text x={x + 34} y="276" textAnchor="middle" className="fig-label fig-label-sm">
                {labels[key]}
              </text>
            </g>
          ))}

          {/* the check */}
          <g data-hair fill="none" stroke="currentColor">
            <path d="M194 114H236M188 231H266V150" opacity="0.6" />
            <rect x="236" y="78" width="60" height="72" rx="4" opacity="0.85" />
            <path d="M296 114H316M316 80V204M316 80H336M316 142H336M316 204H336" opacity="0.6" />
          </g>
          <path className="fig-rv-tick text-moss" d="M252 114l10 10l18 -20" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="266" y="66" textAnchor="middle" className="fig-label fig-label-sm">
            {labels.check}
          </text>

          {VERDICTS.map(([key, colour, y]) => (
            <g key={key} className={`fig-rv-verdict fig-rv-${key} ${colour}`}>
              <g data-hair fill="none" stroke="currentColor">
                <rect x="336" y={y} width="124" height="28" rx="3" />
              </g>
              <circle cx="350" cy={y + 14} r="4" fill="currentColor" />
              <text x="362" y={y + 18} className="fig-label">
                {labels[key]}
              </text>
            </g>
          ))}
        </>
      )}
    </Drawing>
  )
}

import { Drawing, Leader } from './Drawing'

// Fig. 2, Osdag Web: a column base plate - one of the modules he led - in
// elevation and plan. The status strip is the card's "async calculations,
// live job updates": as the job runs, the anchor bolts go in (in both views
// together); when it's done, the dimensions are filled in. Dimensions are
// symbols (p pitch, e edge distance), not numbers, so nothing reads as a
// design value that was made up.

const ELEV_BOLTS = [156, 254]
const PLAN = { x: 344, y: 92, size: 120, cx: 404, cy: 152 }
const PLAN_BOLTS = [
  [360, 108],
  [448, 108],
  [360, 196],
  [448, 196],
]
// I-section in plan: flanges 50 wide, 60 deep overall, web 4
const I_SECTION = 'M379 122H429V128H406V176H429V182H379V176H402V128H379Z'

export default function BasePlateFigure({ figure, title, active }) {
  const { labels } = figure
  return (
    <Drawing type="base-plate" title={title} active={active}>
      {(hatch) => (
        <>
          {/* ---- elevation ------------------------------------------------ */}
          <rect x="120" y="200" width="170" height="72" fill={hatch} />
          <g data-hair fill="none" stroke="currentColor">
            <path d="M120 272V200H290V272" opacity="0.85" />
            {/* the pedestal carries on down: a break line */}
            <path d="M116 272h70l5 -6l6 12l5 -6h92" opacity="0.6" />
            <rect x="136" y="188" width="138" height="12" fill="var(--color-paper)" opacity="0.85" />
            {/* the column, broken off at the top */}
            <path d="M180 188V50M230 188V50" opacity="0.85" />
            <path d="M185 188V50M225 188V50" opacity="0.4" />
            <path d="M176 50h22l4 -5l5 9l4 -4h23" opacity="0.6" />
          </g>
          {/* fillet welds at the foot of the column */}
          <path d="M180 188h-6l6 -6zM230 188h6l-6 -6z" fill="currentColor" opacity="0.8" />

          {ELEV_BOLTS.map((x, i) => (
            <g key={x} className={`fig-bp-bolt fig-bp-bolt-${i + 1}`}>
              <g data-hair fill="none" stroke="currentColor">
                <path d={`M${x} 172V180`} opacity="0.85" />
                <rect x={x - 5} y="181" width="10" height="7" opacity="0.85" fill="var(--color-paper)" />
                {/* embedded length, hidden, so dashed */}
                <path d={`M${x} 200V254h${i ? -7 : 7}`} opacity="0.6" strokeDasharray="3 2" />
              </g>
            </g>
          ))}

          <g className="text-clay" data-hair stroke="currentColor" fill="none" opacity="0.75">
            <path d="M205 34V290" strokeDasharray="9 4 2 4" />
          </g>

          <g className="fig-bp-load">
            <g data-hair stroke="currentColor" fill="none" opacity="0.85">
              <path d="M205 6V36" />
            </g>
            <path d="M205 42l-4 -9h8z" fill="currentColor" />
            <text x="213" y="20" className="fig-label fig-label-sym">
              {labels.load}
            </text>
          </g>

          <Leader at={[180, 96]} to={[110, 88]} anchor="end">
            {labels.column}
          </Leader>
          <Leader at={[176, 185]} to={[110, 160]} anchor="end">
            {labels.weld}
          </Leader>
          <Leader at={[137, 194]} to={[110, 194]} anchor="end">
            {labels.plate}
          </Leader>
          <Leader at={[156, 226]} to={[110, 228]} anchor="end">
            {labels.bolts}
          </Leader>
          <Leader at={[126, 262]} to={[110, 262]} anchor="end">
            {labels.pedestal}
          </Leader>

          {/* ---- plan ------------------------------------------------------- */}
          <path d={I_SECTION} fill={hatch} />
          <g data-hair fill="none" stroke="currentColor">
            <rect x={PLAN.x} y={PLAN.y} width={PLAN.size} height={PLAN.size} opacity="0.85" />
            <path d={I_SECTION} opacity="0.85" />
            {PLAN_BOLTS.map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="6" opacity="0.4" strokeDasharray="2 2" />
            ))}
          </g>
          {PLAN_BOLTS.map(([x, y], i) => (
            <g key={`${x}-${y}`} className={`fig-bp-hole fig-bp-bolt-${i + 1}`}>
              <circle cx={x} cy={y} r="4" fill="currentColor" opacity="0.8" />
            </g>
          ))}
          <g className="text-clay" data-hair stroke="currentColor" fill="none" opacity="0.75">
            <path d={`M${PLAN.cx} 86V218M332 ${PLAN.cy}H476`} strokeDasharray="9 4 2 4" />
          </g>

          {/* chain dimension across the top: e, p, e */}
          <g className="fig-bp-dims">
            <g data-hair stroke="currentColor" fill="none" opacity="0.6">
              <path d="M344 88V70M360 102V70M448 102V70M464 88V70M340 74H468" />
              <path d="M341 77l6 -6M357 77l6 -6M445 77l6 -6M461 77l6 -6" />
            </g>
            <g className="fig-label fig-label-sym" textAnchor="middle">
              <text x="352" y="66">
                {labels.edge}
              </text>
              <text x="404" y="66">
                {labels.pitch}
              </text>
              <text x="456" y="66">
                {labels.edge}
              </text>
            </g>
          </g>

          {/* ---- titles and the job's status -------------------------------- */}
          <g className="fig-label fig-title" textAnchor="middle">
            <text x="205" y="292">
              {labels.elevation}
            </text>
            <text x={PLAN.cx} y="292">
              {labels.plan}
            </text>
          </g>

          <g className="fig-bp-status">
            {[
              ['queued', 300, 'text-ink'],
              ['running', 364, 'text-clay'],
              ['done', 432, 'text-moss'],
            ].map(([key, x, tone]) => (
              <g key={key}>
                <g data-hair>
                  <rect x={x} y="13" width="6" height="6" fill="none" stroke="currentColor" opacity="0.5" />
                </g>
                <rect className={`fig-bp-step fig-bp-${key} ${tone}`} x={x} y="13" width="6" height="6" fill="currentColor" />
                <text x={x + 10} y="20" className="fig-label">
                  {labels[key]}
                </text>
              </g>
            ))}
          </g>
        </>
      )}
    </Drawing>
  )
}

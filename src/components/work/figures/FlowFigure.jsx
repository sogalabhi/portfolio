import { Drawing } from './Drawing'

// Fig. 5, Polkaflow: the flowchart on the left - the four node types in the
// real canvas (Trigger, Logic, Wallet, Contract) - generates the contract on
// the right. The code is drawn as bars, not text: there's no real code here to
// show. Moving parts (figures.css): a cursor drags the last node into place,
// the connectors join up in order, the generate arrow pulses, and the code
// fills in line by line.

const NODE_W = 84
const NODE_H = 44
const NODES = {
  trigger: [20, 62],
  wallet: [160, 62],
  logic: [20, 194],
  contract: [160, 194],
}
const mid = ([x, y]) => [x + NODE_W / 2, y + NODE_H / 2 + 6]
// in the order they join up
const LINKS = [
  ['trigger', 'wallet', 'h'],
  ['trigger', 'logic', 'v'],
  ['logic', 'contract', 'h'],
  ['wallet', 'contract', 'v'],
]
const PAGE = { x: 314, y: 48, w: 152, h: 238 }
const CODE = [
  [0, 70], [1, 96], [1, 58], [2, 84], [2, 110], [1, 40],
  [0, 18], [0, 76], [1, 104], [2, 66], [2, 92], [3, 50],
  [2, 34], [1, 18], [1, 88], [1, 62], [0, 18],
]

function link([from, to, dir]) {
  const [ax, ay] = NODES[from]
  const [bx, by] = NODES[to]
  if (dir === 'h') {
    const y1 = ay + NODE_H / 2 + 6
    const y2 = by + NODE_H / 2 + 6
    const x1 = ax + NODE_W
    return `M${x1} ${y1}C${x1 + 28} ${y1} ${bx - 28} ${y2} ${bx} ${y2}`
  }
  const x1 = ax + NODE_W / 2
  const x2 = bx + NODE_W / 2
  const y1 = ay + NODE_H
  return `M${x1} ${y1}C${x1} ${y1 + 40} ${x2} ${by - 40} ${x2} ${by}`
}

function Node({ id, label }) {
  const [x, y] = NODES[id]
  const [, cy] = mid(NODES[id])
  return (
    <g className={`fig-fl-node fig-fl-${id}`}>
      <g data-hair stroke="currentColor">
        <rect x={x} y={y} width={NODE_W} height={NODE_H} rx="5" fill="var(--color-paper)" opacity="0.85" />
        <path d={`M${x} ${y + 15}H${x + NODE_W}`} fill="none" opacity="0.5" />
        <path d={`M${x + 8} ${y + 26}h${id.length * 6 + 18}M${x + 8} ${y + 34}h${id.length * 4 + 14}`} fill="none" opacity="0.35" />
      </g>
      <text x={x + 7} y={y + 11} className="fig-label fig-label-sm">
        {label}
      </text>
      {/* ports */}
      <g fill="var(--color-paper)" stroke="currentColor" data-hair>
        <circle cx={x} cy={cy} r="2.5" />
        <circle cx={x + NODE_W} cy={cy} r="2.5" />
        <circle cx={x + NODE_W / 2} cy={y} r="2.5" />
        <circle cx={x + NODE_W / 2} cy={y + NODE_H} r="2.5" />
      </g>
    </g>
  )
}

export default function FlowFigure({ figure, title, active }) {
  const { labels } = figure
  const [cx, cy] = NODES.contract
  return (
    <Drawing type="flow" title={title} active={active}>
      {() => (
        <>
          {/* the canvas, as a construction line */}
          <g data-hair fill="none" stroke="currentColor">
            <rect x="8" y="40" width="254" height="246" rx="6" opacity="0.25" strokeDasharray="4 3" />
          </g>

          <g data-hair fill="none" stroke="currentColor" opacity="0.7">
            {LINKS.map((l, i) => (
              <path key={i} className={`fig-fl-link fig-fl-link-${i + 1}`} d={link(l)} />
            ))}
          </g>

          {['trigger', 'wallet', 'logic', 'contract'].map((id) => (
            <Node key={id} id={id} label={labels[id]} />
          ))}

          {/* the hand that drags the contract node in */}
          <path
            className="fig-fl-cursor"
            d={`M${cx + 54} ${cy + 6}l0 15l4 -4l3 7l3 -1.5l-3 -7l5.5 0z`}
            fill="var(--color-paper)"
            stroke="currentColor"
            strokeLinejoin="round"
          />

          {/* generate */}
          <g className="fig-fl-arrow text-clay">
            <g data-hair stroke="currentColor" fill="none">
              <path d="M270 172H302" />
            </g>
            <path d="M309 172l-8 -4.5v9z" fill="currentColor" />
          </g>
          <text x="288" y="160" textAnchor="middle" className="fig-label fig-label-sm">
            {labels.generate}
          </text>

          {/* the contract it writes */}
          <text x={PAGE.x + PAGE.w + 4} y={PAGE.y - 10} textAnchor="end" className="fig-label">
            {labels.target}
          </text>
          <g data-hair fill="none" stroke="currentColor" opacity="0.85">
            <path
              d={`M${PAGE.x} ${PAGE.y}h${PAGE.w - 14}l14 14v${PAGE.h - 14}h${-PAGE.w}z M${PAGE.x + PAGE.w - 14} ${PAGE.y}v14h14`}
            />
          </g>
          <g className="fig-fl-code" fill="currentColor" opacity="0.5">
            {CODE.map(([indent, w], i) => (
              <rect key={i} x={PAGE.x + 12 + indent * 10} y={PAGE.y + 16 + i * 12.5} width={w} height="4" rx="1" />
            ))}
          </g>
          <g fill="currentColor" opacity="0.3" className="fig-label-sm">
            {CODE.map((_, i) => (
              <rect key={i} x={PAGE.x + 4} y={PAGE.y + 17 + i * 12.5} width="3" height="2" />
            ))}
          </g>
        </>
      )}
    </Drawing>
  )
}

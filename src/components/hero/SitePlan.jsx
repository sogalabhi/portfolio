import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { track } from '@vercel/analytics'
import useReducedMotion from '../../hooks/useReducedMotion'
import content from '../../content/site-plan.json'

// The hero's drawing: a construction site in isometric, drawn in line, with
// one pixel figure walking it, the site engineer (public/world/sprites/
// engineer.png, made by assets/pixel/engineer.mjs). Each labelled structure
// is a section of the page. Until he has walked over and inspected it, a
// structure is only its dashed footprint, the way a drawing shows something
// proposed; once inspected it is drawn as built. Pointing at a label sends him
// there.
//
// Everything is placed in site units on the ground (x right-back, y left-back,
// z up) and projected with P(); the SVG's viewBox is in screen units.

const W = 1280
const H = 896
const K = 7.5 // screen units per site unit
const OX = 543
const OY = 239
const COS = Math.cos(Math.PI / 6)

const P = (x, y, z = 0) => [OX + (x - y) * K * COS, OY + (x + y) * K * 0.5 - z * K]
const f = (n) => n.toFixed(1)
const pt = (p) => {
  const [sx, sy] = P(...p)
  return `${f(sx)} ${f(sy)}`
}
const poly = (...ps) => `M${ps.map(pt).join('L')}Z`
const seg = (a, b) => `M${pt(a)}L${pt(b)}`
const lines = (pairs) => pairs.map(([a, b]) => seg(a, b)).join('')
// a circle lying on the ground, as an isometric ellipse
const groundEllipse = (x, y, r) => {
  const [cx, cy] = P(x, y)
  return { cx, cy, rx: r * K * Math.SQRT2 * COS, ry: r * K * Math.SQRT1_2 }
}

const SITE = { x2: 100, y2: 70 }
const GATE = [46, 54] // the opening in the front fence, along x
const HUB = [50, 40]
const ROAD = 4.4

// where he walks: each route leaves the hub and ends where he stands to inspect
const ROUTES = {
  shed: [HUB, [42, 40], [42, 19]],
  crane: [HUB, [50, 17]],
  bridge: [HUB, [70, 40], [70, 20], [85, 20]],
  office: [HUB, [70, 40], [70, 47.5]],
  yard: [HUB, [40, 40], [40, 54], [36, 54]],
  gate: [HUB, [50, 68]],
}
// the roads he walks on (the bridge route ends on the bridge, past the road)
const ROADS = { ...ROUTES, bridge: [HUB, [70, 40], [70, 20], [80, 20]] }

const TOUR = ['shed', 'crane', 'bridge', 'office', 'gate', 'yard']
// what is already up when the page opens; the rest goes up as he walks
const BUILT_AT_START = ['gate', 'office', 'yard']
const WALK_SPEED = 12 // site units per second
const DWELL_MS = 1500
const WALK_FPS = 7
const DIRECTIONS = ['down', 'left', 'right', 'up'] // row order in engineer.png

// the point each label's leader line runs to
const ANCHOR = {
  shed: [8, 26, 10],
  crane: [46, 14, 31],
  office: [70, 55.5, 6],
  bridge: [85, 22, 1.6],
  yard: [21, 64, 0],
  gate: [46.6, 69.8, 3],
}
// where each label sits, in screen units; `anchor` is the side touching `at`
const LABEL_AT = {
  shed: { at: [250, 210], anchor: 'right' },
  crane: { at: [840, 120], anchor: 'left' },
  office: { at: [790, 860], anchor: 'left' },
  bridge: { at: [1080, 700], anchor: 'left' },
  yard: { at: [230, 760], anchor: 'right' },
  gate: { at: [500, 860], anchor: 'right' },
}

// --- geometry helpers ------------------------------------------------------------

// a solid box: the three faces the viewer sees, filled with paper so it hides
// what is behind it; `shade` hatches the right-hand face
function Box({ x, y, z = 0, w, d, h, shade = false }) {
  const top = poly([x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h])
  const left = poly([x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h])
  const right = poly([x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h])
  return (
    <g>
      <path d={top + left + right} fill="var(--color-paper)" />
      {shade && <path d={right} fill="url(#iso-hatch)" stroke="none" />}
    </g>
  )
}

// a road: every segment as a ground strip, overlapping at the corners
function roadStrips(route, width) {
  const half = width / 2
  return route.slice(1).map((b, i) => {
    const a = route[i]
    const dx = Math.sign(b[0] - a[0])
    const dy = Math.sign(b[1] - a[1])
    // extend both ends by half the width so corners close up square
    const a2 = [a[0] - dx * half, a[1] - dy * half]
    const b2 = [b[0] + dx * half, b[1] + dy * half]
    const nx = -dy * half
    const ny = dx * half
    return poly([a2[0] + nx, a2[1] + ny], [b2[0] + nx, b2[1] + ny], [b2[0] - nx, b2[1] - ny], [a2[0] - nx, a2[1] - ny])
  })
}

// --- the site, in the order it is painted: ground first, then back to front ---------

function Ground() {
  // the boundary fence, with the gate gap in the front edge
  const fence =
    seg([0, 0], [SITE.x2, 0]) +
    seg([SITE.x2, 0], [SITE.x2, SITE.y2]) +
    seg([SITE.x2, SITE.y2], [GATE[1], SITE.y2]) +
    seg([GATE[0], SITE.y2], [0, SITE.y2]) +
    seg([0, SITE.y2], [0, 0])
  const posts = []
  for (let x = 0; x <= SITE.x2; x += 5) {
    posts.push([[x, 0], [x, 0, 1.4]])
    if (x <= GATE[0] || x >= GATE[1]) posts.push([[x, SITE.y2], [x, SITE.y2, 1.4]])
  }
  for (let y = 5; y < SITE.y2; y += 5) {
    posts.push([[0, y], [0, y, 1.4]])
    posts.push([[SITE.x2, y], [SITE.x2, y, 1.4]])
  }
  // survey crosses on the ground, every ten units
  const crosses = []
  for (let x = 10; x < SITE.x2; x += 10) {
    for (let y = 10; y < SITE.y2; y += 10) crosses.push(seg([x - 0.7, y], [x + 0.7, y]) + seg([x, y - 0.7], [x, y + 0.7]))
  }
  const strips = Object.values(ROADS).flatMap((r) => roadStrips(r, ROAD))
  const outline = Object.values(ROADS).flatMap((r) => roadStrips(r, ROAD + 0.5))
  const hub = groundEllipse(...HUB, 4.6)
  const hubOutline = groundEllipse(...HUB, 4.85)

  return (
    <g>
      <g data-hair fill="none" stroke="currentColor">
        <path d={crosses.join('')} opacity="0.3" />
        <path d={fence} opacity="0.75" strokeDasharray="22 5 3 5" />
        <path d={lines(posts)} opacity="0.45" />
      </g>

      {/* roads: every outline first, then every surface, so junctions merge */}
      <g opacity="0.7">
        {outline.map((d, i) => (
          <path key={i} d={d} fill="currentColor" />
        ))}
        <ellipse {...hubOutline} fill="currentColor" />
      </g>
      <g fill="var(--color-paper)">
        {strips.map((d, i) => (
          <path key={i} d={d} />
        ))}
        <ellipse {...hub} />
      </g>
      <g data-hair className="text-clay" fill="none" stroke="currentColor" opacity="0.6" strokeDasharray="9 4 2 4">
        {Object.values(ROADS).map((r, i) => (
          <path key={i} d={r.slice(1).map((b, j) => seg(r[j], b)).join('')} />
        ))}
      </g>
      {/* phase two: the road beyond the bridge, not built yet */}
      <path
        data-hair
        d={seg([90, 20], [SITE.x2, 20])}
        fill="none"
        stroke="currentColor"
        opacity="0.45"
        strokeDasharray="4 4"
      />

      {/* the drain: two banks, the water between them marked */}
      <g data-hair fill="none" stroke="currentColor">
        <path d={seg([82, 0], [82, SITE.y2]) + seg([88, 0], [88, SITE.y2])} opacity="0.7" />
        <path d={seg([82.8, 0], [82.8, SITE.y2]) + seg([87.2, 0], [87.2, SITE.y2])} opacity="0.3" />
        <path d={poly([82.8, 0], [87.2, 0], [87.2, SITE.y2], [82.8, SITE.y2])} fill="url(#iso-water)" stroke="none" />
        <path
          d={Array.from({ length: 13 }, (_, i) => seg([84, 3 + i * 5.2], [86, 4.4 + i * 5.2])).join('')}
          className="text-clay"
          opacity="0.6"
        />
      </g>
    </g>
  )
}

// a crossfade between the proposed footprint and the built structure, which
// rises a little into place
function Stage({ built, proposed, children }) {
  return (
    <g>
      <g
        data-hair
        fill="none"
        stroke="currentColor"
        strokeDasharray="5 4"
        opacity={built ? 0 : 0.75}
        style={{ transition: 'opacity 500ms ease' }}
      >
        {proposed}
      </g>
      <g
        data-hair
        fill="none"
        stroke="currentColor"
        style={{
          opacity: built ? 1 : 0,
          transform: built ? 'none' : 'translateY(18px)',
          transition: 'opacity 600ms ease, transform 700ms cubic-bezier(0.2, 0.7, 0.2, 1)',
        }}
      >
        {children}
      </g>
    </g>
  )
}

// A: a steel portal-frame shed, the frame up and the cladding not yet on
const SHED = { x1: 8, x2: 38, y1: 6, y2: 26, ym: 16, eave: 10, apex: 13 }
const SHED_GRID = [8, 15.5, 23, 30.5, 38]
function Shed({ built }) {
  const { x1, x2, y1, y2, ym, eave, apex } = SHED
  const footprint = poly([x1, y1], [x2, y1], [x2, y2], [x1, y2])
  const gridlines = SHED_GRID.map((x) => seg([x, y1 - 2.5], [x, y2 + 2.5])).join('')
  const frame = []
  for (const x of SHED_GRID) {
    frame.push([[x, y1], [x, y1, eave]], [[x, y2], [x, y2, eave]])
    frame.push([[x, y1, eave], [x, ym, apex]], [[x, ym, apex], [x, y2, eave]])
  }
  const runs = [
    [[x1, y1, eave], [x2, y1, eave]],
    [[x1, y2, eave], [x2, y2, eave]],
    [[x1, ym, apex], [x2, ym, apex]],
    // purlins halfway up each slope
    [[x1, (y1 + ym) / 2, (eave + apex) / 2], [x2, (y1 + ym) / 2, (eave + apex) / 2]],
    [[x1, (ym + y2) / 2, (eave + apex) / 2], [x2, (ym + y2) / 2, (eave + apex) / 2]],
  ]
  // cross-bracing in the two end bays of the near wall
  const bracing = [
    [[x1, y2], [SHED_GRID[1], y2, eave]],
    [[SHED_GRID[1], y2], [x1, y2, eave]],
    [[SHED_GRID[3], y2], [x2, y2, eave]],
    [[x2, y2], [SHED_GRID[3], y2, eave]],
  ]

  return (
    <g>
      {/* the grid is part of the design, so it shows either way */}
      <g data-hair fill="none" stroke="currentColor" opacity="0.45" strokeDasharray="12 3 2 3">
        <path d={gridlines} />
      </g>
      <g className="font-mono" fontSize="13" textAnchor="middle" fill="currentColor" opacity="0.7">
        {SHED_GRID.map((x, i) => {
          const [cx, cy] = P(x, y2 + 4.3)
          return (
            <g key={x}>
              <circle cx={cx} cy={cy} r="10" fill="var(--color-paper)" stroke="currentColor" data-hair />
              <text x={cx} y={cy + 4.5} stroke="none">
                {i + 1}
              </text>
            </g>
          )
        })}
      </g>
      <Stage built={built} proposed={<path d={footprint} />}>
        <path d={footprint} opacity="0.6" />
        <path d={lines(frame)} strokeWidth="1.6" data-heavy />
        <path d={lines(runs)} />
        <path d={lines(bracing)} opacity="0.6" />
      </Stage>
    </g>
  )
}

// E: a tower crane, its swing radius marked on the ground
function Crane({ built }) {
  const [mx, my] = [45, 13]
  const top = 30
  const legs = [
    [mx, my],
    [mx + 2, my],
    [mx + 2, my + 2],
    [mx, my + 2],
  ]
  const lattice = []
  for (let z = 0, i = 0; z < top; z += 2.5, i++) {
    const z2 = Math.min(top, z + 2.5)
    // zigzag up the two faces the viewer sees
    lattice.push(i % 2 ? [[mx, my + 2, z], [mx + 2, my + 2, z2]] : [[mx + 2, my + 2, z], [mx, my + 2, z2]])
    lattice.push(i % 2 ? [[mx + 2, my, z], [mx + 2, my + 2, z2]] : [[mx + 2, my + 2, z], [mx + 2, my, z2]])
  }
  const jib = [
    [[mx + 1, my + 1, top], [15, my + 1, top]],
    [[mx + 1, my + 1, top + 4], [15, my + 1, top]],
    [[mx + 1, my + 1, top + 4], [mx + 10, my + 1, top]],
    [[mx + 2, my + 1, top], [mx + 10, my + 1, top]],
    [[mx + 1, my + 1, top], [mx + 1, my + 1, top + 4]],
  ]
  const jibTruss = []
  for (let x = 17; x < mx; x += 3) jibTruss.push([[x, my + 1, top], [x + 1.5, my + 1, top + ((x + 1.5 - 15) / (mx + 1 - 15)) * 4]])
  const swing = groundEllipse(mx + 1, my + 1, 31)

  return (
    <g>
      <ellipse {...swing} data-hair fill="none" stroke="currentColor" strokeDasharray="3 5" opacity="0.4" />
      <Stage built={built} proposed={<path d={poly([mx - 1, my - 1], [mx + 3, my - 1], [mx + 3, my + 3], [mx - 1, my + 3])} />}>
        <Box x={mx - 1} y={my - 1} w={4} d={4} h={0.8} />
        <path d={lines(legs.map(([x, y]) => [[x, y, 0.8], [x, y, top]]))} strokeWidth="1.4" data-heavy />
        <path d={lines(lattice)} opacity="0.6" />
        <path d={lines(jib)} strokeWidth="1.3" />
        <path d={lines(jibTruss)} opacity="0.5" />
        <Box x={mx + 7} y={my + 0.2} z={top - 1.6} w={3} d={1.6} h={1.6} shade />
        <Box x={mx - 0.4} y={my - 0.4} z={top - 3} w={2.8} d={2.8} h={2.6} />
        {/* the trolley and its hook */}
        <path d={seg([26, my + 1, top], [26, my + 1, 17]) + seg([25.4, my + 1, 17], [26.6, my + 1, 17])} opacity="0.8" />
      </Stage>
    </g>
  )
}

// B: site office, three cabins, one stacked, with a stair up the end
function Office({ built }) {
  const pane = (x, y, z) => poly([x, y, z], [x + 2, y, z], [x + 2, y, z + 1.2], [x, y, z + 1.2])
  return (
    <Stage built={built} proposed={<path d={poly([62, 50], [78, 50], [78, 61], [62, 61])} />}>
      <Box x={62} y={50} w={16} d={5} h={3} shade />
      <Box x={62} y={50} z={3} w={16} d={5} h={3} shade />
      <Box x={62} y={56} w={16} d={5} h={3} shade />
      <path
        d={[64, 68, 72].map((x) => pane(x, 61, 1.1)).join('') + [64, 68, 72].map((x) => pane(x, 55, 4.1)).join('')}
        opacity="0.7"
      />
      <path d={seg([78.4, 49, 0], [78.4, 52.5, 3]) + seg([79.4, 49, 0], [79.4, 52.5, 3])} opacity="0.8" />
    </Stage>
  )
}

// D: materials yard, steel stacked on bearers, two heaps of aggregate, rebar
function Yard({ built }) {
  const fence = poly([8, 44], [34, 44], [34, 64], [8, 64])
  const beams = []
  for (let row = 0; row < 2; row++) {
    for (let layer = 0; layer < 3; layer++) {
      for (let k = 0; k < 3 - layer; k++) {
        beams.push({ x: 11, y: 46.5 + row * 5 + k * 1.1 + layer * 0.55, z: layer * 0.7, w: 15, d: 0.8, h: 0.6 })
      }
    }
  }
  const heap = (x, y, r, h) => {
    const e = groundEllipse(x, y, r)
    const [ax, ay] = P(x, y, h)
    return (
      <g key={`${x}-${y}`}>
        <path
          d={`M${f(e.cx - e.rx)} ${f(e.cy)}Q${f(ax - e.rx * 0.35)} ${f(ay)} ${f(ax)} ${f(ay)}Q${f(ax + e.rx * 0.35)} ${f(ay)} ${f(e.cx + e.rx)} ${f(e.cy)}A${f(e.rx)} ${f(e.ry)} 0 0 1 ${f(e.cx - e.rx)} ${f(e.cy)}Z`}
          fill="var(--color-paper)"
        />
        <path d={`M${f(ax - 6)} ${f(ay + 14)}h3M${f(ax + 4)} ${f(ay + 20)}h3M${f(ax - 2)} ${f(ay + 26)}h3`} opacity="0.6" />
      </g>
    )
  }
  const rebar = []
  for (let i = 0; i < 5; i++) rebar.push([[11, 60 + i * 0.35, 0.3], [24, 60 + i * 0.35, 0.3]])
  rebar.push([[14, 59.8, 0.3], [14, 61.6, 0.3]], [[21, 59.8, 0.3], [21, 61.6, 0.3]])

  return (
    <g>
      <path d={fence} data-hair fill="none" stroke="currentColor" strokeDasharray="2 3" opacity="0.6" />
      <Stage built={built} proposed={<path d={poly([11, 46], [26, 46], [26, 62], [11, 62])} />}>
        {beams.map((b, i) => (
          <Box key={i} {...b} />
        ))}
        {heap(30, 49, 3, 3.2)}
        {heap(29.5, 58.5, 3.6, 3.8)}
        <path d={lines(rebar)} opacity="0.85" />
      </Stage>
    </g>
  )
}

// C: a footbridge over the drain
function Bridge({ built }) {
  const posts = []
  for (let x = 80.5; x <= 89.6; x += 2.25) posts.push([[x, 18, 0.9], [x, 18, 1.9]], [[x, 22, 0.9], [x, 22, 1.9]])
  return (
    <Stage built={built} proposed={<path d={poly([80, 18], [90, 18], [90, 22], [80, 22])} />}>
      <Box x={78.6} y={17.4} w={1.6} d={5.2} h={1} shade />
      <Box x={89.8} y={17.4} w={1.6} d={5.2} h={1} shade />
      <Box x={80} y={18} z={0.4} w={10} d={4} h={0.5} />
      <path d={lines(posts)} opacity="0.8" />
      <path d={seg([80.5, 18, 1.9], [89.5, 18, 1.9]) + seg([80.5, 22, 1.9], [89.5, 22, 1.9])} />
    </Stage>
  )
}

// F: the site gate, its leaves swung open, and the security cabin
function Gate({ built }) {
  const leaf = (x) =>
    poly([x, SITE.y2, 0.3], [x, SITE.y2 - 3.4, 0.3], [x, SITE.y2 - 3.4, 2.4], [x, SITE.y2, 2.4]) +
    seg([x, SITE.y2, 0.3], [x, SITE.y2 - 3.4, 2.4])
  return (
    <Stage built={built} proposed={<path d={seg([GATE[0], SITE.y2], [GATE[1], SITE.y2])} />}>
      <path d={leaf(GATE[0] + 0.8) + leaf(GATE[1] - 0.8)} opacity="0.8" />
      <Box x={GATE[0] - 0.4} y={SITE.y2 - 0.4} w={0.8} d={0.8} h={3} />
      <Box x={GATE[1] - 0.4} y={SITE.y2 - 0.4} w={0.8} d={0.8} h={3} />
      <Box x={56} y={62} w={4} d={4} h={3} shade />
    </Stage>
  )
}

const TREES = [
  [4, 36],
  [4, 28],
  [93, 8],
  [95, 34],
  [94, 50],
  [96, 62],
  [60, 5],
  [66, 4],
  [4, 68],
]
function Tree({ x, y }) {
  const [cx, cy] = P(x, y, 3.6)
  return (
    <g data-hair stroke="currentColor" opacity="0.7">
      <path d={seg([x, y], [x, y, 2.2])} fill="none" />
      <circle cx={cx} cy={cy} r={K * 1.8} fill="var(--color-paper)" />
      <circle cx={cx} cy={cy} r={K * 0.9} fill="none" opacity="0.5" />
    </g>
  )
}

function Notes() {
  return (
    <g className="text-ink" fill="currentColor">
      {/* north point */}
      <g transform="translate(1196 96)" stroke="currentColor" fill="none" data-hair>
        <circle r="22" opacity="0.5" />
        <path d="M0 -30L7 8L0 2L-7 8Z" fill="currentColor" stroke="none" transform="rotate(-60)" />
        <text y="-38" textAnchor="middle" fill="currentColor" stroke="none" className="font-mono max-sm:hidden" fontSize="17">
          {content.north}
        </text>
      </g>
      <text x="40" y="872" className="font-mono max-sm:hidden" fontSize="15" opacity="0.7">
        {content.view}
      </text>
    </g>
  )
}

function Drawing({ built }) {
  const near = ([x, y]) => x + y >= 60
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="site-plan-lines absolute inset-0 h-full w-full overflow-visible text-ink"
      aria-hidden="true"
    >
      <defs>
        <pattern id="iso-hatch" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" strokeWidth="1" opacity="0.55" />
        </pattern>
        <pattern id="iso-water" width="14" height="6" patternUnits="userSpaceOnUse">
          <path d="M1 3q3 -2.5 6 0t6 0" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.45" />
        </pattern>
      </defs>
      <Ground />
      {/* back to front, so nearer things cover farther ones */}
      {TREES.filter((t) => !near(t)).map(([x, y]) => (
        <Tree key={`${x}-${y}`} x={x} y={y} />
      ))}
      <Shed built={built.shed} />
      <Crane built={built.crane} />
      {TREES.filter(near).map(([x, y]) => (
        <Tree key={`${x}-${y}`} x={x} y={y} />
      ))}
      <Yard built={built.yard} />
      <Bridge built={built.bridge} />
      <Office built={built.office} />
      <Gate built={built.gate} />
      <Notes />
    </svg>
  )
}

// --- walking ------------------------------------------------------------------------

const routeLength = (route) =>
  route.slice(1).reduce((s, b, i) => s + Math.hypot(b[0] - route[i][0], b[1] - route[i][1]), 0)
const LENGTHS = Object.fromEntries(Object.entries(ROUTES).map(([k, r]) => [k, routeLength(r)]))

// the point `d` along a route, and the direction of travel there
function along(route, d) {
  let left = d
  for (let i = 1; i < route.length; i++) {
    const [ax, ay] = route[i - 1]
    const [bx, by] = route[i]
    const len = Math.hypot(bx - ax, by - ay)
    if (left <= len || i === route.length - 1) {
      const t = len ? Math.min(1, left / len) : 1
      return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, dx: bx - ax, dy: by - ay }
    }
    left -= len
  }
  return { x: route[0][0], y: route[0][1], dx: 0, dy: 0 }
}

const ALL_BUILT = Object.fromEntries(TOUR.map((z) => [z, true]))
const NONE_BUILT = Object.fromEntries(TOUR.map((z) => [z, false]))

export default function SitePlan({ className = '' }) {
  const rootRef = useRef(null)
  const walkerRef = useRef(null)
  const api = useRef(null)
  const reduced = useReducedMotion()
  const [built, setBuilt] = useState(() =>
    reduced ? ALL_BUILT : { ...NONE_BUILT, ...Object.fromEntries(BUILT_AT_START.map((z) => [z, true])) },
  )
  const [active, setActive] = useState(null)
  const allBuilt = TOUR.every((z) => built[z])

  useEffect(() => {
    const root = rootRef.current
    const walker = walkerRef.current
    // he starts at the gate, where he came in
    const state = { route: 'gate', d: LENGTHS.gate, legs: [], dwell: 0, target: null }
    let facing = 'up'
    let visible = true
    let last = 0
    let raf = 0

    function place(frame) {
      const p = along(ROUTES[state.route], state.d)
      const [sx, sy] = P(p.x, p.y)
      walker.style.left = `${(sx / W) * 100}%`
      walker.style.top = `${(sy / H) * 100}%`
      walker.style.backgroundPositionX = `${((DIRECTIONS.indexOf(facing) * 4 + frame) / 15) * 100}%`
    }

    if (reduced) {
      // standing just inside the gate, everything built
      setBuilt(ALL_BUILT)
      state.d = LENGTHS.gate * 0.55
      facing = 'down'
      place(0)
      return undefined
    }

    // back along the road he is on to the hub, then out along the target's
    function goTo(zone) {
      state.target = zone
      state.dwell = 0
      state.legs = []
      if (state.route !== zone) state.legs.push({ route: state.route, to: 0 })
      state.legs.push({ route: zone, to: LENGTHS[zone] })
    }

    function arrive(zone) {
      facing = 'up'
      state.dwell = DWELL_MS
      setActive(zone)
      setBuilt((b) => (b[zone] ? b : { ...b, [zone]: true }))
    }

    function tick(now) {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(64, now - (last || now))
      last = now
      if (!visible) return

      if (state.dwell > 0) {
        state.dwell -= dt
        if (state.dwell <= 0) {
          setActive(null)
          goTo(TOUR[(TOUR.indexOf(state.target) + 1) % TOUR.length])
        }
        place(0)
        return
      }

      const leg = state.legs[0]
      if (!leg) {
        place(0)
        return
      }
      if (leg.route !== state.route) {
        // turning off the hub onto the next road
        state.route = leg.route
        state.d = 0
      }
      const step = (WALK_SPEED * dt) / 1000
      const dir = Math.sign(leg.to - state.d) || 1
      state.d = dir > 0 ? Math.min(leg.to, state.d + step) : Math.max(leg.to, state.d - step)

      // face the way he is heading on screen
      const p = along(ROUTES[state.route], state.d)
      const sdx = (p.dx - p.dy) * COS * dir
      const sdy = (p.dx + p.dy) * 0.5 * dir
      facing = Math.abs(sdx) > Math.abs(sdy) * 1.1 ? (sdx > 0 ? 'right' : 'left') : sdy > 0 ? 'down' : 'up'

      if (state.d === leg.to) {
        state.legs.shift()
        if (!state.legs.length) arrive(state.target)
      }
      place(Math.floor((now / 1000) * WALK_FPS) % 4)
    }

    place(0)
    api.current = { goTo }
    // let the drawing come in before he sets off
    const start = setTimeout(() => goTo(TOUR[0]), 1300)
    raf = requestAnimationFrame(tick)
    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
    observer.observe(root)

    return () => {
      clearTimeout(start)
      cancelAnimationFrame(raf)
      observer.disconnect()
      api.current = null
    }
  }, [reduced])

  function toggleAll() {
    track('site_plan_toggle', { built: !allBuilt })
    setBuilt(allBuilt ? { ...NONE_BUILT } : ALL_BUILT)
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={rootRef} className="site-plan relative select-none" style={{ aspectRatio: `${W} / ${H}` }}>
        <p className="sr-only">{content.description}</p>
        <Drawing built={built} />
        <Leaders active={active} built={built} />
        <div ref={walkerRef} className="engineer-sprite site-plan-walker pointer-events-none absolute" aria-hidden="true" />

        {/* below sm the drawing is ~340px across: the labels shrink to their
            lettered circles and the key underneath carries the names */}
        {content.labels.map((label) => {
          const { at, anchor } = LABEL_AT[label.zone]
          const on = active === label.zone
          const style = {
            top: `${(at[1] / H) * 100}%`,
            [anchor === 'right' ? 'right' : 'left']: `${((anchor === 'right' ? W - at[0] : at[0]) / W) * 100}%`,
          }
          return (
            <LabelLink
              key={label.zone}
              label={label}
              onPoint={() => api.current?.goTo(label.zone)}
              className={`group absolute flex -translate-y-1/2 items-center gap-2 bg-paper/85 p-0.5 sm:p-1 ${
                anchor === 'right' ? 'flex-row-reverse text-right sm:pl-2' : 'sm:pr-2'
              }`}
              style={style}
            >
              <TagCircle tag={label.tag} on={on} />
              <span className={`hidden flex-col leading-tight sm:flex ${anchor === 'right' ? 'items-end' : 'items-start'}`}>
                <span className={`text-sm transition-colors duration-200 ${on ? 'text-clay' : 'text-ink group-hover:text-clay'}`}>
                  {label.section}
                </span>
                <span className="text-[12px] text-faint">{label.name}</span>
              </span>
            </LabelLink>
          )
        })}
      </div>

      <nav aria-label={content.legend.label} className="relative mt-5 sm:hidden">
        <p className="text-sm text-faint">{content.legend.heading}</p>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 border-t border-ink/20">
          {content.labels.map((label) => (
            <li key={label.zone} className="border-b border-ink/10">
              <LabelLink
                label={label}
                onPoint={() => api.current?.goTo(label.zone)}
                className="group flex min-h-11 items-center gap-2"
              >
                <TagCircle tag={label.tag} on={active === label.zone} />
                <span className="text-sm text-ink">{label.section}</span>
              </LabelLink>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={toggleAll}
        aria-pressed={allBuilt}
        className="relative mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 border border-ink/50 bg-paper/90 px-3 text-[13px] text-ink transition-colors duration-150 hover:border-clay hover:text-clay sm:absolute sm:bottom-[3%] sm:right-[2%] sm:mt-0 sm:min-h-9"
      >
        <span className={`h-1.5 w-1.5 ${allBuilt ? 'bg-moss' : 'bg-clay'}`} aria-hidden="true" />
        {allBuilt ? content.clear : content.buildAll}
      </button>
    </div>
  )
}

// leader lines from each label to its structure; until it is built, to the
// middle of its footprint
function Leaders({ active, built }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      <g data-hair fill="none">
        {content.labels.map(({ zone }) => {
          const { at } = LABEL_AT[zone]
          const [ax, ay, az] = ANCHOR[zone]
          const [tx, ty] = P(ax, ay, built[zone] ? az : 0)
          const on = active === zone
          return (
            <g key={zone} className={on ? 'text-clay' : 'text-ink'} stroke="currentColor" opacity={on ? 1 : 0.6}>
              <path d={`M${f(tx)} ${f(ty)}L${at[0]} ${at[1]}`} />
              <circle cx={tx} cy={ty} r="3" fill="currentColor" stroke="none" />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

function TagCircle({ tag, on }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] leading-none transition-colors duration-200 sm:h-6 sm:w-6 sm:text-[11px] ${
        on ? 'border-clay bg-clay text-paper' : 'border-ink/60 bg-paper text-ink group-hover:border-clay group-hover:text-clay'
      }`}
    >
      {tag}
    </span>
  )
}

// a label on the drawing or a line of the key: a section of this page, or
// /world. Pointing at one sends the engineer to that structure.
function LabelLink({ label, onPoint, className, style, children }) {
  const shared = {
    onPointerEnter: onPoint,
    onFocus: onPoint,
    className,
    style,
    'aria-label': `${label.tag}: ${label.section}`,
  }
  return label.href.startsWith('/') ? (
    <Link to={label.href} onClick={() => track('world_explore_click', { source: 'site_plan' })} {...shared}>
      {children}
    </Link>
  ) : (
    <a href={label.href} {...shared}>
      {children}
    </a>
  )
}

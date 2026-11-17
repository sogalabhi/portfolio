import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { track } from '@vercel/analytics'
import useReducedMotion from '../../hooks/useReducedMotion'
import plan from '../../world/data/plan.json'
import content from '../../content/site-plan.json'

// The island from /world, as a site plan that gets built. Three layers share
// one coordinate system (world px, the map's 1280x896):
//   1. the plan - linework generated from the same layout the map is built
//      from (scripts/world/build-plan.mjs), so it sits exactly over the art
//   2. a canvas showing the rendered island (scripts/world/build-preview.mjs),
//      but only the tiles that have been "built" so far
//   3. the avatar, walking the paths between the plaza and each door
// Tiles are built around the avatar as he walks and under the visitor's
// cursor, a tile at a time - which is all a tile-based world is.

const W = plan.width
const H = plan.height
const TILE = plan.tile
const COLS = W / TILE
const ROWS = H / TILE

const TOUR = ['workshop', 'tower', 'shrine', 'archive', 'terminal', 'garden']
const WALK_SPEED = 52 // world px per second
const DWELL_MS = 2600
const BUILD_RADIUS = { avatar: 92, pointer: 60, tap: 104, start: 132 }
const WALK_FPS = 7
const DIRECTIONS = ['down', 'left', 'right', 'up'] // row order in avatar.png

// where each label sits, in world px; `anchor` is the side of the label that
// touches `at`. Its leader runs to the nearest point of the building.
const LABEL_AT = {
  workshop: { at: [236, 132], anchor: 'right' },
  tower: { at: [770, 66], anchor: 'left' },
  shrine: { at: [1066, 156], anchor: 'left' },
  archive: { at: [1104, 752], anchor: 'left' },
  terminal: { at: [524, 872], anchor: 'right' },
  garden: { at: [186, 786], anchor: 'right' },
}
const LEADER_INSET = 5
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const LABELS = Object.fromEntries(
  plan.buildings
    .filter((b) => LABEL_AT[b.id])
    .map((b) => {
      const { at, anchor } = LABEL_AT[b.id]
      const to = [
        clamp(at[0], b.x + LEADER_INSET, b.x + b.w - LEADER_INSET),
        clamp(at[1], b.y + LEADER_INSET, b.y + b.h - LEADER_INSET),
      ]
      return [b.id, { at, anchor, to, centre: [b.x + b.w / 2, b.y + b.h / 2] }]
    })
)
const METRES = ((plan.extent.x2 - plan.extent.x1) / TILE).toFixed(1)

// survey grid: a small cross every ten tiles
const GRID_STEP = TILE * 10
let GRID_CROSSES = ''
for (let y = GRID_STEP; y < H; y += GRID_STEP) {
  for (let x = GRID_STEP; x < W; x += GRID_STEP) GRID_CROSSES += `M${x - 4} ${y}h8M${x} ${y - 4}v8`
}

// deterministic per-tile raggedness for the edge of a built patch
function tileNoise(tx, ty) {
  let h = Math.imul(tx, 374761393) + Math.imul(ty, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

// Only the island and a ragged fringe of water around it ever get built - the
// open sea stays a drawing, so the built island sits on the sheet instead of
// ending in a hard rectangle. Same coast formula as scripts/world/shape.mjs.
const SEA_FRINGE = 1.1
const BUILDABLE = new Uint8Array(COLS * ROWS)
{
  const { cx, cy, rx, ry, wobble } = plan.island
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const dx = ((tx + 0.5) * TILE - cx) / rx
      const dy = ((ty + 0.5) * TILE - cy) / ry
      const theta = Math.atan2(dy, dx)
      const edge = 1 + wobble.reduce((s, [freq, phase, amp]) => s + amp * Math.sin(freq * theta + phase), 0)
      if (Math.hypot(dx, dy) / edge < SEA_FRINGE + 0.07 * tileNoise(tx, ty)) BUILDABLE[ty * COLS + tx] = 1
    }
  }
}

// plaza -> door -> plaza for each stop, as one endless list of legs
function buildTour() {
  return TOUR.flatMap((zone) => {
    const out = plan.routes[zone]
    return [
      { walk: out },
      { dwell: zone },
      { walk: [...out].reverse() },
    ]
  })
}

function Linework() {
  const road = plan.pathWidth
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="site-plan-lines absolute inset-0 h-full w-full overflow-visible text-ink"
      aria-hidden="true"
    >
      <defs>
        <pattern id="plan-hatch" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" strokeWidth="1.2" />
        </pattern>
        <pattern id="plan-furrow" width="5" height="5" patternUnits="userSpaceOnUse">
          <line x1="0" y1="2.5" x2="5" y2="2.5" stroke="currentColor" strokeWidth="0.8" />
        </pattern>
      </defs>

      <g data-hair fill="none" stroke="currentColor">
        <path d={GRID_CROSSES} opacity="0.28" />
        <g opacity="0.14">
          {plan.sea.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g opacity="0.22" strokeDasharray="1 3">
          {plan.land.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <path d={plan.beach} opacity="0.4" strokeDasharray="5 3" />
        <path data-heavy d={plan.coast} opacity="0.85" strokeWidth="1.5" />
      </g>

      {/* roads: every outline first, then every fill, so junctions merge */}
      <g opacity="0.75" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {Object.values(plan.paths).map((d, i) => (
          <path key={i} d={d} strokeWidth={road + 3.5} />
        ))}
        {plan.yards.map((y, i) => (
          <circle key={i} cx={y.x} cy={y.y} r={y.r + 1.75} fill="currentColor" stroke="none" />
        ))}
        <circle cx={plan.plaza.x} cy={plan.plaza.y} r={plan.plaza.r + 1.75} fill="currentColor" stroke="none" />
      </g>
      <g fill="none" stroke="var(--color-paper)" strokeLinecap="round" strokeLinejoin="round">
        {Object.values(plan.paths).map((d, i) => (
          <path key={i} d={d} strokeWidth={road} />
        ))}
        {plan.yards.map((y, i) => (
          <circle key={i} cx={y.x} cy={y.y} r={y.r} fill="var(--color-paper)" stroke="none" />
        ))}
        <circle cx={plan.plaza.x} cy={plan.plaza.y} r={plan.plaza.r} fill="var(--color-paper)" stroke="none" />
      </g>

      <g data-hair fill="none" stroke="currentColor">
        {/* centrelines, the way a road is set out */}
        <g className="text-clay" stroke="currentColor" opacity="0.55" strokeDasharray="9 4 2 4">
          {Object.values(plan.paths).map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g opacity="0.5">
          <circle cx={plan.plaza.x} cy={plan.plaza.y} r={plan.plaza.r - 12} strokeDasharray="3 3" />
          <circle cx={plan.plaza.x} cy={plan.plaza.y} r={plan.plaza.r - 30} />
        </g>

        <g opacity="0.5">
          {plan.trees.map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r} />
              <path d={`M${x - 2.5} ${y}h5M${x} ${y - 2.5}v5`} />
            </g>
          ))}
        </g>
        <g opacity="0.38">
          {plan.bushes.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} strokeDasharray="2 2" />
          ))}
        </g>
        <g opacity="0.6">
          {plan.fence.map(([x1, x2, y], i) => (
            <path key={i} d={`M${x1} ${y}H${x2}`} strokeDasharray="1 3" strokeWidth="2" />
          ))}
          {plan.boxes.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.kind === 'bed' ? 'url(#plan-furrow)' : 'none'} />
          ))}
        </g>
      </g>

      <g className="text-ink" fill="currentColor" opacity="0.55">
        {plan.rocks.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.6" />
        ))}
      </g>
      <g data-hair className="text-clay" stroke="currentColor" fill="var(--color-paper)" opacity="0.9">
        {plan.lamps.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" />
        ))}
      </g>

      <g data-hair data-heavy stroke="currentColor" strokeWidth="1.5">
        {plan.buildings.map((b) => (
          <g key={b.id}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="var(--color-paper)" />
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="url(#plan-hatch)" />
          </g>
        ))}
      </g>
    </svg>
  )
}

function Annotations({ active }) {
  const [s0, s1, s2] = content.scale
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      aria-hidden="true"
    >
      <g data-hair fill="none">
        {content.labels.map(({ zone }) => {
          const { at, to } = LABELS[zone]
          const on = active === zone
          return (
            <g key={zone} className={on ? 'text-clay' : 'text-ink'} stroke="currentColor" opacity={on ? 1 : 0.7}>
              <path d={`M${to[0]} ${to[1]}L${at[0]} ${at[1]}`} />
              <circle cx={to[0]} cy={to[1]} r="3" fill="currentColor" stroke="none" />
            </g>
          )
        })}
      </g>

      {/* overall width, dimensioned the way a drawing does it */}
      <g className="text-ink" stroke="currentColor" fill="none" opacity="0.6" data-hair>
        <path
          d={`M${plan.extent.x1} 26H${plan.extent.x2}M${plan.extent.x1} 18V${plan.extent.y - 8}M${plan.extent.x2} 18V60` +
            `M${plan.extent.x1 - 5} 31l10 -10M${plan.extent.x2 - 5} 31l10 -10`}
        />
        <g className="max-sm:hidden">
          <rect x={W / 2 - 46} y="14" width="92" height="24" fill="var(--color-paper)" stroke="none" />
          <text
            x={W / 2}
            y="32"
            textAnchor="middle"
            fill="currentColor"
            stroke="none"
            className="font-mono"
            fontSize="16"
          >
            {METRES} m
          </text>
        </g>
      </g>

      {/* north point */}
      <g transform="translate(1196 96)" className="text-ink" stroke="currentColor" fill="none" data-hair>
        <circle r="22" opacity="0.5" />
        <path d="M0 -30L7 8L0 2L-7 8Z" fill="currentColor" stroke="none" />
        <path d="M-22 0h-6M22 0h6M0 22v6" opacity="0.5" />
        {/* the lettering is a few px tall on a phone - the marks carry it there */}
        <text
          y="-38"
          textAnchor="middle"
          fill="currentColor"
          stroke="none"
          className="font-mono max-sm:hidden"
          fontSize="17"
        >
          {content.north}
        </text>
      </g>

      {/* scale bar: one tile is one metre */}
      <g transform="translate(44 872)" className="text-ink" stroke="currentColor" fill="none" data-hair>
        <path d={`M0 0H${TILE * 10}M0 -5V5M${TILE * 5} -5V5M${TILE * 10} -5V5`} />
        <rect x="0" y="-2.5" width={TILE * 5} height="5" fill="currentColor" stroke="none" />
        <g fill="currentColor" stroke="none" className="font-mono max-sm:hidden" fontSize="15" textAnchor="middle">
          <text x="0" y="-12">{s0}</text>
          <text x={TILE * 5} y="-12">{s1}</text>
          <text x={TILE * 10} y="-12">{s2}</text>
        </g>
      </g>
    </svg>
  )
}

export default function SitePlan({ className = '' }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const avatarRef = useRef(null)
  const lensRef = useRef(null)
  const api = useRef(null)
  const reduced = useReducedMotion()
  const [active, setActive] = useState(null)
  const [built, setBuilt] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const avatar = avatarRef.current
    const lens = lensRef.current
    const ctx = canvas.getContext('2d')
    const revealed = new Uint8Array(COLS * ROWS)
    let image = null

    const drawTile = (tx, ty) => ctx.drawImage(image, tx * TILE, ty * TILE, TILE, TILE, tx * TILE, ty * TILE, TILE, TILE)

    // build every tile within r of a point - ragged at the rim, so a patch
    // grows a tile at a time rather than as a clean disc
    function reveal(x, y, r) {
      const x0 = Math.max(0, Math.floor((x - r) / TILE))
      const x1 = Math.min(COLS - 1, Math.floor((x + r) / TILE))
      const y0 = Math.max(0, Math.floor((y - r) / TILE))
      const y1 = Math.min(ROWS - 1, Math.floor((y + r) / TILE))
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const i = ty * COLS + tx
          if (revealed[i] || !BUILDABLE[i]) continue
          const d = Math.hypot((tx + 0.5) * TILE - x, (ty + 0.5) * TILE - y)
          if (d > r * (0.7 + 0.3 * tileNoise(tx, ty))) continue
          revealed[i] = 1
          if (image) drawTile(tx, ty)
        }
      }
    }

    const img = new Image()
    img.onload = () => {
      image = img
      for (let i = 0; i < revealed.length; i++) if (revealed[i]) drawTile(i % COLS, Math.floor(i / COLS))
    }
    img.src = '/world/island.webp'

    // --- the avatar --------------------------------------------------------------
    const pos = { x: plan.plaza.x, y: plan.plaza.y + 6 }
    let facing = 'down'
    function placeAvatar(frame) {
      avatar.style.left = `${(pos.x / W) * 100}%`
      avatar.style.top = `${(pos.y / H) * 100}%`
      const index = DIRECTIONS.indexOf(facing) * 4 + frame
      avatar.style.backgroundPositionX = `${(index / 15) * 100}%`
    }
    placeAvatar(0)

    // rings that grow over a moment: the opening patch, a tap, "build it all"
    const bursts = []
    const burst = (x, y, to, ms, done) => bursts.push({ x, y, to, ms, t: 0, done })

    const tour = buildTour()
    let leg = 0
    let along = 0 // px walked on the current leg
    let dwellLeft = 0
    let walking = false
    let visible = true
    let last = 0
    let raf = 0
    let started = reduced

    function stepTour(dt) {
      const current = tour[leg]
      if (current.dwell) {
        walking = false
        facing = 'up'
        dwellLeft -= dt
        if (dwellLeft <= 0) {
          setActive(null)
          leg = (leg + 1) % tour.length
          along = 0
        }
        return
      }
      walking = true
      along += (WALK_SPEED * dt) / 1000
      const pts = current.walk
      let remaining = along
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1]
        const [bx, by] = pts[i]
        const len = Math.hypot(bx - ax, by - ay)
        if (remaining <= len) {
          const t = remaining / len
          pos.x = ax + (bx - ax) * t
          pos.y = ay + (by - ay) * t
          const dx = bx - ax
          const dy = by - ay
          // a little stickiness, so a diagonal stretch doesn't flicker between two rows
          const horizontal = Math.abs(dx) > Math.abs(dy) * (facing === 'left' || facing === 'right' ? 0.8 : 1.25)
          facing = horizontal ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
          return
        }
        remaining -= len
      }
      // end of the leg
      ;[pos.x, pos.y] = pts[pts.length - 1]
      leg = (leg + 1) % tour.length
      along = 0
      if (tour[leg].dwell) {
        dwellLeft = DWELL_MS
        setActive(tour[leg].dwell)
      }
    }

    function tick(now) {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(64, now - (last || now))
      last = now
      if (!visible) return

      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i]
        b.t += dt
        const k = Math.min(1, b.t / b.ms)
        reveal(b.x, b.y, b.to * (1 - (1 - k) ** 2))
        if (k === 1) {
          bursts.splice(i, 1)
          b.done?.()
        }
      }

      if (started && !reduced) {
        stepTour(dt)
        reveal(pos.x, pos.y - 8, BUILD_RADIUS.avatar)
      }
      placeAvatar(walking ? Math.floor((now / 1000) * WALK_FPS) % 4 : 0)
    }

    // let the linework draw itself in before anything gets built
    const startTimer = setTimeout(
      () => burst(pos.x, pos.y, BUILD_RADIUS.start, 900, () => (started = true)),
      reduced ? 0 : 1100,
    )
    raf = requestAnimationFrame(tick)

    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
    observer.observe(root)

    // --- the visitor's hand ---------------------------------------------------------
    const toWorld = (e) => {
      const rect = root.getBoundingClientRect()
      return {
        x: ((e.clientX - rect.left) / rect.width) * W,
        y: ((e.clientY - rect.top) / rect.height) * H,
        scale: rect.width / W,
      }
    }
    function onMove(e) {
      if (e.pointerType !== 'mouse') return
      const { x, y, scale } = toWorld(e)
      reveal(x, y, BUILD_RADIUS.pointer)
      const size = BUILD_RADIUS.pointer * 2 * scale
      lens.style.width = lens.style.height = `${size}px`
      lens.style.transform = `translate(${(x * scale - size / 2).toFixed(1)}px, ${(y * scale - size / 2).toFixed(1)}px)`
      lens.style.opacity = '1'
    }
    const onLeave = () => (lens.style.opacity = '0')
    function onDown(e) {
      if (e.pointerType === 'mouse' || e.target.closest('a, button')) return
      const { x, y } = toWorld(e)
      burst(x, y, BUILD_RADIUS.tap, 450)
    }
    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerleave', onLeave)
    root.addEventListener('pointerdown', onDown)

    api.current = {
      buildZone(zone) {
        const [x, y] = LABELS[zone].centre
        burst(x, y, 84, reduced ? 1 : 500)
      },
      buildAll() {
        burst(pos.x, pos.y, Math.hypot(W, H), reduced ? 1 : 1800)
        setBuilt(true)
      },
      clear() {
        bursts.length = 0
        revealed.fill(0)
        ctx.clearRect(0, 0, W, H)
        burst(pos.x, pos.y, BUILD_RADIUS.start, reduced ? 1 : 600)
        setBuilt(false)
      },
    }

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(startTimer)
      observer.disconnect()
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      root.removeEventListener('pointerdown', onDown)
    }
  }, [reduced])

  function toggleBuilt() {
    track('site_plan_toggle', { built: !built })
    if (built) api.current?.clear()
    else api.current?.buildAll()
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={rootRef} className="site-plan relative select-none" style={{ aspectRatio: `${W} / ${H}` }}>
        <p className="sr-only">{content.description}</p>
        <Linework />
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        />
        <div
          ref={avatarRef}
          className="avatar-sprite site-plan-avatar pointer-events-none absolute"
          aria-hidden="true"
        />
        <Annotations active={active} />
        <div
          ref={lensRef}
          className="pointer-events-none absolute left-0 top-0 rounded-full border border-clay/70 opacity-0 transition-opacity duration-150"
          aria-hidden="true"
        />

        {/* below sm the drawing is ~340px across: the labels shrink to their
            lettered circles and the key underneath carries the names */}
        {content.labels.map((label) => {
          const { at, anchor } = LABELS[label.zone]
          const on = active === label.zone
          const style = {
            top: `${(at[1] / H) * 100}%`,
            [anchor === 'right' ? 'right' : 'left']: `${((anchor === 'right' ? W - at[0] : at[0]) / W) * 100}%`,
          }
          return (
            <LabelLink
              key={label.zone}
              label={label}
              onBuild={() => api.current?.buildZone(label.zone)}
              className={`group absolute flex -translate-y-1/2 items-center gap-2 rounded-full bg-paper/85 p-0.5 sm:p-1 ${
                anchor === 'right' ? 'flex-row-reverse text-right sm:pl-3' : 'sm:pr-3'
              }`}
              style={style}
            >
              <TagCircle tag={label.tag} on={on} />
              <span className={`hidden flex-col sm:flex ${anchor === 'right' ? 'items-end' : 'items-start'}`}>
                <span className="font-mono text-[11px] uppercase leading-tight tracking-[0.08em] text-ink">
                  {label.name}
                </span>
                <span
                  className={`text-[13px] leading-tight transition-colors duration-200 ${
                    on ? 'text-clay' : 'text-slate group-hover:text-clay'
                  }`}
                >
                  {label.section}
                </span>
              </span>
            </LabelLink>
          )
        })}
      </div>

      <nav aria-label={content.legend.label} className="relative mt-5 bg-paper/85 sm:hidden">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">{content.legend.heading}</p>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 border-t border-ink/20">
          {content.labels.map((label) => (
            <li key={label.zone} className="border-b border-ink/10">
              <LabelLink
                label={label}
                onBuild={() => api.current?.buildZone(label.zone)}
                className="group flex min-h-11 items-center gap-2"
              >
                <TagCircle tag={label.tag} on={active === label.zone} />
                <span className="min-w-0 leading-tight">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink">{label.name}</span>
                  <span className="block text-[13px] text-slate">{label.section}</span>
                </span>
              </LabelLink>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={toggleBuilt}
        aria-pressed={built}
        className="relative mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 border border-ink/50 bg-paper/90 px-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink transition-colors duration-150 hover:border-clay hover:text-clay sm:absolute sm:bottom-[2%] sm:right-[3%] sm:mt-0 sm:min-h-9"
      >
        <span className={`h-1.5 w-1.5 ${built ? 'bg-moss' : 'bg-clay'}`} aria-hidden="true" />
        {built ? content.clear : content.buildAll}
      </button>
    </div>
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

// a label on the plan or a line of the key: a section of this page, or /world.
// Pointing at one builds the ground around its building.
function LabelLink({ label, onBuild, className, style, children }) {
  const shared = {
    onPointerEnter: onBuild,
    onFocus: onBuild,
    className,
    style,
    'aria-label': `${label.tag} ${label.name}: ${label.section}`,
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

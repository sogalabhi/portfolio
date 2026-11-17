import { useEffect, useState } from 'react'
import MarginCharacter from '../hero/MarginCharacter'
import sections from '../../content/sections.json'

// The page's margins, drawn the way the rest of the page is: as a plan.
//
// Left: a road alignment running from below the hero to the end of the page,
// set out like one on a drawing - a clay centreline, a tick every 100 px, a
// chainage label every 500, and a lettered station where each section starts
// (the same letters the hero's site plan uses). The avatar walks it
// (MarginCharacter); the stretch he has already walked is drawn solid, "as
// built", down to his feet (`--margin-built`, which he publishes).
//
// Right: planting, in the plan's symbols - a circle with a cross for a tree,
// a dashed circle for a bush - placed by a seeded hash, so it's the same
// planting on every load, and sparse.
//
// xl only. At 1280 px the content column (max-w-5xl plus its padding) leaves
// 168 px of clear margin on each side; the road sits at 48 px and the
// planting within 120 px of the right edge, so neither reaches the text.
// Both start below the hero, whose sheet runs almost edge to edge.

const ROAD_X = 48 // the avatar's centre: MarginCharacter is 32 px wide at left-8
const TICK_EVERY = 100
const LABEL_EVERY = 500
const HERO_GAP = 64 // between the hero sheet and the start of the road: room for the avatar, 48 px tall, to stand at 0+000
const END_GAP = 48 // between the road's end and the footer

const PLANT_WIDTH = 120
const BAND = 260
const FILL_CHANCE = 0.5

// in page order; a section without a tag (About) gets no station
const STATIONS = ['work', 'experience', 'skills', 'achievements', 'contact']
  .map((id) => ({ id, tag: sections[id].tag }))
  .filter((s) => s.tag)

function hash(n, seed) {
  let h = Math.imul(n, 2654435761) + seed
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

const chainage = (px) => `${Math.floor(px / 1000)}+${String(px % 1000).padStart(3, '0')}`

function planting(start, end) {
  const items = []
  for (let i = 0; start + (i + 1) * BAND < end; i++) {
    if (hash(i, 7331) > FILL_CHANCE) continue
    const top = start + i * BAND + 30 + hash(i, 5) * (BAND - 60)
    const count = 1 + Math.floor(hash(i, 11) * 3)
    for (let k = 0; k < count; k++) {
      const tree = k === 0 ? hash(i, 99) > 0.3 : hash(i * 7 + k, 17) > 0.6
      const r = tree ? 8 + hash(i * 5 + k, 23) * 6 : 4 + hash(i * 5 + k, 29) * 3
      items.push({
        key: `${i}-${k}`,
        tree,
        r,
        x: 34 + hash(i * 3 + k, 21) * 52,
        y: top + k * (14 + hash(i + k, 3) * 12),
      })
    }
  }
  return items
}

function measure() {
  const docTop = (el) => el.getBoundingClientRect().top + window.scrollY
  const hero = document.getElementById('hero')
  const main = document.getElementById('main')
  if (!hero || !main) return null
  const start = Math.round(docTop(hero) + hero.offsetHeight + HERO_GAP)
  const end = Math.round(docTop(main) + main.offsetHeight - END_GAP)
  const stations = STATIONS.flatMap(({ id, tag }) => {
    const section = document.getElementById(id)
    if (!section) return []
    const header = section.querySelector('[data-section-header]') ?? section
    return [{ tag, y: Math.round(docTop(header) + 10) }]
  })
  return { start, end, stations }
}

export default function MarginAlignment() {
  const [geo, setGeo] = useState(null)

  useEffect(() => {
    let frame = 0
    const recompute = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = measure()
        setGeo((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
      })
    }
    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(document.body)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  if (!geo || geo.end <= geo.start) return null
  const { start, end, stations } = geo
  const length = end - start

  const ticks = []
  for (let c = 0; c <= length; c += TICK_EVERY) ticks.push(c)

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden xl:block print:hidden" aria-hidden="true">
      <svg
        className="absolute left-0 overflow-visible text-ink"
        style={{ top: start }}
        width={ROAD_X * 2}
        height={length}
        viewBox={`0 0 ${ROAD_X * 2} ${length}`}
      >
        {/* edges of the carriageway, faint */}
        <path d={`M${ROAD_X - 18} 0V${length}M${ROAD_X + 18} 0V${length}`} stroke="currentColor" opacity="0.12" />
        <path
          d={`M${ROAD_X} 0V${length}`}
          className="text-clay"
          stroke="currentColor"
          opacity="0.6"
          strokeDasharray="9 4 2 4"
        />
        <g stroke="currentColor" opacity="0.35">
          {ticks.map((c) => (
            <path key={c} d={`M${ROAD_X - (c % LABEL_EVERY ? 4 : 8)} ${c}H${ROAD_X + (c % LABEL_EVERY ? 4 : 8)}`} />
          ))}
        </g>
        <g className="font-mono" fill="currentColor" opacity="0.45" fontSize="9" textAnchor="end">
          {ticks
            .filter((c) => c % LABEL_EVERY === 0)
            .map((c) => (
              <text key={c} x={ROAD_X - 13} y={c + 3}>
                {chainage(c)}
              </text>
            ))}
        </g>
      </svg>

      {/* as built: solid from the start of the road to the avatar's feet */}
      <div
        className="absolute bg-ink/70"
        style={{
          left: ROAD_X - 0.75,
          width: 1.5,
          top: start,
          height: `clamp(0px, calc(var(--margin-built, 0px) - ${start}px), ${length}px)`,
        }}
      />

      {stations.map(({ tag, y }) => (
        <span
          key={tag}
          className="absolute flex h-6 w-6 items-center justify-center rounded-full border border-ink/60 bg-paper font-mono text-[11px] leading-none text-ink"
          style={{ left: ROAD_X - 12, top: y - 12 }}
        >
          {tag}
        </span>
      ))}

      <svg
        className="absolute right-0 overflow-visible text-ink"
        style={{ top: 0 }}
        width={PLANT_WIDTH}
        height={end}
        viewBox={`0 0 ${PLANT_WIDTH} ${end}`}
      >
        <g fill="none" stroke="currentColor" opacity="0.32">
          {planting(start, end).map(({ key, tree, r, x, y }) =>
            tree ? (
              <g key={key}>
                <circle cx={x} cy={y} r={r} />
                <path d={`M${x - 2.5} ${y}h5M${x} ${y - 2.5}v5`} />
              </g>
            ) : (
              <circle key={key} cx={x} cy={y} r={r} strokeDasharray="2 2" />
            ),
          )}
        </g>
      </svg>

      <MarginCharacter start={start} end={end} />
    </div>
  )
}

import { useEffect, useState } from 'react'

// Same idea as the /world scatter (WorldScene.placeScatter) ported to the
// homepage: deterministic seeded placement, not Math.random() - same
// island every load. Spans the full document height in both margins,
// rather than one hand-placed sprite per section.
const SPRITES = [
  { file: 'tree_large_a', height: 64 },
  { file: 'tree_large_b', height: 64 },
  { file: 'tree_small_a', height: 40 },
  { file: 'tree_small_b', height: 40 },
  { file: 'bush_a', height: 20 },
  { file: 'bush_b', height: 20 },
  { file: 'bush_c', height: 20 },
  { file: 'rock_a', height: 16 },
  { file: 'rock_b', height: 16 },
  { file: 'rock_c', height: 16 },
  { file: 'flowers_blue', height: 16 },
  { file: 'flowers_red', height: 16 },
  { file: 'flowers_white', height: 16 },
]

const BAND_HEIGHT = 220
const FILL_CHANCE = 0.6

// Two fixed lanes, not a single distance and not continuous jitter - a
// single uniform inset read as a row of pins glued to the edge; unbounded
// randomness reads as noise. Both sides use the same two values, so it's
// still symmetric, just with depth.
//
// MarginCharacter sits at left-8 (32px) and is 32px wide, so it spans
// [32, 64] on the left. NEAR (70) clears that with a 6px buffer - this is
// why scatter is xl:-only, matching the character: at the lg breakpoint
// (1024px) the content column has no real margin left at all (max-w-5xl
// *is* 1024px), so lanes this far out would land on text there. At xl
// (1280px) the pure margin is 128px per side, and FAR (94) + the widest
// sprite (48px, the large trees) still clears the content's own padding.
const LANES = [70, 94]

function hash(n, seed) {
  let h = Math.imul(n, 2654435761) + seed
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

function buildScatter(docHeight) {
  const bands = Math.floor(docHeight / BAND_HEIGHT)
  const items = []

  for (let i = 1; i < bands; i++) {
    if (hash(i, 7331) > FILL_CHANCE) continue

    const sprite = SPRITES[Math.floor(hash(i, 99) * SPRITES.length)]
    const side = hash(i, 42) > 0.5 ? 'left' : 'right'
    const top = i * BAND_HEIGHT + hash(i, 5) * (BAND_HEIGHT - sprite.height)
    const inset = LANES[Math.floor(hash(i, 21) * LANES.length)]

    items.push({ id: i, src: `/world/sprites/${sprite.file}.png`, height: sprite.height, side, top, inset })
  }

  return items
}

export default function PageScatter() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const recompute = () => setItems(buildScatter(document.documentElement.scrollHeight))
    recompute()

    const ro = new ResizeObserver(recompute)
    ro.observe(document.body)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden xl:block" aria-hidden="true">
      {items.map((it) => (
        <img
          key={it.id}
          src={it.src}
          alt=""
          className="absolute"
          style={{
            top: it.top,
            [it.side]: it.inset,
            height: it.height,
            width: 'auto',
            imageRendering: 'pixelated',
          }}
        />
      ))}
    </div>
  )
}

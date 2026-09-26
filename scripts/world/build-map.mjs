#!/usr/bin/env node
// Generates public/world/map/island.json - a Tiled-format map (open it in the
// free Tiled editor to tweak by hand; re-running this overwrites hand edits,
// so pick one or the other per change) - from the design in layout.mjs.
//
// Terrain is decided per grid vertex (see terrain-spec.mjs): water outside a
// wobbly ellipse, a sand ring inside its edge, grass within, dirt along
// Catmull-Rom paths from the plaza to each door, stone on the plaza. Then:
//   tile layers    water (for viewing in Tiled; the game draws animated water),
//                  sand, grass, path, stone overlays, and a hidden collision
//                  layer blocking every tile that touches water
//   object layers  zones (building base-centres), props, scatter, markers
//
// Scatter is seeded, so the same layout always produces the same island.
//
// Usage: node scripts/world/build-map.mjs   (or npm run world:map)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { hash2 } from '../assets/pixel.mjs'
import { EXTRA_HEX, PALETTE_HEX } from '../assets/palette.mjs'
import { ZONES } from '../../src/world/data/zones.js'
import {
  TILE, COLUMNS, ROWS, LEVEL, OVERLAYS, FULL, edgeTile, FULL_VARIANTS, WATER_TILE, BLOCK_TILE,
} from './terrain-spec.mjs'
import {
  MAP, ISLAND, PLAZA, SPAWN, BUILDINGS, PATH_HALF_WIDTH, YARD_RADIUS, PATHS, PROPS, SCATTER,
} from './layout.mjs'

const OUT = 'public/world/map/island.json'
const W = MAP.cols * TILE
const H = MAP.rows * TILE

// --- atlas frame boxes (trimmed art within the source frame) ------------------
const atlas = JSON.parse(readFileSync('public/world/atlas/atlas.json', 'utf8'))
const FRAMES = Object.fromEntries(
  atlas.textures[0].frames.map((f) => [f.filename, { source: f.sourceSize, trim: f.spriteSourceSize }])
)
// drawn box of a frame placed bottom-anchored at (x, y) - same maths as
// WorldScene's artBox
function artBox(frame, x, y) {
  const f = FRAMES[frame]
  if (!f) throw new Error(`no atlas frame '${frame}'`)
  const left = x - f.source.w / 2 + f.trim.x
  const top = y - f.source.h + f.trim.y
  return { left, top, right: left + f.trim.w, bottom: top + f.trim.h }
}
const overlaps = (a, b, pad = 0) =>
  a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad

// --- island shape --------------------------------------------------------------
const wave = (theta, [freq, phase, amp]) => amp * Math.sin(freq * theta + phase)
// < 1 on the island; sand from 1 - beach(theta) outward
function islandE(x, y) {
  const dx = (x - ISLAND.cx) / ISLAND.rx
  const dy = (y - ISLAND.cy) / ISLAND.ry
  const theta = Math.atan2(dy, dx)
  const wobble = 1 + ISLAND.wobble.reduce((s, w) => s + wave(theta, w), 0)
  return { e: Math.hypot(dx, dy) / wobble, theta }
}
const beachAt = (theta) => ISLAND.beach + wave(theta, ISLAND.beachWobble)

// --- paths ----------------------------------------------------------------------
const zoneById = Object.fromEntries(ZONES.map((z) => [z.id, z]))
const buildingBox = Object.fromEntries(
  Object.entries(BUILDINGS).map(([id, { x, y }]) => [id, artBox(zoneById[id].frame, x, y)])
)
// where a path ends: just in front of the door, below the drawn base
const approach = Object.fromEntries(
  Object.entries(BUILDINGS).map(([id, { x }]) => [id, { x: x + zoneById[id].doorDx, y: buildingBox[id].bottom + 22 }])
)

function catmullRom(points, samplesPerSegment = 16) {
  const pts = [points[0], ...points, points[points.length - 1]]
  const out = []
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]]
    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment
      const t2 = t * t
      const t3 = t2 * t
      const at = (k) =>
        0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)
      out.push([at(0), at(1)])
    }
  }
  out.push(points[points.length - 1])
  return out
}

const polylines = Object.entries(PATHS).map(([id, via]) =>
  catmullRom([[PLAZA.x, PLAZA.y], ...via, [approach[id].x, approach[id].y]])
)

function distToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}
function distToPaths(x, y) {
  let best = Infinity
  for (const line of polylines) {
    for (let i = 1; i < line.length; i++) best = Math.min(best, distToSegment(x, y, line[i - 1], line[i]))
  }
  return best
}

// --- terrain per vertex --------------------------------------------------------
const VC = MAP.cols + 1
const VR = MAP.rows + 1
const V = Array.from({ length: VR }, () => new Array(VC).fill(LEVEL.water))
for (let vy = 0; vy < VR; vy++) {
  for (let vx = 0; vx < VC; vx++) {
    const x = vx * TILE
    const y = vy * TILE
    const { e, theta } = islandE(x, y)
    if (e >= 1) continue
    let level = e >= 1 - beachAt(theta) ? LEVEL.sand : LEVEL.grass
    if (level === LEVEL.grass) {
      const nearYard = Object.values(approach).some((a) => Math.hypot(x - a.x, y - a.y) <= YARD_RADIUS)
      if (nearYard || distToPaths(x, y) <= PATH_HALF_WIDTH) level = LEVEL.path
      const plazaR = PLAZA.r * (1 + 0.06 * Math.sin(5 * Math.atan2(y - PLAZA.y, x - PLAZA.x)))
      if (Math.hypot(x - PLAZA.x, y - PLAZA.y) <= plazaR) level = LEVEL.stone
    }
    V[vy][vx] = level
  }
}
// grass (or anything above it) never touches water directly - keep at least
// one vertex of sand between, or the overlays would draw grass-edge-on-water
for (let vy = 0; vy < VR; vy++) {
  for (let vx = 0; vx < VC; vx++) {
    if (V[vy][vx] < LEVEL.grass) continue
    const nearWater = [-1, 0, 1].some((dy) =>
      [-1, 0, 1].some((dx) => V[vy + dy]?.[vx + dx] === LEVEL.water)
    )
    if (nearWater) V[vy][vx] = LEVEL.sand
  }
}
const levelAt = (x, y) => {
  // lowest of the four vertices around a point - "all of this spot is at least"
  const vx = Math.floor(x / TILE)
  const vy = Math.floor(y / TILE)
  return Math.min(V[vy]?.[vx] ?? 0, V[vy]?.[vx + 1] ?? 0, V[vy + 1]?.[vx] ?? 0, V[vy + 1]?.[vx + 1] ?? 0)
}

// --- tile layers ---------------------------------------------------------------
const tileCount = MAP.cols * MAP.rows
function overlayLayer(level) {
  const data = new Array(tileCount).fill(0)
  const variants = FULL_VARIANTS[level]
  for (let ty = 0; ty < MAP.rows; ty++) {
    for (let tx = 0; tx < MAP.cols; tx++) {
      const mask =
        (V[ty][tx] >= level ? 1 : 0) |
        (V[ty][tx + 1] >= level ? 2 : 0) |
        (V[ty + 1][tx] >= level ? 4 : 0) |
        (V[ty + 1][tx + 1] >= level ? 8 : 0)
      if (!mask) continue
      let index = edgeTile(level, mask)
      if (mask === FULL) {
        // the plain tile most of the time, the variants sprinkled in
        const r = hash2(tx, ty, level * 31)
        index = r < 0.55 ? variants[0] : variants[1 + Math.floor(((r - 0.55) / 0.45) * (variants.length - 1))]
      }
      data[ty * MAP.cols + tx] = index + 1
    }
  }
  return data
}
const collision = new Array(tileCount).fill(0)
for (let ty = 0; ty < MAP.rows; ty++) {
  for (let tx = 0; tx < MAP.cols; tx++) {
    const touchesWater = [V[ty][tx], V[ty][tx + 1], V[ty + 1][tx], V[ty + 1][tx + 1]].includes(LEVEL.water)
    if (touchesWater) collision[ty * MAP.cols + tx] = BLOCK_TILE + 1
  }
}

// --- scatter ---------------------------------------------------------------------
const warnings = []
const propBoxes = PROPS.map(([frame, x, y]) => artBox(frame, x, y))
PROPS.forEach(([frame, x, y], i) => {
  if (distToPaths(x, y) < PATH_HALF_WIDTH) warnings.push(`prop ${frame} @${x},${y} stands on a path`)
  for (const [id, box] of Object.entries(buildingBox)) {
    if (overlaps(propBoxes[i], box)) warnings.push(`prop ${frame} @${x},${y} overlaps building ${id}`)
  }
  if (levelAt(x, y) < LEVEL.sand) warnings.push(`prop ${frame} @${x},${y} is in the water`)
})

for (const [id, box] of Object.entries(buildingBox)) {
  if (levelAt(box.left, box.bottom - 1) < LEVEL.grass || levelAt(box.right, box.bottom - 1) < LEVEL.grass) {
    warnings.push(`building ${id} stands on the beach or in the water`)
  }
}

function pickWeighted(options, r) {
  const total = options.reduce((s, [, w]) => s + w, 0)
  let acc = 0
  for (const [name, w] of options) {
    acc += w / total
    if (r < acc) return name
  }
  return options[options.length - 1][0]
}

const { seed, spacing, density, clearance } = SCATTER
const scatter = []
for (let gy = spacing / 2; gy < H; gy += spacing) {
  for (let gx = spacing / 2; gx < W; gx += spacing) {
    const x = Math.round(gx + (hash2(gx, gy, seed) - 0.5) * spacing * 0.8)
    const y = Math.round(gy + (hash2(gx, gy, seed + 1) - 0.5) * spacing * 0.8)
    const ground = levelAt(x, y)
    const onGrass = ground === LEVEL.grass
    const onSand = ground === LEVEL.sand && V[Math.round(y / TILE)]?.[Math.round(x / TILE)] === LEVEL.sand
    if (!onGrass && !onSand) continue

    const { e } = islandE(x, y)
    const coastward = Math.max(0, Math.min(1, (e - 0.55) / (0.86 - 0.55)))
    const chance = onGrass ? density.inner + (density.coast - density.inner) * coastward : density.sand
    if (hash2(gx, gy, seed + 2) > chance) continue

    const frame = pickWeighted(onGrass ? SCATTER.grass : SCATTER.sand, hash2(gx, gy, seed + 3))
    const box = artBox(frame, x, y)
    // canopies can hang over the beach, never over the water
    if (levelAt(box.left, box.top) < LEVEL.sand || levelAt(box.right, box.top) < LEVEL.sand) continue
    if (Object.values(buildingBox).some((b) => overlaps(box, b, clearance.building))) continue
    if (propBoxes.some((b) => overlaps(box, b, clearance.prop))) continue
    // the trunk/base must stay off paths; a canopy leaning over one is fine
    const baseClear = PATH_HALF_WIDTH + clearance.path
    if (distToPaths(x, y) < baseClear || distToPaths(box.left + 4, y) < baseClear || distToPaths(box.right - 4, y) < baseClear) continue
    if (Math.hypot(x - PLAZA.x, y - PLAZA.y) < PLAZA.r + clearance.plaza) continue
    if (Object.values(approach).some((a) => Math.hypot(x - a.x, y - a.y) < YARD_RADIUS + 12)) continue
    if (Math.hypot(x - SPAWN.x, y - SPAWN.y) < clearance.spawn) continue
    const width = box.right - box.left
    const crowded = scatter.some((s) => {
      const minGap = Math.max(12, Math.min(width, s.width) * 0.7)
      return Math.hypot(x - s.x, y - s.y) < minGap
    })
    if (crowded) continue
    scatter.push({ frame, x, y, width })
  }
}

// --- Tiled JSON ---------------------------------------------------------------------
let objectId = 1
const point = (name, x, y) => ({
  id: objectId++, name, type: '', point: true, x, y, width: 0, height: 0, rotation: 0, visible: true,
})
let layerId = 1
const tileLayer = (name, data, visible = true) => ({
  id: layerId++, name, type: 'tilelayer', width: MAP.cols, height: MAP.rows, x: 0, y: 0, opacity: 1, visible, data,
})
const objectLayer = (name, objects) => ({
  id: layerId++, name, type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects,
})

const OVERLAY_COLOURS = { sand: EXTRA_HEX.sand, grass: PALETTE_HEX[4], path: EXTRA_HEX.dirt, stone: EXTRA_HEX.stone }
// corner-type wang sets, so Tiled's terrain brush paints these overlays
// with the right edge tiles; wangid is [top, TR, right, BR, bottom, BL, left, TL]
const wangsets = OVERLAYS.map((name, i) => {
  const level = i + 1
  const wangid = (mask) => [0, mask & 2 ? 1 : 0, 0, mask & 8 ? 1 : 0, 0, mask & 4 ? 1 : 0, 0, mask & 1 ? 1 : 0]
  const wangtiles = []
  for (let mask = 1; mask < FULL; mask++) wangtiles.push({ tileid: edgeTile(level, mask), wangid: wangid(mask) })
  for (const index of FULL_VARIANTS[level]) wangtiles.push({ tileid: index, wangid: wangid(FULL) })
  return {
    name, class: '', tile: edgeTile(level, FULL), type: 'corner',
    colors: [{ name, class: '', color: OVERLAY_COLOURS[name], tile: edgeTile(level, FULL), probability: 1 }],
    wangtiles,
  }
})

const layers = [
  tileLayer('water', new Array(tileCount).fill(WATER_TILE + 1)),
  ...OVERLAYS.map((name, i) => tileLayer(name, overlayLayer(i + 1))),
  tileLayer('collision', collision, false),
  objectLayer('zones', Object.entries(BUILDINGS).map(([id, { x, y }]) => point(id, x, y))),
  objectLayer('props', PROPS.map(([frame, x, y]) => point(frame, x, y))),
  objectLayer('scatter', scatter.sort((a, b) => a.y - b.y).map(({ frame, x, y }) => point(frame, x, y))),
  objectLayer('markers', [point('spawn', SPAWN.x, SPAWN.y)]),
]

const map = {
  compressionlevel: -1, type: 'map', version: '1.10', tiledversion: '1.10.2',
  orientation: 'orthogonal', renderorder: 'right-down', infinite: false,
  width: MAP.cols, height: MAP.rows, tilewidth: TILE, tileheight: TILE,
  nextlayerid: layerId, nextobjectid: objectId,
  layers,
  tilesets: [{
    firstgid: 1, name: 'terrain', image: '../tiles/terrain.png',
    imagewidth: COLUMNS * TILE, imageheight: ROWS * TILE, tilewidth: TILE, tileheight: TILE,
    columns: COLUMNS, tilecount: COLUMNS * ROWS, margin: 0, spacing: 0, wangsets,
  }],
}

mkdirSync('public/world/map', { recursive: true })
writeFileSync(OUT, JSON.stringify(map))
const counts = scatter.reduce((c, s) => ({ ...c, [s.frame.replace(/_[a-z]$|_(blue|red|white)$/, '')]: (c[s.frame.replace(/_[a-z]$|_(blue|red|white)$/, '')] ?? 0) + 1 }), {})
console.log(`${OUT}: ${MAP.cols}x${MAP.rows}, ${PROPS.length} props, ${scatter.length} scatter ${JSON.stringify(counts)}`)
for (const w of warnings) console.warn(`  ! ${w}`)

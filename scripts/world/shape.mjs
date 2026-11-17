// The island's geometry, worked out from layout.mjs: the coast, where each
// building's art lands, and the path centrelines. Shared by build-map.mjs
// (which turns it into tiles) and build-plan.mjs (which draws it as a site
// plan for the homepage), so the two can't drift apart.

import { readFileSync } from 'node:fs'
import { ZONES } from '../../src/world/data/zones.js'
import { ISLAND, PLAZA, BUILDINGS, PATHS } from './layout.mjs'

// --- atlas frame boxes (trimmed art within the source frame) ------------------
const atlas = JSON.parse(readFileSync('public/world/atlas/atlas.json', 'utf8'))
const FRAMES = Object.fromEntries(
  atlas.textures[0].frames.map((f) => [f.filename, { source: f.sourceSize, trim: f.spriteSourceSize }])
)
// drawn box of a frame placed bottom-anchored at (x, y) - same maths as
// WorldScene's artBox
export function artBox(frame, x, y) {
  const f = FRAMES[frame]
  if (!f) throw new Error(`no atlas frame '${frame}'`)
  const left = x - f.source.w / 2 + f.trim.x
  const top = y - f.source.h + f.trim.y
  return { left, top, right: left + f.trim.w, bottom: top + f.trim.h }
}

// --- island shape --------------------------------------------------------------
export const wave = (theta, [freq, phase, amp]) => amp * Math.sin(freq * theta + phase)
export const wobbleAt = (theta) => 1 + ISLAND.wobble.reduce((s, w) => s + wave(theta, w), 0)
// < 1 on the island; sand from 1 - beach(theta) outward
export function islandE(x, y) {
  const dx = (x - ISLAND.cx) / ISLAND.rx
  const dy = (y - ISLAND.cy) / ISLAND.ry
  const theta = Math.atan2(dy, dx)
  return { e: Math.hypot(dx, dy) / wobbleAt(theta), theta }
}
export const beachAt = (theta) => ISLAND.beach + wave(theta, ISLAND.beachWobble)

// --- paths ----------------------------------------------------------------------
export const zoneById = Object.fromEntries(ZONES.map((z) => [z.id, z]))
export const buildingBox = Object.fromEntries(
  Object.entries(BUILDINGS).map(([id, { x, y }]) => [id, artBox(zoneById[id].frame, x, y)])
)
// where a path ends: just in front of the door, below the drawn base
export const approach = Object.fromEntries(
  Object.entries(BUILDINGS).map(([id, { x }]) => [id, { x: x + zoneById[id].doorDx, y: buildingBox[id].bottom + 22 }])
)

export function catmullRom(points, samplesPerSegment = 16) {
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

// plaza to each door, keyed by zone id
export const pathLines = Object.fromEntries(
  Object.entries(PATHS).map(([id, via]) => [
    id,
    catmullRom([[PLAZA.x, PLAZA.y], ...via, [approach[id].x, approach[id].y]]),
  ])
)

#!/usr/bin/env node
// Generates src/world/data/plan.json - the island as a site plan, for the
// drawing on the homepage (components/hero/SitePlan.jsx). Same geometry the
// map is built from (shape.mjs), so the linework sits exactly over the
// rendered island (build-preview.mjs): coastline, beach line, contours,
// path centrelines, building footprints, planting and furniture, all in
// world px. The sea contours run well past the map edge on purpose - the
// drawing extends under the hero text.
//
// Usage: node scripts/world/build-plan.mjs   (or npm run world:plan)

import { readFileSync, writeFileSync } from 'node:fs'
import { ZONES } from '../../src/world/data/zones.js'
import { MAP, ISLAND, PLAZA, SPAWN, PATH_HALF_WIDTH, YARD_RADIUS } from './layout.mjs'
import { TILE } from './terrain-spec.mjs'
import { artBox, wave, wobbleAt, beachAt, buildingBox, approach, pathLines } from './shape.mjs'

const OUT = 'src/world/data/plan.json'
const r1 = (n) => Math.round(n * 10) / 10

// a closed curve at `scale(theta)` times the island's ellipse, sampled every
// `step` degrees
function ring(scale, step = 2) {
  const points = []
  for (let deg = 0; deg < 360; deg += step) {
    const theta = (deg * Math.PI) / 180
    const rho = scale(theta)
    points.push([ISLAND.cx + ISLAND.rx * rho * Math.cos(theta), ISLAND.cy + ISLAND.ry * rho * Math.sin(theta)])
  }
  return points
}
const toPath = (points, close = false) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`).join('') + (close ? 'Z' : '')

const wobble = (theta) => ISLAND.wobble.reduce((s, w) => s + wave(theta, w), 0)
const coast = ring(wobbleAt)
const beach = ring((theta) => (1 - beachAt(theta)) * wobbleAt(theta))
// indicative ground contours: the coast's shape, flattening out toward the middle
const land = [0.7, 0.52, 0.34].map((c) => ring((theta) => c * (1 + c * wobble(theta))))
// depth contours, spreading and rounding off with distance from the shore.
// They're the bulk of the file and the faintest lines on the sheet, so they're
// sampled more coarsely than the coast - still smooth at 3 degrees.
const sea = Array.from({ length: 13 }, (_, i) => 1.07 * 1.1 ** i).map((c) =>
  ring((theta) => c * (1 + wobble(theta) / c ** 1.5), 3)
)

const map = JSON.parse(readFileSync('public/world/map/island.json', 'utf8'))
const objects = (name) => map.layers.find((l) => l.name === name).objects

const trees = []
const bushes = []
const rocks = []
for (const { name, x, y } of objects('scatter')) {
  const box = artBox(name, x, y)
  const half = (box.right - box.left) / 2
  const cx = (box.left + box.right) / 2
  if (name.startsWith('tree')) trees.push([r1(cx), r1(box.top + half * 0.9), r1(half * 0.85)])
  else if (name.startsWith('bush')) bushes.push([r1(cx), r1(box.bottom - half * 0.7), r1(half * 0.8)])
  else if (name.startsWith('rock')) rocks.push([r1(cx), r1(box.bottom - 3)])
}

const lamps = []
const boxes = [] // benches, beds, crates... anything with a footprint worth a rectangle
const fence = []
for (const { name, x, y } of objects('props')) {
  const box = artBox(name, x, y)
  if (name === 'lamp_post') lamps.push([x, y - 2])
  else if (name.startsWith('fence')) fence.push([r1(box.left), r1(box.right), y - 2])
  else if (name.startsWith('plant')) continue
  else if (name === 'soil_bed') boxes.push({ kind: 'bed', x: r1(box.left), y: r1(box.top), w: r1(box.right - box.left), h: r1(box.bottom - box.top) })
  else boxes.push({ kind: 'prop', x: r1(box.left), y: r1(box.bottom - 10), w: r1(box.right - box.left), h: 10 })
}

// plan view of each building: the box its art covers, with the door on the
// south side
const buildings = ZONES.map((zone) => {
  const box = buildingBox[zone.id]
  return {
    id: zone.id,
    x: r1(box.left),
    y: r1(box.top),
    w: r1(box.right - box.left),
    h: r1(box.bottom - box.top),
    door: [r1(approach[zone.id].x), r1(approach[zone.id].y)],
  }
})

// the island's overall width, for the dimension line across the top
const xs = coast.map(([x]) => x)
const extent = { x1: r1(Math.min(...xs)), x2: r1(Math.max(...xs)), y: r1(Math.min(...coast.map(([, y]) => y))) }

// walking routes for the avatar: the path centrelines, thinned out
const routes = Object.fromEntries(
  Object.entries(pathLines).map(([id, line]) => [
    id,
    line.filter((_, i) => i % 4 === 0 || i === line.length - 1).map(([x, y]) => [r1(x), r1(y)]),
  ])
)

const plan = {
  width: MAP.cols * TILE,
  height: MAP.rows * TILE,
  tile: TILE,
  coast: toPath(coast, true),
  beach: toPath(beach, true),
  land: land.map((points) => toPath(points, true)),
  sea: sea.map((points) => toPath(points, true)),
  paths: Object.fromEntries(Object.entries(pathLines).map(([id, line]) => [id, toPath(line)])),
  pathWidth: PATH_HALF_WIDTH * 2,
  plaza: { x: PLAZA.x, y: PLAZA.y, r: PLAZA.r },
  yards: Object.values(approach).map(({ x, y }) => ({ x: r1(x), y: r1(y), r: YARD_RADIUS })),
  spawn: [SPAWN.x, SPAWN.y],
  // the coast's formula (see shape.mjs islandE), so the page can tell sea from shore
  island: { cx: ISLAND.cx, cy: ISLAND.cy, rx: ISLAND.rx, ry: ISLAND.ry, wobble: ISLAND.wobble },
  extent,
  buildings,
  routes,
  trees,
  bushes,
  rocks,
  lamps,
  boxes,
  fence,
}

writeFileSync(OUT, JSON.stringify(plan))
console.log(`${OUT}: ${trees.length} trees, ${bushes.length} bushes, ${buildings.length} buildings, ${(JSON.stringify(plan).length / 1024).toFixed(1)} KB`)

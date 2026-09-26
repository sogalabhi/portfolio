#!/usr/bin/env node
// Draws the ground tileset (public/world/tiles/terrain.png) and the animated
// water strip (public/world/tiles/water.png) procedurally - see
// terrain-spec.mjs for the layout.
//
// Each overlay tile's shape comes from a signed distance (in px) to its edge:
// one set corner is a quarter disc of radius half a tile around it, three are
// the tile minus that disc around the missing corner, two on a side a straight
// edge across the middle, two diagonal a pair of quarter discs. Every variant
// crosses a tile side exactly at its midpoint, square to it, so neighbouring
// tiles (which share corners) join seamlessly - and the rim and drop shadow,
// measured off the same distance, line up across the seam too.
//
// Usage: node scripts/world/build-terrain.mjs   (or npm run world:terrain)

import { PALETTE_HEX, EXTRA_HEX as C } from '../assets/palette.mjs'
import { createRgba, blendPixel, hexToRgba, hash2, rgbaToPng } from '../assets/pixel.mjs'
import {
  TILE, COLUMNS, ROWS, LEVEL, FULL, edgeTile, FULL_VARIANTS, WATER_TILE, BLOCK_TILE,
  WATER_FRAME, WATER_FRAMES,
} from './terrain-spec.mjs'

const LEAF = PALETTE_HEX[4] // #5FA65A

const CORNERS = [
  { bit: 1, x: 0, y: 0 },
  { bit: 2, x: 1, y: 0 },
  { bit: 4, x: 0, y: 1 },
  { bit: 8, x: 1, y: 1 },
]

// signed distance from (u, v) - tile units - to the edge, in px; > 0 inside
function edgeDistance(mask, u, v) {
  const set = CORNERS.filter((c) => mask & c.bit)
  const dist = (c) => Math.hypot(u - c.x, v - c.y)
  let d
  if (set.length === 0) d = -1
  else if (set.length === 4) d = 1
  else if (set.length === 1) d = 0.5 - dist(set[0])
  else if (set.length === 3) d = dist(CORNERS.find((c) => !(mask & c.bit))) - 0.5
  else {
    const [a, b] = set
    if (a.y === b.y) d = a.y === 0 ? 0.5 - v : v - 0.5
    else if (a.x === b.x) d = a.x === 0 ? 0.5 - u : u - 0.5
    else d = Math.max(0.5 - dist(a), 0.5 - dist(b))
  }
  return d * TILE
}

// Per overlay: the inside texture, a rim just inside the edge (px), and bands
// drawn just outside it over whatever lies below ([px out, colour, alpha]) -
// foam for sand meeting water, a ledge shadow where grass steps down to sand.
const STYLES = {
  [LEVEL.sand]: {
    fill(x, y, seed) {
      const r = hash2(x, y, seed)
      if (r < 0.07) return C.sandSpeck
      if (r > 0.955) return C.sandLight
      return C.sand
    },
    rim: [1.5, C.sandWet],
    outside: [
      [1, C.foam, 0.95],
      [2.5, C.waterLight, 0.6],
    ],
  },
  [LEVEL.grass]: {
    fill(x, y, seed) {
      // two-pixel-tall tufts: a dark blade and the one above it
      const tuft = (tx, ty) => hash2(tx, ty, seed) < 0.045
      if (tuft(x, y) || (tuft(x, y + 1) && hash2(x, y + 1, seed + 7) < 0.6)) return C.grassDark
      if (hash2(x, y, seed + 3) < 0.03) return C.grassLight
      return LEAF
    },
    rim: [1, C.grassRim],
    outside: [[1, C.sandShadow, 0.5]],
  },
  [LEVEL.path]: {
    fill(x, y, seed) {
      const r = hash2(x, y, seed)
      if (r < 0.1) return C.dirtSpeck
      if (hash2(x, y, seed + 5) < 0.03) return C.dirtPebble
      if (r > 0.96) return C.dirtLight
      return C.dirt
    },
    rim: [1, C.dirtRim],
    outside: [[1, C.grassDark, 0.55]],
  },
  [LEVEL.stone]: {
    // 8px flagstones in running bond - an 8px period tiles seamlessly at 16
    fill(x, y, seed) {
      const row = Math.floor(y / 8)
      const lx = (x + (row % 2 ? 4 : 0)) % 8
      const ly = y % 8
      if (lx === 7 || ly === 7) return C.stoneMortar
      if (lx === 0 || ly === 0) return C.stoneLight
      if (hash2(x, y, seed) < 0.05) return C.stoneMortar
      return C.stone
    },
    rim: [1, C.stoneMortar],
    outside: [[1, C.stoneShadow, 0.3]],
  },
}

function drawTile(img, index, level, mask, seed) {
  const style = STYLES[level]
  const ox = (index % COLUMNS) * TILE
  const oy = Math.floor(index / COLUMNS) * TILE
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const d = edgeDistance(mask, (x + 0.5) / TILE, (y + 0.5) / TILE)
      if (d > 0) {
        const [rimPx, rimColour] = style.rim
        blendPixel(img, ox + x, oy + y, hexToRgba(d <= rimPx ? rimColour : style.fill(x, y, seed)))
      } else {
        const band = style.outside.find(([px]) => -d < px)
        if (band) blendPixel(img, ox + x, oy + y, hexToRgba(band[1], band[2]))
      }
    }
  }
}

// seamless 32px water: a base with short ripple dashes that slide one way and
// grow/shrink out of phase across the frames
function drawWater(img, frame, ox, oy) {
  const size = WATER_FRAME
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) blendPixel(img, ox + x, oy + y, hexToRgba(C.water))
  for (let i = 0; i < 14; i++) {
    const x0 = Math.floor(hash2(i, 1, 91) * size)
    const y0 = Math.floor(hash2(i, 2, 91) * size)
    const len = 2 + Math.floor(hash2(i, 3, 91) * 4)
    const light = hash2(i, 4, 91) < 0.6
    const phase = (i + frame) % WATER_FRAMES
    const drawn = phase === 2 ? len - 2 : phase === 1 ? len - 1 : len
    for (let k = 0; k < drawn; k++) {
      const x = (x0 + k + frame) % size
      blendPixel(img, ox + x, oy + y0, hexToRgba(light ? C.waterLight : C.waterDeep))
    }
  }
}

const tiles = createRgba(COLUMNS * TILE, ROWS * TILE)
for (const level of [LEVEL.sand, LEVEL.grass, LEVEL.path, LEVEL.stone]) {
  for (let mask = 1; mask <= FULL; mask++) drawTile(tiles, edgeTile(level, mask), level, mask, level * 100)
  FULL_VARIANTS[level].forEach((index, k) => drawTile(tiles, index, level, FULL, level * 100 + k))
}
// water preview tile for Tiled (top-left of frame 0), and the collision marker
const water = createRgba(WATER_FRAME * WATER_FRAMES, WATER_FRAME)
for (let f = 0; f < WATER_FRAMES; f++) drawWater(water, f, f * WATER_FRAME, 0)
for (let y = 0; y < TILE; y++) {
  for (let x = 0; x < TILE; x++) {
    const i = (y * water.width + x) * 4
    blendPixel(tiles, (WATER_TILE % COLUMNS) * TILE + x, Math.floor(WATER_TILE / COLUMNS) * TILE + y, [...water.data.subarray(i, i + 4)])
    const onX = x === y || x === TILE - 1 - y || x === 0 || y === 0 || x === TILE - 1 || y === TILE - 1
    if (onX) blendPixel(tiles, (BLOCK_TILE % COLUMNS) * TILE + x, Math.floor(BLOCK_TILE / COLUMNS) * TILE + y, hexToRgba('#E86A6A', 0.8))
  }
}

await rgbaToPng(tiles, 'public/world/tiles/terrain.png')
await rgbaToPng(water, 'public/world/tiles/water.png')
console.log(`terrain.png ${tiles.width}x${tiles.height}, water.png ${water.width}x${water.height}`)

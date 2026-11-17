#!/usr/bin/env node
// Renders the whole island to one image, public/world/island.webp - the
// homepage shows it under the site plan, so `/` previews the real world
// without loading Phaser. It draws what WorldScene draws, in the same order:
// water, the ground overlays, flat props, shadows, then everything standing
// sorted by its base. Run after the map and the sprites it reads are built.
//
// Usage: node scripts/world/build-preview.mjs   (or npm run world:preview)

import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { createRgba, blendPixel } from '../assets/pixel.mjs'
import { ZONES } from '../../src/world/data/zones.js'
import { GROUND_PROPS } from './layout.mjs'
import { OVERLAYS, WATER_FRAME } from './terrain-spec.mjs'

const OUT = 'public/world/island.webp'

// kept in step with WorldScene.js (which can't be imported here - it pulls in Phaser)
const NO_SHADOW = new Set(['soil_bed', 'flowers_blue', 'flowers_red', 'flowers_white', 'fence_segment', 'fence_post'])
const SHADOW_RGBA = [43, 36, 56, 64]

async function loadRgba(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { width: info.width, height: info.height, data }
}

function blit(dst, src, dx, dy, sx = 0, sy = 0, w = src.width, h = src.height) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = ((sy + y) * src.width + sx + x) * 4
      blendPixel(dst, dx + x, dy + y, src.data.subarray(i, i + 4))
    }
  }
}

// the drawn box inside a sprite's frame - what the atlas packer trims to
function trimBox({ width, height, data }) {
  let left = width
  let right = -1
  let top = height
  let bottom = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!data[(y * width + x) * 4 + 3]) continue
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    }
  }
  return { left, top, right: right + 1, bottom: bottom + 1 }
}

const map = JSON.parse(readFileSync('public/world/map/island.json', 'utf8'))
const TILE = map.tilewidth
const W = map.width * TILE
const H = map.height * TILE
const layer = (name) => map.layers.find((l) => l.name === name)
const out = createRgba(W, H)

// --- ground ------------------------------------------------------------------------
const water = await loadRgba('public/world/tiles/water.png')
for (let y = 0; y < H; y += WATER_FRAME) {
  for (let x = 0; x < W; x += WATER_FRAME) blit(out, water, x, y, 0, 0, WATER_FRAME, WATER_FRAME)
}
const terrain = await loadRgba('public/world/tiles/terrain.png')
const { firstgid, columns } = map.tilesets[0]
for (const name of OVERLAYS) {
  layer(name).data.forEach((gid, i) => {
    if (!gid) return
    const index = gid - firstgid
    blit(out, terrain, (i % map.width) * TILE, Math.floor(i / map.width) * TILE,
      (index % columns) * TILE, Math.floor(index / columns) * TILE, TILE, TILE)
  })
}

// --- everything placed on it -------------------------------------------------------
const sprites = new Map()
async function sprite(frame) {
  if (!sprites.has(frame)) {
    const image = await loadRgba(`public/world/sprites/${frame}.png`)
    sprites.set(frame, { image, trim: trimBox(image) })
  }
  return sprites.get(frame)
}

const frameByZone = Object.fromEntries(ZONES.map((z) => [z.id, z.frame]))
const placed = [
  ...layer('zones').objects.map((o) => ({ frame: frameByZone[o.name], x: o.x, y: o.y, building: true })),
  ...layer('props').objects.map((o) => ({ frame: o.name, x: o.x, y: o.y })),
  ...layer('scatter').objects.map((o) => ({ frame: o.name, x: o.x, y: o.y })),
]
for (const item of placed) {
  const { image, trim } = await sprite(item.frame)
  // bottom-anchored at the map point, like the game
  item.left = Math.round(item.x - image.width / 2)
  item.top = item.y - image.height
  item.art = {
    left: item.left + trim.left,
    right: item.left + trim.right,
    bottom: item.top + trim.bottom,
  }
  item.flat = GROUND_PROPS.includes(item.frame)
}

function shadow({ art, building }) {
  const width = Math.max(6, Math.round((art.right - art.left) * (building ? 0.95 : 0.8)))
  const height = Math.max(3, Math.min(building ? 12 : 8, Math.round(width * 0.3)))
  const ox = Math.round((art.left + art.right) / 2 - width / 2)
  const oy = Math.round(art.bottom - 1 - height / 2)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = (x + 0.5 - width / 2) / (width / 2)
      const ny = (y + 0.5 - height / 2) / (height / 2)
      if (nx * nx + ny * ny <= 1) blendPixel(out, ox + x, oy + y, SHADOW_RGBA)
    }
  }
}

const draw = async (item) => blit(out, (await sprite(item.frame)).image, item.left, item.top)
for (const item of placed.filter((p) => p.flat)) await draw(item)
for (const item of placed.filter((p) => !p.flat && !NO_SHADOW.has(p.frame))) shadow(item)
const standing = placed.filter((p) => !p.flat).sort((a, b) => a.art.bottom - b.art.bottom)
for (const item of standing) await draw(item)

// lossless, so it stays pixel-exact; about half the size of the same PNG
await sharp(Buffer.from(out.data.buffer), { raw: { width: W, height: H, channels: 4 } })
  .webp({ lossless: true, effort: 6 })
  .toFile(OUT)
console.log(`${OUT}: ${W}x${H}, ${placed.length} sprites`)

#!/usr/bin/env node
// Step 1 of the pixel-art pipeline: every module in assets/pixel/ exports a
// list of { name, palette, frames: [grid, ...] }. Each becomes
// assets/svg/<name>.svg (frames side by side as a strip). Step 2,
// svg-to-png.mjs, rasterizes those into public/world/sprites/.
//
// Usage: node scripts/assets/build-pixel.mjs   (or npm run assets:pixel)

import { readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { gridToRgba, hstack, rgbaToSvg } from './pixel.mjs'

const SRC_DIR = 'assets/pixel'
const SVG_DIR = 'assets/svg'

mkdirSync(SVG_DIR, { recursive: true })
for (const file of readdirSync(SRC_DIR).filter((f) => f.endsWith('.mjs')).sort()) {
  const { default: sprites } = await import(pathToFileURL(path.resolve(SRC_DIR, file)))
  for (const { name, palette, frames } of sprites) {
    const img = hstack(frames.map((grid) => gridToRgba(grid, palette)))
    writeFileSync(path.join(SVG_DIR, `${name}.svg`), rgbaToSvg(img))
    console.log(`${file}: ${name} ${img.width}x${img.height} (${frames.length} frame${frames.length > 1 ? 's' : ''})`)
  }
}

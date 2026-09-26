#!/usr/bin/env node
// Step 2 of the pixel-art pipeline: assets/svg/*.svg -> public/world/sprites/*.png
// at 1x. Works for SVGs from build-pixel.mjs and hand-written ones alike, as
// long as they're drawn on whole-pixel coordinates with
// shape-rendering="crispEdges". Fails loudly if the output has any
// half-transparent pixel the source didn't ask for - the sign of an
// off-grid shape that sharp antialiased.
//
// Usage: node scripts/assets/svg-to-png.mjs   (or npm run assets:svg)

import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { svgToPng } from './pixel.mjs'

const SVG_DIR = 'assets/svg'
const OUT_DIR = 'public/world/sprites'

let failed = false
for (const file of readdirSync(SVG_DIR).filter((f) => f.endsWith('.svg')).sort()) {
  const svg = readFileSync(path.join(SVG_DIR, file), 'utf8')
  const out = path.join(OUT_DIR, file.replace(/\.svg$/, '.png'))
  await svgToPng(svg, out)

  const allowsPartialAlpha = svg.includes('fill-opacity')
  const { data, info } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let partial = 0
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0 && data[i] < 255) partial++
  if (partial && !allowsPartialAlpha) {
    console.error(`${file}: ${partial} antialiased pixels - is something off the pixel grid?`)
    failed = true
  } else {
    console.log(`${file} -> ${out} (${info.width}x${info.height})`)
  }
}
if (failed) process.exit(1)

#!/usr/bin/env node
// Downscales every named sprite in assets/cut/*-named/ to its target size
// (scripts/assets/sizes.mjs) and writes to public/world/sprites/.
//
// Usage: node scripts/assets/batch-downscale.mjs

import sharp from 'sharp'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { nearestPaletteColor } from './palette.mjs'
import { TARGET_SIZES } from './sizes.mjs'

const CUT_DIRS = ['buildings-named', 'props-named', 'scatter-named']
const OUT_DIR = 'public/world/sprites'

async function downscaleOne(input, output, width, height) {
  const resized = await sharp(input)
    .resize(width, height, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { data, info } = resized
  const { channels } = info
  for (let i = 0; i < info.width * info.height; i++) {
    const o = i * channels
    if (data[o + 3] === 0) continue
    const [r, g, b] = nearestPaletteColor(data[o], data[o + 1], data[o + 2])
    data[o] = r
    data[o + 1] = g
    data[o + 2] = b
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels } })
    .png()
    .toFile(output)
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const missing = []
  let count = 0

  for (const dir of CUT_DIRS) {
    const cutPath = path.join('assets/cut', dir)
    if (!existsSync(cutPath)) continue

    for (const file of readdirSync(cutPath)) {
      if (!file.endsWith('.png')) continue
      const name = file.replace(/\.png$/, '')
      const size = TARGET_SIZES[name]
      if (!size) {
        missing.push(name)
        continue
      }
      const [w, h] = size
      const input = path.join(cutPath, file)
      const output = path.join(OUT_DIR, file)
      await downscaleOne(input, output, w, h)
      console.log(`${name} -> ${w}x${h}`)
      count++
    }
  }

  console.log(`\n${count} sprites written to ${OUT_DIR}`)
  if (missing.length) {
    console.log(`no target size found for: ${missing.join(', ')}`)
  }
}

main()

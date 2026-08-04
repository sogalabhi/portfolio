#!/usr/bin/env node
// Node/sharp reimplementation of the guide's process.sh (magenta key-out +
// despill + palette snap) - no ImageMagick dependency.
//
// Usage: node scripts/assets/process.mjs <input.png> <output.png>

import sharp from 'sharp'
import { nearestPaletteColor } from './palette.mjs'

const FUZZ = 55

// Gemini's "solid magenta background" isn't pixel-perfect #FF00FF - it comes
// out as a slightly muted, grainy magenta (observed ~(235,10,233) ± ~26 per
// channel). Keying against pure (255,0,255) with a modest fuzz leaves a
// speckled halo of un-keyed background pixels. Instead, measure the actual
// background color from the sheet's own corners and key against that.
async function measureBackground(data, width, height, channels) {
  const patches = [
    [0, 0],
    [width - 6, 0],
    [0, height - 6],
    [width - 6, height - 6],
  ]
  let sr = 0
  let sg = 0
  let sb = 0
  let n = 0
  for (const [px, py] of patches) {
    for (let y = py; y < py + 5; y++) {
      for (let x = px; x < px + 5; x++) {
        const o = (y * width + x) * channels
        sr += data[o]
        sg += data[o + 1]
        sb += data[o + 2]
        n++
      }
    }
  }
  return [sr / n, sg / n, sb / n]
}

async function main() {
  const [, , input, output] = process.argv
  if (!input || !output) {
    console.error('Usage: node process.mjs <input.png> <output.png>')
    process.exit(1)
  }

  const image = sharp(input).ensureAlpha()
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  const [bgR, bgG, bgB] = await measureBackground(data, width, height, channels)
  console.log(`  measured background: rgb(${bgR.toFixed(0)}, ${bgG.toFixed(0)}, ${bgB.toFixed(0)})`)

  const isBackground = (r, g, b) => {
    const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2)
    return dist < FUZZ
  }

  // pass 1: key out background -> transparent
  const alphaMask = new Uint8Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const o = i * channels
    const bg = isBackground(data[o], data[o + 1], data[o + 2])
    alphaMask[i] = bg ? 0 : 255
    if (bg) data[o + 3] = 0
  }

  // pass 2: despill - erode alpha by 1px so any background-tinted fringe pixels
  // bordering the keyed-out region also become transparent
  const eroded = new Uint8Array(alphaMask)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (alphaMask[idx] === 0) continue
      const neighborsTransparent =
        (x > 0 && alphaMask[idx - 1] === 0) ||
        (x < width - 1 && alphaMask[idx + 1] === 0) ||
        (y > 0 && alphaMask[idx - width] === 0) ||
        (y < height - 1 && alphaMask[idx + width] === 0)
      if (neighborsTransparent) eroded[idx] = 0
    }
  }
  for (let i = 0; i < width * height; i++) {
    if (eroded[i] === 0) data[i * channels + 3] = 0
  }

  // pass 3: snap every remaining opaque pixel to the nearest locked-palette color
  for (let i = 0; i < width * height; i++) {
    const o = i * channels
    if (data[o + 3] === 0) continue
    const [r, g, b] = nearestPaletteColor(data[o], data[o + 1], data[o + 2])
    data[o] = r
    data[o + 1] = g
    data[o + 2] = b
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(output)
  console.log(`done -> ${output}`)
}

main()

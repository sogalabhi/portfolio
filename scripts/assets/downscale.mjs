#!/usr/bin/env node
// Resize a sliced sprite to its target in-game size, then re-snap to the
// locked palette (resizing interpolation reintroduces off-palette colors).
//
// Usage: node scripts/assets/downscale.mjs <input.png> <output.png> <width> <height>

import sharp from 'sharp'
import { nearestPaletteColor } from './palette.mjs'

async function main() {
  const [, , input, output, wArg, hArg] = process.argv
  const width = Number(wArg)
  const height = Number(hArg)
  if (!input || !output || !width || !height) {
    console.error('Usage: node downscale.mjs <input.png> <output.png> <width> <height>')
    process.exit(1)
  }

  // 'contain' preserves the source aspect ratio and pads with transparency to
  // hit the exact target canvas — 'fill' would stretch/squash (a 333x292 crop
  // into a 96x80 box has a visibly different aspect ratio), which is wrong for
  // objects the atlas depends on being an undistorted, exact-size frame.
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
  console.log(`done -> ${output} (${width}x${height})`)
}

main()

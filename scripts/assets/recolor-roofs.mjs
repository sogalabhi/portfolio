#!/usr/bin/env node
// Gives each building its own roof colour. Every building came out of the
// generator with the same terracotta roof, which made the island read as
// one repeated house. The roofs use exactly three palette shades
// (#C4552E mid, #A54322 shade, #7A2F18 dark) and nothing else on these five
// sprites does, so it's a straight swap - no masks. Idempotent: once swapped
// there's no terracotta left to match. Re-run after batch-downscale.mjs,
// which regenerates the sprites with the original roofs.
//
// Usage: node scripts/assets/recolor-roofs.mjs

import sharp from 'sharp'
import { EXTRA_HEX } from './palette.mjs'

const SPRITES_DIR = 'public/world/sprites'
const TERRACOTTA = ['#C4552E', '#A54322', '#7A2F18']

// the workshop keeps terracotta - it's the one the site's accent is based on
const ROOFS = {
  tower: [EXTRA_HEX.roofSlate, EXTRA_HEX.roofSlateShade, EXTRA_HEX.roofSlateDark],
  shrine: [EXTRA_HEX.roofTeal, EXTRA_HEX.roofTealShade, EXTRA_HEX.roofTealDark],
  archive: [EXTRA_HEX.roofMoss, EXTRA_HEX.roofMossShade, EXTRA_HEX.roofMossDark],
  shed: [EXTRA_HEX.roofStraw, EXTRA_HEX.roofStrawShade, EXTRA_HEX.roofStrawDark],
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

for (const [name, ramp] of Object.entries(ROOFS)) {
  const file = `${SPRITES_DIR}/${name}.png`
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const swaps = TERRACOTTA.map((from, i) => [rgb(from), rgb(ramp[i])])
  let changed = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    for (const [[fr, fg, fb], to] of swaps) {
      if (data[i] === fr && data[i + 1] === fg && data[i + 2] === fb) {
        data.set(to, i)
        changed++
        break
      }
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(file)
  console.log(`${name}: ${changed} roof pixels recoloured`)
}

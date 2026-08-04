#!/usr/bin/env node
// Composites every sliced object (in manifest/reading order) into one grid
// with its index number stamped on top - a 10-second visual check that catches
// ordering bugs dimension tables hide.
//
// Usage: node scripts/assets/contact-sheet.mjs <cutdir> <output.png>

import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const CELL_PAD = 16
const LABEL_H = 28

async function main() {
  const [, , cutdir, output] = process.argv
  if (!cutdir || !output) {
    console.error('Usage: node contact-sheet.mjs <cutdir> <output.png>')
    process.exit(1)
  }

  const manifest = JSON.parse(readFileSync(path.join(cutdir, 'manifest.json'), 'utf8'))
  const cols = Math.min(5, manifest.length)
  const rows = Math.ceil(manifest.length / cols)

  const maxW = Math.max(...manifest.map((m) => m.w))
  const maxH = Math.max(...manifest.map((m) => m.h))
  const cellW = maxW + CELL_PAD * 2
  const cellH = maxH + CELL_PAD * 2 + LABEL_H

  const canvasW = cellW * cols
  const canvasH = cellH * rows

  const composites = []
  for (let i = 0; i < manifest.length; i++) {
    const m = manifest[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    const cellX = col * cellW
    const cellY = row * cellH

    // center each sprite within its cell
    const left = cellX + CELL_PAD + Math.round((maxW - m.w) / 2)
    const top = cellY + LABEL_H + CELL_PAD + Math.round((maxH - m.h) / 2)

    composites.push({
      input: path.join(cutdir, m.file),
      left,
      top,
    })

    const label = `<svg width="${cellW}" height="${LABEL_H}">
      <rect width="100%" height="100%" fill="#2B2438"/>
      <text x="6" y="20" font-family="monospace" font-size="18" fill="#F2A65A">${i} · ${m.w}x${m.h}</text>
    </svg>`
    composites.push({
      input: Buffer.from(label),
      left: cellX,
      top: cellY,
    })
  }

  await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: '#1C1B19',
    },
  })
    .composite(composites)
    .png()
    .toFile(output)

  console.log(`done -> ${output} (${manifest.length} objects, ${cols}x${rows} grid)`)
}

main()

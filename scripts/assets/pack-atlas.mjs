#!/usr/bin/env node
// Packs public/world/sprites/*.png into public/world/atlas/{atlas.png,atlas.json}
// using free-tex-packer-core directly (the CLI's .ftpp project format isn't
// documented, and this is the same underlying packer).
//
// Usage: node scripts/assets/pack-atlas.mjs

import { packAsync } from 'free-tex-packer-core'
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const SPRITES_DIR = 'public/world/sprites'
const OUT_DIR = 'public/world/atlas'

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const files = readdirSync(SPRITES_DIR).filter((f) => f.endsWith('.png'))
  const images = files.map((file) => ({
    path: file,
    contents: readFileSync(path.join(SPRITES_DIR, file)),
  }))

  const options = {
    textureName: 'atlas',
    exporter: 'Phaser3',
    removeFileExtension: true,
    prependFolderName: false,
    padding: 2,
    allowRotation: false,
    allowTrim: true,
    detectIdentical: false,
  }

  const result = await packAsync(images, options)

  for (const item of result) {
    writeFileSync(path.join(OUT_DIR, item.name), item.buffer)
    console.log(`wrote ${item.name} (${(item.buffer.length / 1024).toFixed(1)} KB)`)
  }
}

main()

#!/usr/bin/env node
// Node/sharp reimplementation of the guide's slice.py (connected-component
// bounding-box slicer) — no scipy/numpy dependency.
//
// Usage: node scripts/assets/slice.mjs <sheet.png> <outdir>

import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const MIN_SIZE = 24 // ignore specks smaller than this, matches the guide's threshold
const ALPHA_THRESHOLD = 8

async function main() {
  const [, , input, outdir] = process.argv
  if (!input || !outdir) {
    console.error('Usage: node slice.mjs <sheet.png> <outdir>')
    process.exit(1)
  }
  mkdirSync(outdir, { recursive: true })

  const image = sharp(input).ensureAlpha()
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  const opaque = new Uint8Array(width * height)
  for (let i = 0; i < width * height; i++) {
    opaque[i] = data[i * channels + 3] > ALPHA_THRESHOLD ? 1 : 0
  }

  const visited = new Uint8Array(width * height)
  const boxes = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const start = y * width + x
      if (!opaque[start] || visited[start]) continue

      // BFS flood fill to find this connected component's bounding box
      let minX = x
      let maxX = x
      let minY = y
      let maxY = y
      const queue = [start]
      visited[start] = 1

      while (queue.length) {
        const idx = queue.pop()
        const cx = idx % width
        const cy = Math.floor(idx / width)
        if (cx < minX) minX = cx
        if (cx > maxX) maxX = cx
        if (cy < minY) minY = cy
        if (cy > maxY) maxY = cy

        const neighbors = [idx - 1, idx + 1, idx - width, idx + width]
        for (const n of neighbors) {
          if (n < 0 || n >= width * height) continue
          const nx = n % width
          // guard against wrap-around on row edges for left/right neighbors
          if (Math.abs(nx - cx) > 1) continue
          if (opaque[n] && !visited[n]) {
            visited[n] = 1
            queue.push(n)
          }
        }
      }

      const w = maxX - minX + 1
      const h = maxY - minY + 1
      if (w >= MIN_SIZE && h >= MIN_SIZE) {
        boxes.push({ x: minX, y: minY, w, h })
      }
    }
  }

  const orderedBoxes = clusterIntoRows(boxes)

  const manifest = []
  for (let i = 0; i < orderedBoxes.length; i++) {
    const b = orderedBoxes[i]
    const name = `obj_${String(i).padStart(2, '0')}.png`
    await sharp(input)
      .ensureAlpha()
      .extract({ left: b.x, top: b.y, width: b.w, height: b.h })
      .toFile(path.join(outdir, name))
    manifest.push({ file: name, w: b.w, h: b.h })
    console.log(name, `${b.w}x${b.h}`)
  }

  writeFileSync(path.join(outdir, 'manifest.json'), JSON.stringify(manifest, null, 2))
}

// Groups boxes into reading-order rows by vertical-span overlap rather than a
// fixed pixel bucket on the top edge — a fixed bucket breaks the moment two
// objects in the same visual row have different heights (a tall tower next to
// a short workshop, or four plant-growth stages of increasing size), because
// their top edges land in different buckets even though they clearly belong
// to the same row. Two boxes are considered the same row if their y-spans
// overlap by more than 50% of the shorter box's height.
function clusterIntoRows(boxes) {
  const n = boxes.length
  const parent = Array.from({ length: n }, (_, i) => i)
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]]
      i = parent[i]
    }
    return i
  }
  const union = (i, j) => {
    const ri = find(i)
    const rj = find(j)
    if (ri !== rj) parent[ri] = rj
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = boxes[i]
      const b = boxes[j]
      const overlap = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
      const shorter = Math.min(a.h, b.h)
      if (overlap / shorter > 0.5) union(i, j)
    }
  }

  const groups = new Map()
  for (let i = 0; i < n; i++) {
    const root = find(i)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root).push(boxes[i])
  }

  const rows = [...groups.values()]
  rows.forEach((row) => row.sort((a, b) => a.x - b.x))
  rows.sort((a, b) => Math.min(...a.map((box) => box.y)) - Math.min(...b.map((box) => box.y)))

  return rows.flat()
}

main()

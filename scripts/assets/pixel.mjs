// Shared helpers for art authored in code: text grids -> RGBA -> SVG -> PNG.
//
// A grid is an array of equal-length strings, one character per pixel; each
// character is looked up in a palette map ('.' is always transparent). Every
// pixel becomes an SVG <rect> (horizontal runs merged) with
// shape-rendering="crispEdges", which sharp rasterizes back at 1x with no
// antialiasing - so the PNG is exactly the grid.

import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

export function hexToRgba(hex, alpha = 1) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, Math.round(alpha * 255)]
}

export function createRgba(width, height) {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) }
}

// source-over blend of one colour onto a pixel
export function blendPixel(img, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height || a === 0) return
  const i = (y * img.width + x) * 4
  const d = img.data
  const sa = a / 255
  const da = d[i + 3] / 255
  const oa = sa + da * (1 - sa)
  d[i] = Math.round((r * sa + d[i] * da * (1 - sa)) / oa)
  d[i + 1] = Math.round((g * sa + d[i + 1] * da * (1 - sa)) / oa)
  d[i + 2] = Math.round((b * sa + d[i + 2] * da * (1 - sa)) / oa)
  d[i + 3] = Math.round(oa * 255)
}

export function gridToRgba(grid, palette) {
  const height = grid.length
  const width = grid[0].length
  grid.forEach((row, y) => {
    if (row.length !== width) throw new Error(`row ${y} is ${row.length} wide, expected ${width}`)
  })
  const img = createRgba(width, height)
  grid.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return
      const hex = palette[ch]
      if (!hex) throw new Error(`no palette entry for '${ch}' (row ${y}, col ${x})`)
      blendPixel(img, x, y, hexToRgba(hex))
    })
  })
  return img
}

// frames side by side, for a spritesheet strip
export function hstack(frames) {
  const height = Math.max(...frames.map((f) => f.height))
  const width = frames.reduce((w, f) => w + f.width, 0)
  const out = createRgba(width, height)
  let ox = 0
  for (const f of frames) {
    for (let y = 0; y < f.height; y++) {
      for (let x = 0; x < f.width; x++) {
        const s = (y * f.width + x) * 4
        const d = (y * width + ox + x) * 4
        out.data.set(f.data.subarray(s, s + 4), d)
      }
    }
    ox += f.width
  }
  return out
}

function rgbaKey(d, i) {
  return `${d[i]},${d[i + 1]},${d[i + 2]},${d[i + 3]}`
}

export function rgbaToSvg(img) {
  const { width, height, data } = img
  const rects = []
  for (let y = 0; y < height; y++) {
    let x = 0
    while (x < width) {
      const i = (y * width + x) * 4
      if (data[i + 3] === 0) {
        x++
        continue
      }
      const key = rgbaKey(data, i)
      let run = 1
      while (x + run < width && rgbaKey(data, (y * width + x + run) * 4) === key) run++
      const hex = '#' + [data[i], data[i + 1], data[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')
      const opacity = data[i + 3] === 255 ? '' : ` fill-opacity="${(data[i + 3] / 255).toFixed(3)}"`
      rects.push(`<rect x="${x}" y="${y}" width="${run}" height="1" fill="${hex}"${opacity}/>`)
      x += run
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">\n${rects.join('\n')}\n</svg>\n`
  )
}

export async function svgToPng(svg, outPath) {
  mkdirSync(path.dirname(outPath), { recursive: true })
  await sharp(Buffer.from(svg)).png().toFile(outPath)
}

export async function rgbaToPng(img, outPath) {
  mkdirSync(path.dirname(outPath), { recursive: true })
  await sharp(Buffer.from(img.data.buffer), {
    raw: { width: img.width, height: img.height, channels: 4 },
  })
    .png()
    .toFile(outPath)
}

// deterministic per-pixel pseudo-random in [0, 1)
export function hash2(x, y, seed = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

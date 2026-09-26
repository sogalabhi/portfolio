// The locked palette from the asset generation guide - single source of truth.
// Paste PALETTE_PROMPT_BLOCK verbatim into every Gemini prompt so separate
// generations still read as one set.

export const PALETTE_HEX = [
  '#C4552E', // terracotta
  '#A54322', // dark terracotta
  '#7A2F18', // deep rust
  '#4A7C4E', // moss green
  '#5FA65A', // leaf green
  '#3E7A44', // dark green
  '#E8DCC4', // warm sand
  '#C9B894', // dark sand
  '#FAF7F0', // cream
  '#2B2438', // deep plum
  '#F2A65A', // amber
  '#E86A6A', // coral
  '#87C5C2', // pale teal
]

export const PALETTE_PROMPT_BLOCK = `Strict palette, use only these colors:
terracotta #C4552E, dark terracotta #A54322, deep rust #7A2F18,
moss green #4A7C4E, leaf green #5FA65A, dark green #3E7A44,
warm sand #E8DCC4, dark sand #C9B894, cream #FAF7F0,
deep plum #2B2438, amber #F2A65A, coral #E86A6A,
pale teal #87C5C2`

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export const PALETTE_RGB = PALETTE_HEX.map(hexToRgb)

// --- Lab-space matching -----------------------------------------------------
// RGB Euclidean distance mismatches desaturated mid-tone grey/beige shading
// (observed on the rock props: shadow tones landed on terracotta instead of
// sand because in raw RGB space a grey-beige shadow can be roughly equidistant
// from a warm red and a warm tan). Lab space separates lightness from chroma,
// which matches perceived similarity far better for exactly this case.

function srgbToLinear(c) {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

function rgbToXyz(r, g, b) {
  const rl = srgbToLinear(r)
  const gl = srgbToLinear(g)
  const bl = srgbToLinear(b)
  return [
    rl * 0.4124 + gl * 0.3576 + bl * 0.1805,
    rl * 0.2126 + gl * 0.7152 + bl * 0.0722,
    rl * 0.0193 + gl * 0.1192 + bl * 0.9505,
  ]
}

const D65 = [0.95047, 1.0, 1.08883]

function fLab(t) {
  return t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27) * t + 16 / 116
}

export function rgbToLab(r, g, b) {
  const [x, y, z] = rgbToXyz(r, g, b)
  const fx = fLab(x / D65[0])
  const fy = fLab(y / D65[1])
  const fz = fLab(z / D65[2])
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

export const PALETTE_LAB = PALETTE_RGB.map(([r, g, b]) => rgbToLab(r, g, b))

export function nearestPaletteColor(r, g, b) {
  const [L, A, B] = rgbToLab(r, g, b)
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < PALETTE_LAB.length; i++) {
    const [pL, pA, pB] = PALETTE_LAB[i]
    const dist = (L - pL) ** 2 + (A - pA) ** 2 + (B - pB) ** 2
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  }
  return PALETTE_RGB[best]
}

// --- Extended colours ---------------------------------------------------------
// Not for Gemini prompts (PALETTE_HEX above stays the locked generation palette
// and nearestPaletteColor keeps snapping to it). These are for art authored in
// code - terrain, water, redrawn scatter, per-building roofs - where the locked
// 13 have no ramp for the job (no blues for water, no dirt, no stone).
export const EXTRA_HEX = {
  // water, deep to foam
  waterDeep: '#4F96A2',
  water: '#5EA9B3',
  waterLight: '#86C6C6',
  foam: '#F4EDE2',
  // beach sand
  sand: '#ECD6A4',
  sandSpeck: '#D9C08C',
  sandLight: '#F6E6C0',
  sandWet: '#D2BC8A',
  sandShadow: '#BFA46E',
  // grass (leaf green #5FA65A is the base)
  grassDark: '#4E9150',
  grassLight: '#76B86A',
  grassRim: '#3E7A44',
  // dirt path
  dirt: '#D2B07C',
  dirtSpeck: '#BE9A66',
  dirtPebble: '#A88657',
  dirtLight: '#E0C597',
  dirtRim: '#B8955F',
  // stone plaza
  stone: '#CFC6B4',
  stoneMortar: '#A69C88',
  stoneLight: '#E2DBCB',
  stoneShadow: '#6F6656',
  // rocks
  rockHighlight: '#EDE4D0',
  rockLight: '#D8CCB2',
  rockDark: '#A89A7C',
  rockDeep: '#857960',
  // per-building roof ramps (mid, shade, dark) - see recolor-roofs.mjs
  roofSlate: '#5B6E9C',
  roofSlateShade: '#45557D',
  roofSlateDark: '#323E5E',
  roofTeal: '#3F8C87',
  roofTealShade: '#2F6E6A',
  roofTealDark: '#22504D',
  roofMoss: '#4F8453',
  roofMossShade: '#3E6A42',
  roofMossDark: '#2B4A2E',
  roofStraw: '#D9974A',
  roofStrawShade: '#B37636',
  roofStrawDark: '#7A4E22',
}

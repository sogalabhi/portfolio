// The avatar dressed for site: the same 16x24 walking frames as avatar.mjs,
// with a yellow hard hat over the hair and an orange hi-vis vest, with one
// reflective stripe, over the polo. This is the figure who walks the site plan
// in the homepage hero.
//
// It is made by rewriting avatar.mjs's frames rather than drawing new ones,
// so the walk cycle stays identical: rows 0-4 of the head become the hat,
// and the seven torso rows under the head become the vest.
import avatarSprites from './avatar.mjs'

const avatar = avatarSprites.find((s) => s.name === 'avatar')

const palette = {
  ...avatar.palette,
  Y: '#F2C230', // hard hat
  y: '#FFE48A', // its highlight
  O: '#F2792B', // hi-vis vest
  R: '#E9ECEA', // reflective stripe
}

const HAT_FRONT = [
  '................',
  '.....YYYYYY.....',
  '....YYyyYYYY....',
  '...YYyYYYYYYY...',
  '..YYYYYYYYYYYY..',
]
const HAT_BACK = [
  '................',
  '.....YYYYYY.....',
  '....YYYYYYYY....',
  '...YYYYYYYYYY...',
  '..YYYYYYYYYYYY..',
]
// facing right: the brim reaches forward
const HAT_SIDE = [
  '................',
  '....YYYYYY......',
  '...YYyyYYYY.....',
  '..YYyYYYYYYY....',
  '..YYYYYYYYYYYYY.',
]
const mirror = (rows) => rows.map((row) => [...row].reverse().join(''))

const HEAD_ROWS = 11
const TORSO_ROWS = 7
const STRIPE_ROW = 3 // within the torso

function dress(frame, hat, { opening }) {
  // a stepping frame starts with one blank row: the body bobs down
  const top = frame.findIndex((row) => /[^.]/.test(row))
  return frame.map((row, y) => {
    const i = y - top
    if (i >= 0 && i < hat.length) return hat[i]
    const t = i - HEAD_ROWS
    if (t < 0 || t >= TORSO_ROWS) return row
    return [...row]
      .map((ch, x) => {
        if (ch !== 'P' && ch !== 'p') return ch
        // the vest hangs open down the middle of the front, showing the polo
        if (opening && t > 0 && (x === 7 || x === 8)) return ch
        return t === STRIPE_ROW ? 'R' : 'O'
      })
      .join('')
  })
}

// avatar frames are down, left, right, up: four each
const frames = avatar.frames.map((frame, n) => {
  const dir = Math.floor(n / 4)
  if (dir === 0) return dress(frame, HAT_FRONT, { opening: true })
  if (dir === 1) return dress(frame, mirror(HAT_SIDE), { opening: false })
  if (dir === 2) return dress(frame, HAT_SIDE, { opening: false })
  return dress(frame, HAT_BACK, { opening: false })
})

export default [{ name: 'engineer', palette, frames }]

// The avatar: Abhijith as a 16x24 walking sprite, plus a 32x48 portrait for
// the homepage. Drawn from the reference in docs/IMPROVEMENTS.md 1.4 - short
// tousled black hair, thin moustache, the black IRIS polo (deep plum here, so
// it doesn't merge with the hair) with white-and-blue tipping on the collar
// and sleeve cuffs and one cream pixel for the chest logo.
//
// `avatar` is a strip of 16 frames: down, left, right, up, four frames each
// (stand, step, stand, step). A frame is an upper body (18 rows) over a pair
// of legs; on a step the body drops one row and the legs lose one, which is
// the whole walk bob.
import { PALETTE_HEX, EXTRA_HEX } from '../../scripts/assets/palette.mjs'

const palette = {
  K: EXTRA_HEX.hair,
  k: EXTRA_HEX.hairLight,
  S: EXTRA_HEX.skin,
  s: EXTRA_HEX.skinShadow,
  h: EXTRA_HEX.skinLight,
  P: PALETTE_HEX[9], // deep plum - the polo
  p: EXTRA_HEX.poloLight,
  W: PALETTE_HEX[8], // cream - collar and cuff tipping, the logo
  B: EXTRA_HEX.collarBlue,
  J: EXTRA_HEX.denim,
  j: EXTRA_HEX.denimShadow,
  F: PALETTE_HEX[6], // warm sand - sneakers
  f: EXTRA_HEX.sole,
  M: '#3A281F', // the moustache, a shade off the hair so it doesn't read as a mouth
  r: '#9C5B3F', // lips
  w: '#FFFFFF', // eye whites, portrait only
}

const BLANK = '................'
const mirror = (grid) => grid.map((row) => [...row].reverse().join(''))

// --- facing down -----------------------------------------------------------------
const FRONT = [
  '......K..K......',
  '....KKKKKKKK....',
  '...KKKKKKKKKK...',
  '..KKKkkKKKKKKK..',
  '..KKKKKKKKKkKK..',
  '..KKKSSKKKSSKK..',
  '..KSSKSSSSKSSK..',
  '..SSSKSSSSKSSS..',
  '..SShSSSSSShSS..',
  '...SSSMMMMSSS...',
  '....sSSSSSSs....',
  '...PPWBssBWPP...',
  '..PPPPWPPWPPPP..',
  '..PPPPPPPPWPPP..',
  '..WBPPPPPPPPBW..',
  '..SSPPPPPPPPSS..',
  '..SSPPPPPPPPSS..',
  '..hh.PPPPPP.hh..',
]
const BACK = [
  '......K..K......',
  '....KKKKKKKK....',
  '...KKKKKKKKKK...',
  '..KKKKKKkkKKKK..',
  '..KKKKKKKKKKKK..',
  '..KKKKKKKKKKKK..',
  '..KKKKkKKKKKKK..',
  '..SKKKKKKKKKKS..',
  '..SKKKKKKKKKKS..',
  '...KKKKKKKKKK...',
  '....sSSSSSSs....',
  '...PPBWWWWBPP...',
  '..PPPPPPPPPPPP..',
  '..PPPPPPPPPPPP..',
  '..WBPPPPPPPPBW..',
  '..SSPPPPPPPPSS..',
  '..SSPPPPPPPPSS..',
  '..hh.PPPPPP.hh..',
]
const LEGS_STAND = [
  '....JJJJJJJJ....',
  '....JJJ..JJJ....',
  '....JJJ..JJJ....',
  '....jJJ..JJj....',
  '....FFF..FFF....',
  '....fff..fff....',
]
// the leg on the viewer's left planted, the other lifted
const LEGS_STEP = [
  '....JJJJJJJJ....',
  '....JJJ..JJJ....',
  '....JJJ..FFF....',
  '....FFF..fff....',
  '....fff.........',
]

// --- facing right (left is this mirrored) -------------------------------------------
const SIDE_HEAD = [
  '.....K..K.......',
  '....KKKKKKKK....',
  '...KKKKKKKKKK...',
  '..KKKKkkKKKKKK..',
  '..KKKKKKKKKKKK..',
  '..KKKKKKKKSSKK..',
  '..KKKKKSSSSKSS..',
  '..KKKKSSSSSKSS..',
  '..KKKSsSSSSSSS..',
  '...KKSSSSSSMMS..',
  '....sSSSSSSS....',
]
// the near arm hangs straight, or swings forward or back with the stride
const SIDE_TORSO = {
  hang: [
    '.....PPPPBW.....',
    '.....PPPPPP.....',
    '.....PPPPPP.....',
    '.....PPWBPP.....',
    '.....PPSSPP.....',
    '.....PPSSPP.....',
    '.....PPhhPP.....',
  ],
  forward: [
    '.....PPPPBW.....',
    '.....PPPPPP.....',
    '.....PPPPPP.....',
    '.....PPPWBP.....',
    '.....PPPSSP.....',
    '.....PPPPSS.....',
    '.....PPPPPhh....',
  ],
  back: [
    '.....PPPPBW.....',
    '.....PPPPPP.....',
    '.....PPPPPP.....',
    '.....PWBPPP.....',
    '.....PSSPPP.....',
    '.....SSPPPP.....',
    '....hhPPPPP.....',
  ],
}
const SIDE_LEGS_STAND = [
  '.....JJJJJJ.....',
  '......JJJJ......',
  '......JJJJ......',
  '......JJJj......',
  '......FFFFF.....',
  '......fffff.....',
]
// near leg (J) forward; swapping J and j puts the far leg forward instead
const SIDE_LEGS_STRIDE = [
  '.....JJJJJJ.....',
  '....jjj.JJJ.....',
  '...jjj...JJJ....',
  '...FF....FFFF...',
  '...ff....ffff...',
]
const swapLegs = (grid) =>
  grid.map((row, i) => (i === 0 ? row : row.replace(/[Jj]/g, (c) => (c === 'J' ? 'j' : 'J'))))

const stand = (upper, legs) => [...upper, ...legs]
const step = (upper, legs) => [BLANK, ...upper, ...legs]
const side = (arm) => [...SIDE_HEAD, ...SIDE_TORSO[arm]]

const down = [
  stand(FRONT, LEGS_STAND),
  step(FRONT, LEGS_STEP),
  stand(FRONT, LEGS_STAND),
  step(FRONT, mirror(LEGS_STEP)),
]
const up = [
  stand(BACK, LEGS_STAND),
  step(BACK, LEGS_STEP),
  stand(BACK, LEGS_STAND),
  step(BACK, mirror(LEGS_STEP)),
]
const right = [
  stand(side('hang'), SIDE_LEGS_STAND),
  step(side('back'), SIDE_LEGS_STRIDE),
  stand(side('hang'), SIDE_LEGS_STAND),
  step(side('forward'), swapLegs(SIDE_LEGS_STRIDE)),
]
const left = right.map(mirror)

// --- the portrait: the same man at twice the detail, for the homepage ---------------
const PORTRAIT = [
  '.............K....KK............',
  '...........KKKK.KKKKK...........',
  '.........KKKKKKKKKKKKKK.........',
  '........KKKKKKKKKKKKKKKK........',
  '.......KKKKkkkKKKKKKKKKKK.......',
  '......KKKKkkKKKKKKKKKkkKKK......',
  '......KKKKKKKKKKKKKKKKKkKK......',
  '......KKKKKKKKKKKKKKKKKKKK......',
  '......KKKKKKKSSKKKKKSSSKKK......',
  '......KKKSSSSSSSKKSSSSSSKK......',
  '......KKSSSSSSSSSSSSSSSSKK......',
  '......KSSKKKKSSSSSSKKKKSSK......',
  '......KSSSSSSSSSSSSSSSSSSK......',
  '.....sSSSSwKKSSSSSSwKKSSSSs.....',
  '.....sSSSSKKKSSSSSSKKKSSSSs.....',
  '.....sSSSSSSSSSsSSSSSSSSSSs.....',
  '......SShSSSSSSssSSSSSShSS......',
  '......SSSSSMMMMMMMMMMSSSSS......',
  '......sSSSMMSSSSSSSSMMSSSs......',
  '.......sSSSSrrrrrrrrSSSSs.......',
  '........sSSSSSSSSSSSSSSs........',
  '..........ssSSSSSSSSss..........',
  '............sSSSSSSs............',
  '........PPPWWBsSSsBWWPPP........',
  '......PPPPPPWWBssBWWPPPPPP......',
  '.....PPPPPPPPPWppWPPPPPPPPP.....',
  '.....PPPPPPPPPPppPPPPWWWPPP.....',
  '.....PPPPPPPPPPppPPPPPPPPPP.....',
  '.....PPPPPPPPPPPPPPPPWWWPPP.....',
  '.....WWWWPPPPPPPPPPPPPPWWWW.....',
  '.....BBBBPPPPPPPPPPPPPPBBBB.....',
  '.....SSSSPPPPPPPPPPPPPPSSSS.....',
  '.....SSS.PPPPPPPPPPPPPP.SSS.....',
  '.....SSS.PPPPPPPPPPPPPP.SSS.....',
  '.....SSS.PPPPPPPPPPPPPP.SSS.....',
  '.....hSS.PPPPPPPPPPPPPP.SSh.....',
  '.....hSh.JJJJJJJJJJJJJJ.hSh.....',
  '.........JJJJJJJJJJJJJJ.........',
  '.........JJJJJJ..JJJJJJ.........',
  '.........JJJJJJ..JJJJJJ.........',
  '.........JJJJJJ..JJJJJJ.........',
  '.........jJJJJJ..JJJJJj.........',
  '.........jJJJJJ..JJJJJj.........',
  '.........jJJJJJ..JJJJJj.........',
  '.........jJJJJJ..JJJJJj.........',
  '........FFFFFFF..FFFFFFF........',
  '........FFFFFFF..FFFFFFF........',
  '........fffffff..fffffff........',
]
const EYES_ROW = 13
const blink = PORTRAIT.map((row, i) => (i === EYES_ROW ? row.replace(/[wK]/g, 'S') : row))

export default [
  { name: 'avatar', palette, frames: [...down, ...left, ...right, ...up] },
  { name: 'avatar_portrait', palette, frames: [PORTRAIT, blink] },
]

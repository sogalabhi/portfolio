// Redraws of rock_a/b/c (20x16). The Gemini versions palette-snapped down to
// a single flat beige blob each - rock_a read as a cone. These carry a
// top-left light, a shaded underside and a dark contact line along the
// bottom row, which is the sprite's base (bottom-anchored in game).
import { PALETTE_HEX, EXTRA_HEX } from '../../scripts/assets/palette.mjs'

const palette = {
  h: EXTRA_HEX.rockHighlight,
  l: EXTRA_HEX.rockLight,
  m: PALETTE_HEX[7], // dark sand #C9B894 - the old flat rock colour, now the mid-tone
  d: EXTRA_HEX.rockDark,
  o: EXTRA_HEX.rockDeep,
  g: PALETTE_HEX[4], // leaf green
  G: EXTRA_HEX.grassDark,
}

export default [
  {
    name: 'rock_a', // a stone with a small one leaning on it
    palette,
    frames: [[
      '....................',
      '....................',
      '....................',
      '....................',
      '......hhl...........',
      '....hhhllm..........',
      '...hhlllllmd........',
      '..hhllllmmmd........',
      '..hlllmmmmmdd.......',
      '.hllllmmmmmdd..hl...',
      '.lllmmmmmmddd.hllmd.',
      '.llmmmmmmddddohlmmd.',
      '.mmmmmmmdddddolmmdd.',
      '..mmmmddddddoommddo.',
      '...ddddddoooo.ddooo.',
      '....oooooooo...ooo..',
    ]],
  },
  {
    name: 'rock_b', // a rounded boulder
    palette,
    frames: [[
      '....................',
      '....................',
      '........hhhl........',
      '......hhhhlllm......',
      '.....hhhllllllmd....',
      '....hhhllllllmmmd...',
      '...hhlllllllmmmmd...',
      '...hlllllllmmmmmdd..',
      '..hlllllllmmmmmmddd.',
      '..llllllmmmmmmmdddd.',
      '..lllllmmmmmmmdddddo',
      '..lllmmmmmmmmddddddo',
      '...mmmmmmmmmdddddoo.',
      '...mmmmmmmddddddooo.',
      '....ddddddddddoooo..',
      '......oooooooooo....',
    ]],
  },
  {
    name: 'rock_c', // a low flat stone with moss on top
    palette,
    frames: [[
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '......gGg...........',
      '....gggGhhll........',
      '...hgGhhllllmm......',
      '..hhhhllllllmmmd....',
      '.hhllllllllmmmmmdd..',
      '.hlllllllmmmmmmdddd.',
      '.llllllmmmmmmmdddddo',
      '..mmmmmmmmmdddddddo.',
      '...dddddddddddoooo..',
      '.....oooooooooooo...',
    ]],
  },
]

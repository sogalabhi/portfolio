// Layout of public/world/tiles/terrain.png, shared by build-terrain.mjs (draws
// it) and build-map.mjs (picks tile ids from it).
//
// Ground is corner-based ("dual grid"): terrain is decided per grid *vertex*,
// and each tile is drawn from its four corners. Levels stack - water < sand <
// grass < path < stone - and every level above water is its own overlay layer
// drawn over the ones below. So each overlay needs only 15 tiles (one per
// corner combination; 0 is simply no tile) rather than a tile for every pair
// of terrains that might meet.

export const TILE = 16
export const COLUMNS = 16
export const ROWS = 5

export const LEVEL = { water: 0, sand: 1, grass: 2, path: 3, stone: 4 }
export const OVERLAYS = ['sand', 'grass', 'path', 'stone'] // levels 1..4, bottom to top

// corner bits of a tile's mask
export const TL = 1
export const TR = 2
export const BL = 4
export const BR = 8
export const FULL = 15

// row (level - 1) holds that overlay: column (mask - 1) for masks 1..15, so the
// plain full tile sits in column 14, and column 15 is a second full variant
export function edgeTile(level, mask) {
  return (level - 1) * COLUMNS + (mask - 1)
}

const ROW4 = 4 * COLUMNS
// extra full-tile variants so large areas don't show a repeating stamp;
// the first entry is the most common one
export const FULL_VARIANTS = {
  1: [edgeTile(1, FULL), edgeTile(1, FULL) + 1, ROW4 + 2],
  2: [edgeTile(2, FULL), edgeTile(2, FULL) + 1, ROW4 + 0, ROW4 + 1],
  3: [edgeTile(3, FULL), edgeTile(3, FULL) + 1, ROW4 + 3],
  4: [edgeTile(4, FULL), edgeTile(4, FULL) + 1],
}
export const WATER_TILE = ROW4 + 14 // only for viewing the map in Tiled; the game draws animated water
export const BLOCK_TILE = ROW4 + 15 // collision layer marker (hidden in game)

export const WATER_FRAME = 32 // px, public/world/tiles/water.png is 3 of these side by side
export const WATER_FRAMES = 3

// The island's design, in world px (the map is 80x56 tiles of 16px = 1280x896).
// build-map.mjs turns this into public/world/map/island.json. Building
// positions are base-centres (the sprite's bottom-middle), same as in game.

export const MAP = { cols: 80, rows: 56 }

// a wobbly ellipse; the wobble is a few low-frequency sines of the angle, so
// the coast is organic but the same on every build
export const ISLAND = {
  cx: 640,
  cy: 452,
  rx: 560,
  ry: 382,
  wobble: [
    [2, 0.6, 0.05],
    [3, 1.3, 0.07],
    [5, 0.4, 0.05],
    [7, 2.9, 0.03],
    [11, 2.1, 0.02],
  ], // [frequency, phase, amplitude]
  beach: 0.1, // fraction of the radius that's sand, before its own wobble
  beachWobble: [4, 0.7, 0.03],
}

export const PLAZA = { x: 640, y: 470, r: 60 }
export const SPAWN = { x: 648, y: 478 }

export const BUILDINGS = {
  spawn: { x: 600, y: 440 }, // the Welcome sign, on the plaza
  workshop: { x: 392, y: 300 },
  tower: { x: 688, y: 232 },
  shrine: { x: 944, y: 312 },
  garden: { x: 352, y: 600 },
  terminal: { x: 640, y: 690 },
  archive: { x: 936, y: 640 },
}

export const PATH_HALF_WIDTH = 18
export const YARD_RADIUS = 22 // dirt patch in front of each door

// Each path runs from the plaza through these points to the door. Doors face
// south, so paths to buildings south of the plaza swing round the side and
// come in from the front.
export const PATHS = {
  workshop: [[540, 420], [450, 378], [400, 348]],
  tower: [[652, 380], [678, 300]],
  shrine: [[740, 432], [850, 392], [920, 362]],
  garden: [[540, 512], [446, 560], [410, 620], [378, 640]],
  terminal: [[700, 560], [712, 650], [684, 712]],
  archive: [[744, 540], [820, 610], [862, 662]],
}

// [atlas frame, x, y] - base-centres. Everything placed with intent next to a
// building or path; random scatter (trees, bushes, rocks, flowers) is
// generated around these.
export const PROPS = [
  // workshop yard
  ['workbench', 468, 300],
  ['barrel', 330, 298],
  ['crates_three', 338, 334],
  ['crates_two', 306, 330],
  ['crate_open', 478, 334],
  // tower
  ['dish', 732, 236],
  ['lamp_post', 636, 318],
  ['lamp_post', 716, 318],
  // shrine
  ['trophy_pedestal', 1000, 318],
  ['stone_lantern', 894, 340],
  ['stone_lantern', 986, 352],
  // garden: a fenced field of soil beds west of the shed, crops at four stages
  ['soil_bed', 236, 584],
  ['soil_bed', 288, 584],
  ['soil_bed', 236, 628],
  ['soil_bed', 288, 628],
  ['plant_stage1', 236, 576],
  ['plant_stage2', 288, 576],
  ['plant_stage3', 236, 620],
  ['plant_stage4', 288, 620],
  ['fence_post', 204, 548],
  ['fence_segment', 220, 548],
  ['fence_segment', 236, 548],
  ['fence_segment', 252, 548],
  ['fence_segment', 268, 548],
  ['fence_segment', 284, 548],
  ['fence_segment', 300, 548],
  ['fence_post', 316, 548],
  // plaza and paths
  ['bench', 616, 540],
  ['bench', 692, 418],
  ['lamp_post', 560, 396],
  ['lamp_post', 730, 500],
  ['lamp_post', 520, 440],
  ['lamp_post', 800, 452],
  ['lamp_post', 540, 552],
  ['lamp_post', 760, 598],
]

// flat things that sort with the ground rather than standing up (plants
// growing in a bed must draw over it)
export const GROUND_PROPS = ['soil_bed']

export const SCATTER = {
  seed: 1337,
  spacing: 14, // candidate grid step, px
  grass: [
    ['tree_large_a', 9], ['tree_large_b', 9], ['tree_small_a', 11], ['tree_small_b', 11],
    ['bush_a', 8], ['bush_b', 8], ['bush_c', 8],
    ['rock_a', 3], ['rock_b', 3], ['rock_c', 3],
    ['flowers_blue', 7], ['flowers_red', 7], ['flowers_white', 7],
  ],
  sand: [['rock_a', 1], ['rock_b', 1], ['rock_c', 1]],
  // chance a candidate spot gets anything: a forest ring toward the coast,
  // lighter in the middle where the paths and buildings are
  density: { inner: 0.07, coast: 0.3, sand: 0.02 },
  clearance: { building: 12, prop: 6, path: 8, plaza: 16, spawn: 40 },
}

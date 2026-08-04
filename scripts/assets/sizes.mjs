// Target in-game sizes per scripts/assets/README.md's inventory tables.
// Single source of truth for the batch downscale step.

export const TARGET_SIZES = {
  // Tier B — buildings (zone markers)
  workshop: [96, 80],
  tower: [64, 112],
  shrine: [80, 72],
  shed: [80, 64],
  archive: [112, 72],
  terminal_desk: [48, 48],
  signpost: [32, 48],

  // Tier C — large props
  workbench: [48, 32],
  crates_three: [32, 32],
  crate_open: [32, 24],
  trophy_pedestal: [32, 40],
  stone_lantern: [24, 40],
  soil_bed: [48, 32],
  barrel: [24, 28],
  dish: [32, 32],
  crates_two: [24, 24],
  bench: [40, 20],

  // Tier D — scatter + garden growth
  tree_large_a: [48, 64],
  tree_large_b: [48, 64],
  tree_small_a: [32, 40],
  tree_small_b: [32, 40],
  bush_a: [24, 20],
  bush_b: [24, 20],
  bush_c: [24, 20],
  rock_a: [20, 16],
  rock_b: [20, 16],
  rock_c: [20, 16],
  flowers_white: [16, 16],
  flowers_red: [16, 16],
  flowers_blue: [16, 16],
  fence_segment: [16, 20],
  fence_post: [16, 20],
  lamp_post: [16, 40],
  plant_stage1: [16, 20],
  plant_stage2: [20, 28],
  plant_stage3: [28, 36],
  plant_stage4: [40, 56],
}

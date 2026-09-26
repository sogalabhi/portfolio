export const TILE = 16

// Where the player starts: the plaza where every path meets. Beside the
// welcome sign rather than on it, and outside the sign's trigger, so the
// first frame shows the player clearly with no "E" prompt on top.
export const SPAWN_POINT = { x: 480, y: 320 }

// x/y is each building's base-centre - its sprite is drawn bottom-anchored
// there, so anything below y is in front of it and anything above is behind.
// WorldScene measures the drawn art at runtime and derives the collision box,
// trigger, label and tap area from it plus these per-building numbers:
//   depth     how far back from the base the building is solid, in px - the
//             rest of the art is roof the player can walk behind
//   solidW    collision width when it should be narrower than the art (the
//             sign's post); otherwise the art width minus a small inset
//   doorDx    x offset of the door from x - the trigger, the tap walk-to
//             point and the E prompt all sit in front of it
//   clearing  sand clearing radius in tiles (mapLayout.js)
export const ZONES = [
  { id: 'spawn', title: 'Welcome', x: 432, y: 300, depth: 6, solidW: 8, doorDx: 0, clearing: 3 },
  { id: 'workshop', title: 'Workshop', x: 192, y: 128, depth: 34, doorDx: -5, clearing: 5 },
  { id: 'tower', title: 'Tower', x: 480, y: 144, depth: 28, doorDx: -2, clearing: 5 },
  { id: 'shrine', title: 'Shrine', x: 768, y: 128, depth: 30, doorDx: -4, clearing: 5 },
  { id: 'garden', title: 'Garden', x: 192, y: 512, depth: 28, doorDx: -7, clearing: 5 },
  { id: 'terminal', title: 'Terminal', x: 480, y: 512, depth: 14, doorDx: 0, clearing: 4 },
  { id: 'archive', title: 'Archive', x: 768, y: 512, depth: 30, doorDx: 0, clearing: 5 },
]

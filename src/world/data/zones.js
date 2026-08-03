export const TILE = 16

// Center points, in source-pixel coordinates. A real Tiled export would give
// top-left + width/height instead — Zone.js accepts either shape via x/y as center.
export const SPAWN_POINT = { x: 480, y: 320 }

export const ZONES = [
  { id: 'spawn', title: 'Spawn', x: SPAWN_POINT.x, y: SPAWN_POINT.y + 30, width: 90, height: 90 },
  { id: 'workshop', title: 'Workshop', x: 192, y: 128, width: 112, height: 112 },
  { id: 'tower', title: 'Tower', x: 480, y: 96, width: 112, height: 112 },
  { id: 'shrine', title: 'Shrine', x: 768, y: 128, width: 112, height: 112 },
  { id: 'garden', title: 'Garden', x: 192, y: 512, width: 112, height: 112 },
  { id: 'terminal', title: 'Terminal', x: 480, y: 512, width: 96, height: 96 },
  { id: 'archive', title: 'Archive', x: 768, y: 512, width: 112, height: 112 },
]

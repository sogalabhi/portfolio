import { TILE, SPAWN_POINT, ZONES } from './zones'

export const MAP_COLS = 60
export const MAP_ROWS = 40

// indices into the placeholder tileset generated at runtime in BootScene —
// swap this file out for a real Tiled JSON export later and these go away
export const TILE_GRASS = 0
export const TILE_PATH = 1
export const TILE_SAND = 2
export const TILE_BLOCK = 3

function toTile(px) {
  return Math.round(px / TILE)
}

function carvePath(ground, x0, y0, x1, y1) {
  const setPath = (x, y) => {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tx = x + dx
        const ty = y + dy
        if (tx > 0 && ty > 0 && tx < MAP_COLS - 1 && ty < MAP_ROWS - 1) {
          ground[ty][tx] = TILE_PATH
        }
      }
    }
  }

  let x = x0
  while (x !== x1) {
    setPath(x, y0)
    x += x < x1 ? 1 : -1
  }
  let y = y0
  while (y !== y1) {
    setPath(x1, y)
    y += y < y1 ? 1 : -1
  }
  setPath(x1, y1)
}

export function buildMap() {
  const ground = Array.from({ length: MAP_ROWS }, () => new Array(MAP_COLS).fill(TILE_GRASS))
  const collision = Array.from({ length: MAP_ROWS }, () => new Array(MAP_COLS).fill(-1))

  // border walls
  for (let x = 0; x < MAP_COLS; x++) {
    collision[0][x] = TILE_BLOCK
    collision[MAP_ROWS - 1][x] = TILE_BLOCK
  }
  for (let y = 0; y < MAP_ROWS; y++) {
    collision[y][0] = TILE_BLOCK
    collision[y][MAP_COLS - 1] = TILE_BLOCK
  }

  const spawnTile = { x: toTile(SPAWN_POINT.x), y: toTile(SPAWN_POINT.y) }

  // sand clearing under spawn + each zone, and a path connecting them
  const clear = (cx, cy, r) => {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (x > 0 && y > 0 && x < MAP_COLS - 1 && y < MAP_ROWS - 1) {
          ground[y][x] = TILE_SAND
        }
      }
    }
  }

  clear(spawnTile.x, spawnTile.y, 4)

  ZONES.forEach((zone) => {
    const zx = toTile(zone.x)
    const zy = toTile(zone.y)
    clear(zx, zy, Math.round(zone.width / TILE / 2) + 1)
    carvePath(ground, spawnTile.x, spawnTile.y, zx, zy)
  })

  return { ground, collision, cols: MAP_COLS, rows: MAP_ROWS }
}

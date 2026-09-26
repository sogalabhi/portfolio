// Click/tap-to-move routing around solid things (building bases, the map
// border). Plain A* over the tile grid, then string-pulled down to a few
// straight segments so the walk doesn't zigzag tile by tile.
//
// Everything here is in *sprite-position* space: a point is free when the
// player's physics body, placed with its sprite at that point, overlaps no
// obstacle. `body` describes that body relative to the sprite position
// ({ left, right, top, bottom } offsets, e.g. { left: -10, right: 10, top: 0,
// bottom: 14 } for a 20x14 body hanging below the sprite centre).

const SQRT2 = Math.SQRT2
const SAMPLE_STEP = 4 // px between line-of-sight samples; below the 14px body height
// Breathing room kept from every wall. A route that merely touches a corner
// snags on it: arrival at a waypoint is only accurate to a few px, so the
// body clips the corner by a fraction of a pixel and Arcade blocks it there.
const CLEARANCE = 3

// grow each obstacle by the body's extent (plus clearance), so "is this sprite
// position free" becomes a plain point-in-rect test
function inflate(rects, body) {
  return rects.map((r) => ({
    left: r.left - body.right - CLEARANCE,
    right: r.right - body.left + CLEARANCE,
    top: r.top - body.bottom - CLEARANCE,
    bottom: r.bottom - body.top + CLEARANCE,
  }))
}

export function createPathfinder({ cols, rows, tile, obstacles, body }) {
  const blocked = inflate(obstacles, body)
  const isFree = (x, y) =>
    !blocked.some((r) => x > r.left && x < r.right && y > r.top && y < r.bottom)

  const centre = (c) => c * tile + tile / 2
  const free = new Uint8Array(cols * rows)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) free[r * cols + c] = isFree(centre(c), centre(r)) ? 1 : 0
  }
  const freeAt = (c, r) => c >= 0 && r >= 0 && c < cols && r < rows && free[r * cols + c] === 1

  const lineIsFree = (a, b) => {
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / SAMPLE_STEP)
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      if (!isFree(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false
    }
    return true
  }

  // nearest free tile to a point - a click inside a wall still walks
  // somewhere sensible instead of failing outright
  const nearestFree = (x, y) => {
    const c0 = Math.floor(x / tile)
    const r0 = Math.floor(y / tile)
    for (let radius = 0; radius < Math.max(cols, rows); radius++) {
      let best = null
      for (let r = r0 - radius; r <= r0 + radius; r++) {
        for (let c = c0 - radius; c <= c0 + radius; c++) {
          if (Math.max(Math.abs(r - r0), Math.abs(c - c0)) !== radius || !freeAt(c, r)) continue
          const d = Math.hypot(centre(c) - x, centre(r) - y)
          if (!best || d < best.d) best = { c, r, d }
        }
      }
      if (best) return best
    }
    return null
  }

  const astar = (start, goal) => {
    const key = (c, r) => r * cols + c
    const g = new Map([[key(start.c, start.r), 0]])
    const from = new Map()
    const h = (c, r) => Math.hypot(c - goal.c, r - goal.r)
    const open = [{ c: start.c, r: start.r, f: h(start.c, start.r) }]
    const closed = new Set()

    while (open.length) {
      // the grid is 60x40 - a linear scan for the lowest f is plenty
      let bi = 0
      for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i
      const cur = open.splice(bi, 1)[0]
      const ck = key(cur.c, cur.r)
      if (closed.has(ck)) continue
      if (cur.c === goal.c && cur.r === goal.r) {
        const out = []
        for (let k = ck; k !== undefined; k = from.get(k)) out.push({ c: k % cols, r: Math.floor(k / cols) })
        return out.reverse()
      }
      closed.add(ck)

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue
          const nc = cur.c + dc
          const nr = cur.r + dr
          if (!freeAt(nc, nr)) continue
          // no cutting corners past a blocked orthogonal neighbour
          if (dr && dc && (!freeAt(cur.c + dc, cur.r) || !freeAt(cur.c, cur.r + dr))) continue
          const nk = key(nc, nr)
          const ng = g.get(ck) + (dr && dc ? SQRT2 : 1)
          if (ng < (g.get(nk) ?? Infinity)) {
            g.set(nk, ng)
            from.set(nk, ck)
            open.push({ c: nc, r: nr, f: ng + h(nc, nr) })
          }
        }
      }
    }
    return null
  }

  // Returns waypoints from `from` to `to` (excluding `from`), or null when
  // there's no route. The final point is `to` itself when it's reachable,
  // otherwise the nearest free spot to it.
  return function findPath(from, to) {
    if (lineIsFree(from, to)) return [to]

    const start = isFree(from.x, from.y)
      ? { c: Math.floor(from.x / tile), r: Math.floor(from.y / tile) }
      : nearestFree(from.x, from.y)
    const goal = nearestFree(to.x, to.y)
    if (!start || !goal) return null
    if (!freeAt(start.c, start.r)) Object.assign(start, nearestFree(from.x, from.y))

    const cells = astar(start, goal)
    if (!cells) return null

    const end = isFree(to.x, to.y) ? to : { x: centre(goal.c), y: centre(goal.r) }
    const points = [...cells.map(({ c, r }) => ({ x: centre(c), y: centre(r) })), end]

    // string-pull: from each anchor, jump to the furthest point still in
    // straight-line sight
    const path = []
    let anchor = from
    let i = 0
    while (i < points.length) {
      let j = points.length - 1
      while (j > i && !lineIsFree(anchor, points[j])) j--
      path.push(points[j])
      anchor = points[j]
      i = j + 1
    }
    return path
  }
}

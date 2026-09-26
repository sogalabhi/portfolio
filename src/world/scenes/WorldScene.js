import Phaser from 'phaser'
import { bus, EVENTS } from '../bus'
import { buildMap, TILE_PATH, TILE_SAND, TILE_GRASS } from '../data/mapLayout'
import { SPAWN_POINT, ZONES, TILE } from '../data/zones'
import Player from '../entities/Player'
import ZoneManager from '../entities/Zone'
import { createPathfinder } from '../pathfinding'

// nature scatter - packed into the atlas by the asset pipeline (scripts/assets/README.md's
// Tier D) but never actually placed anywhere until now. Curated props (fences, lamp posts,
// benches, barrels, lanterns) are left out on purpose: those read as placed-with-intent next
// to a path or building, not scattered - a randomly-dropped bench looks like a bug, not decor.
const SCATTER_DEFS = [
  { frame: 'tree_large_a', height: 64 },
  { frame: 'tree_large_b', height: 64 },
  { frame: 'tree_small_a', height: 40 },
  { frame: 'tree_small_b', height: 40 },
  { frame: 'bush_a', height: 20 },
  { frame: 'bush_b', height: 20 },
  { frame: 'bush_c', height: 20 },
  { frame: 'rock_a', height: 16 },
  { frame: 'rock_b', height: 16 },
  { frame: 'rock_c', height: 16 },
  { frame: 'flowers_blue', height: 16 },
  { frame: 'flowers_red', height: 16 },
  { frame: 'flowers_white', height: 16 },
]
const SCATTER_DENSITY = 0.04

// deterministic per-tile pseudo-random, not Math.random() - same island every
// load, reproducible for screenshots/debugging instead of shuffling underfoot
function tileHash(x, y, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + seed
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

const LERP = { pointer: 0.1, touch: 0.15 }
const FOLLOW_OFFSET_Y = { pointer: 0, touch: 40 }
// extra slop around a building for taps/clicks - a finger is imprecise, a mouse isn't
const ZONE_HIT_PAD = { pointer: 4, touch: 20 }
const FOOTPRINT_THROTTLE_MS = 180
const LABEL_THROTTLE_MS = 66
const LABEL_MARGIN = 10

// Whole-number zoom only - at 1.5 every art pixel was drawn alternately 1
// and 2 screen px wide, which reads as lumpy texture and shimmers while the
// camera moves. Aim for about this much world visible vertically...
const TARGET_VIEW_HEIGHT = 320
// ...but never zoom out so far that the viewport sees past the map edge (a
// phone at 1x showed ~200px of empty teal under the map)
function pickZoom(viewW, viewH, mapW, mapH) {
  const fill = Math.ceil(Math.max(viewW / mapW, viewH / mapH))
  return Math.max(1, fill, Math.floor(viewH / TARGET_VIEW_HEIGHT))
}

// a zone's trigger is a strip in front of its door, measured from the base
const TRIGGER_WIDTH = 44
const TRIGGER_REACH = 36 // how far in front of the base it extends
const TRIGGER_OVERLAP = 4 // how far it tucks under the base, so standing against the wall counts
const WALK_TO_GAP = 14 // where taps and teleports park the player, in front of the base
const SOLID_INSET = 4 // collision a touch narrower than the art, so corners don't snag
const PROMPT_RISE = 32 // E prompt height above the base

const PROP_BY_ZONE = {
  workshop: 'prop-workbench',
  garden: 'prop-plant',
  archive: 'prop-crate',
  shrine: 'prop-trophy',
  tower: 'prop-antenna',
  terminal: 'prop-terminal',
  spawn: 'prop-signpost',
}

// atlas frame names these placeholders become once scripts/assets/README.md's
// pipeline has produced public/world/atlas/{atlas.png,atlas.json}
const ATLAS_FRAME_BY_ZONE = {
  workshop: 'workshop',
  garden: 'shed',
  archive: 'archive',
  shrine: 'shrine',
  tower: 'tower',
  terminal: 'terminal_desk',
  spawn: 'signpost',
}

// falls back to the placeholder texture whenever the real atlas (or a given
// frame within it) hasn't been generated yet - see BootScene.js
function resolvePropTexture(scene, placeholderKey, atlasFrame) {
  const atlas = scene.textures.exists('objects') && scene.textures.get('objects')
  if (atlas && atlasFrame && atlas.has(atlasFrame)) {
    return { key: 'objects', frame: atlasFrame, isReal: true }
  }
  return { key: placeholderKey, frame: undefined, isReal: false }
}

// The drawn art's box in world space. Atlas frames are trimmed (the packer
// strips transparent margins - the archive's drawn base sits 6px above its
// anchor, the tower is 35px wide inside a 64px frame), so the anchor rect is
// bigger than what's visible; labels, hit areas and collision want the latter.
function artBox(image) {
  const left = image.x - image.displayOriginX
  const top = image.y - image.displayOriginY
  const { frame } = image
  if (frame.trimmed) {
    const { x, y, w, h } = frame.data.spriteSourceSize
    return { left: left + x, top: top + y, right: left + x + w, bottom: top + y + h }
  }
  return { left, top, right: left + image.width, bottom: top + image.height }
}

// Everything interactive about a zone, derived from where its art actually
// landed - so the same numbers hold for the real art and the placeholder rects
function resolveZone(zone, art) {
  const base = art.bottom
  const depth = Math.min(zone.depth, base - art.top)
  const doorX = zone.x + zone.doorDx
  return {
    ...zone,
    art,
    base,
    solid: {
      x: (art.left + art.right) / 2,
      y: base - depth / 2,
      width: zone.solidW ?? art.right - art.left - SOLID_INSET * 2,
      height: depth,
    },
    trigger: {
      x: doorX,
      y: base + (TRIGGER_REACH - TRIGGER_OVERLAP) / 2,
      width: TRIGGER_WIDTH,
      height: TRIGGER_REACH + TRIGGER_OVERLAP,
    },
    walkTo: { x: doorX, y: base + WALK_TO_GAP },
  }
}

export default class WorldScene extends Phaser.Scene {
  constructor() {
    super('World')
    this.pauseInput = false
  }

  create() {
    if (import.meta.env.DEV) window.__worldScene = this

    // read once here - camera/input config doesn't react to mode changing
    // mid-session (e.g. a tablet rotating), matching how Player/WorldScene
    // pick their art/behavior once at create
    this.mode = this.registry.get('mode') || 'pointer'

    const mapData = buildMap()

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const map = this.make.tilemap({ data: mapData.ground, tileWidth: TILE, tileHeight: TILE })
    const tileset = map.addTilesetImage('tiles', 'tileset', TILE, TILE, 0, 0)
    this.groundLayer = map.createLayer(0, tileset, 0, 0)

    const collisionLayer = map.createBlankLayer('collision', tileset, 0, 0)
    for (let y = 0; y < mapData.rows; y++) {
      for (let x = 0; x < mapData.cols; x++) {
        const idx = mapData.collision[y][x]
        if (idx >= 0) collisionLayer.putTileAt(idx, x, y)
      }
    }
    collisionLayer.setCollisionByExclusion([-1])

    this.placeScatter(mapData)

    this.player = new Player(this, SPAWN_POINT.x, SPAWN_POINT.y)
    this.physics.add.collider(this.player.sprite, collisionLayer)

    this.mapSize = { width: map.widthInPixels, height: map.heightInPixels }
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    const cam = this.cameras.main
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.applyZoom()
    const lerp = this.reducedMotion ? 1 : LERP[this.mode]
    cam.startFollow(this.player.sprite, true, lerp, lerp)
    cam.setFollowOffset(0, FOLLOW_OFFSET_Y[this.mode])

    // WorldPage drives scale.resize() itself (debounced), so re-pick the zoom
    // off the new viewport whenever it does
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyZoom, this)

    this.zones = ZONES.map((zone) => {
      const tex = resolvePropTexture(this, PROP_BY_ZONE[zone.id], ATLAS_FRAME_BY_ZONE[zone.id])
      const prop = this.add.image(zone.x, zone.y, tex.key, tex.frame)
      // real generated art is authored bottom-anchored (feet at sprite.y) so it
      // sorts correctly against the player; placeholder rects stay center-anchored
      if (tex.isReal) prop.setOrigin(0.5, 1)
      const resolved = resolveZone(zone, artBox(prop))
      // sorted by where it meets the ground, same as the player's feet
      prop.setDepth(resolved.base)
      return resolved
    })

    // Only the map border collided before, so the player walked through walls
    // and stood on roofs. Each building gets a box along its base; the roof
    // above it stays walk-behind, with depth sorting hiding the player there.
    const solids = this.zones.map(({ solid }) => {
      const block = this.add.zone(solid.x, solid.y, solid.width, solid.height)
      this.physics.add.existing(block, true)
      return block
    })
    this.physics.add.collider(this.player.sprite, solids)

    // Click/tap routing around the same things the colliders stop: building
    // bases plus the map's collision tiles. Without it a tap on a building
    // from behind walked straight into its back wall and gave up there.
    const obstacles = this.zones.map(({ solid: s }) => ({
      left: s.x - s.width / 2,
      right: s.x + s.width / 2,
      top: s.y - s.height / 2,
      bottom: s.y + s.height / 2,
    }))
    for (let y = 0; y < mapData.rows; y++) {
      for (let x = 0; x < mapData.cols; x++) {
        if (mapData.collision[y][x] < 0) continue
        obstacles.push({ left: x * TILE, right: (x + 1) * TILE, top: y * TILE, bottom: (y + 1) * TILE })
      }
    }
    const { sprite } = this.player
    const bodyLeft = sprite.body.offset.x - sprite.displayOriginX
    const bodyTop = sprite.body.offset.y - sprite.displayOriginY
    this.findPath = createPathfinder({
      cols: mapData.cols,
      rows: mapData.rows,
      tile: TILE,
      obstacles,
      body: {
        left: bodyLeft,
        right: bodyLeft + sprite.body.width,
        top: bodyTop,
        bottom: bodyTop + sprite.body.height,
      },
    })

    this.zoneManager = new ZoneManager(this, this.player, this.zones)

    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })

    this.interactKeys = this.input.keyboard.addKeys({
      e: Phaser.Input.Keyboard.KeyCodes.E,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
    })

    this.input.on('pointerdown', (pointer) => {
      if (this.pauseInput) return
      const hitZone = this.zoneAt(pointer.worldX, pointer.worldY)

      // buildings are solid, so walking to the tapped point itself would stall
      // against a wall - head for the door instead and open it on arrival
      const target = hitZone ? hitZone.walkTo : { x: pointer.worldX, y: pointer.worldY }
      const source = this.mode === 'touch' ? 'tap' : 'click'
      const onArrive = hitZone ? () => bus.emit(EVENTS.INTERACT, { id: hitZone.id, source }) : null
      const { x, y } = this.player.sprite
      this.player.moveAlong(this.findPath({ x, y }, target) ?? [target], { onArrive })
    })

    const capturedKeys = [
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.E,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    ]

    // Phaser captures (preventDefault) these keys globally the moment they're
    // registered via addKeys/createCursorKeys - independent of pauseInput - which
    // silently blocks typing (e.g. Enter submitting the terminal's <form>) in any
    // React input rendered on top while a panel is open. Release capture whenever
    // input is paused, re-capture when back in the world.
    const handlePauseInput = (paused) => {
      this.pauseInput = paused
      if (paused) this.input.keyboard.removeCapture(capturedKeys)
      else this.input.keyboard.addCapture(capturedKeys)
    }
    bus.on(EVENTS.PAUSE_INPUT, handlePauseInput)

    // spawn means the plaza start point; any other zone parks the player in
    // front of its door - its base-centre is inside the building's collision now
    const handleTeleport = ({ id }) => {
      const target = id === 'spawn' ? SPAWN_POINT : this.zones.find((z) => z.id === id)?.walkTo
      if (!target) return
      this.player.stop()
      this.player.sprite.body.reset(target.x, target.y)
    }
    bus.on(EVENTS.TELEPORT, handleTeleport)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.off(EVENTS.PAUSE_INPUT, handlePauseInput)
      bus.off(EVENTS.TELEPORT, handleTeleport)
      this.scale.off(Phaser.Scale.Events.RESIZE, this.applyZoom, this)
    })

    bus.emit(EVENTS.ZONE_EXIT, { id: null })
  }

  update(time, delta) {
    this.player.update(delta, this.cursors, this.wasd, this.pauseInput)
    this.zoneManager.update()
    this.updateFootprints(time)
    this.emitZoneLabels(time)

    if (!this.pauseInput && this.zoneManager.activeZone) {
      const { e, space, enter } = this.interactKeys
      if (
        Phaser.Input.Keyboard.JustDown(e) ||
        Phaser.Input.Keyboard.JustDown(space) ||
        Phaser.Input.Keyboard.JustDown(enter)
      ) {
        bus.emit(EVENTS.INTERACT, { id: this.zoneManager.activeZone, source: 'keyboard' })
      }

      if (!this.lastPromptEmit || time - this.lastPromptEmit > 66) {
        this.lastPromptEmit = time
        const zone = this.zoneManager.getZone(this.zoneManager.activeZone)
        const cam = this.cameras.main
        // cam.worldView (not scrollX/scrollY - this Phaser version's scrollX/Y
        // don't mean "world coord at viewport's top-left" while a camera is
        // actively following with lerp; worldView.x/y verified empirically to
        // be the correct reference for that) gives the visible world rectangle
        const screenX = (zone.walkTo.x - cam.worldView.x) * cam.zoom
        const screenY = (zone.base - PROMPT_RISE - cam.worldView.y) * cam.zoom
        bus.emit(EVENTS.PROMPT_POS, { id: zone.id, x: screenX, y: screenY })
      }
    }
  }

  // All 7 zones, always - not proximity-gated like the E-prompt/ZoneManager.
  // People arriving from a link have no reason to already know what "Tower"
  // means, and shouldn't have to walk up to every building to find out.
  emitZoneLabels(time) {
    if (this.lastLabelEmit && time - this.lastLabelEmit < LABEL_THROTTLE_MS) return
    this.lastLabelEmit = time

    const cam = this.cameras.main
    // floats above each building's drawn top edge, not a fixed offset - the
    // sign (48 tall) and the tower (112 tall) would otherwise clash
    const labels = this.zones.map(({ id, title, art }) => ({
      id,
      title,
      x: ((art.left + art.right) / 2 - cam.worldView.x) * cam.zoom,
      y: (art.top - LABEL_MARGIN - cam.worldView.y) * cam.zoom,
    }))
    bus.emit(EVENTS.ZONE_LABELS, labels)
  }

  // Grass tiles only (excludes paths/sand clearings/zones by construction -
  // no separate distance math needed) and only when the real atlas is
  // loaded - pure decoration, so it's fine to just skip it rather than draw
  // placeholder rects like the props do.
  placeScatter(mapData) {
    if (!this.textures.exists('objects')) return
    const atlas = this.textures.get('objects')
    const available = SCATTER_DEFS.filter((d) => atlas.has(d.frame))
    if (!available.length) return

    for (let y = 1; y < mapData.rows - 1; y++) {
      for (let x = 1; x < mapData.cols - 1; x++) {
        if (mapData.ground[y][x] !== TILE_GRASS) continue
        if (tileHash(x, y, 1337) > SCATTER_DENSITY) continue

        const pick = available[Math.floor(tileHash(x, y, 91) * available.length)]
        const tilesTall = Math.ceil(pick.height / TILE)

        // clearance: the sprite is bottom-anchored, so it extends upward
        // from this tile - and a tile wider than 16px can spill into its
        // left/right neighbor, so check those too
        let clear = true
        for (let dy = 0; dy < tilesTall && clear; dy++) {
          const ty = y - dy
          if (ty < 1 || mapData.ground[ty][x] !== TILE_GRASS) clear = false
        }
        if (clear && (mapData.ground[y][x - 1] !== TILE_GRASS || mapData.ground[y][x + 1] !== TILE_GRASS)) {
          clear = false
        }
        if (!clear) continue

        const px = x * TILE + TILE / 2
        const py = y * TILE + TILE
        this.add.image(px, py, 'objects', pick.frame).setOrigin(0.5, 1).setDepth(py)
      }
    }
  }

  // Tap/click target, not player proximity: the building's drawn art or the
  // strip in front of its door. Touch gets extra slop - a near-miss that walks
  // past the building is the most annoying possible failure. Independent of
  // ZoneManager's activeZone, which drives the E prompt off the player's position.
  zoneAt(x, y) {
    const pad = ZONE_HIT_PAD[this.mode]
    const within = (left, top, right, bottom) =>
      x >= left - pad && x <= right + pad && y >= top - pad && y <= bottom + pad
    return this.zones.find(
      ({ art, trigger: t }) =>
        within(art.left, art.top, art.right, art.bottom) ||
        within(t.x - t.width / 2, t.y - t.height / 2, t.x + t.width / 2, t.y + t.height / 2)
    )
  }

  applyZoom() {
    const { width, height } = this.scale
    this.cameras.main.setZoom(pickZoom(width, height, this.mapSize.width, this.mapSize.height))
  }

  updateFootprints(time) {
    if (this.reducedMotion || !this.player.moving) return
    const throttle = this.mode === 'touch' ? FOOTPRINT_THROTTLE_MS * 2 : FOOTPRINT_THROTTLE_MS
    if (this.lastFootprintAt && time - this.lastFootprintAt < throttle) return

    const { x, y } = this.player.sprite
    const tile = this.groundLayer.getTileAtWorldXY(x, y)
    if (!tile || (tile.index !== TILE_PATH && tile.index !== TILE_SAND)) return

    this.lastFootprintAt = time
    const print = this.add.image(x, y + 6, 'footprint').setDepth(y - 1).setAlpha(0.5)
    this.tweens.add({
      targets: print,
      alpha: 0,
      duration: 1500,
      onComplete: () => print.destroy(),
    })
  }
}

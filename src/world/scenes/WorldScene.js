import Phaser from 'phaser'
import { bus, EVENTS } from '../bus'
import { ZONES } from '../data/zones'
import Player from '../entities/Player'
import ZoneManager from '../entities/Zone'
import { createPathfinder } from '../pathfinding'

// Draw order: water, the ground overlays, things lying flat on the ground,
// footprints and shadows - then everything that stands, sorted by where it
// meets the ground (its drawn base; the player's feet)
const DEPTH = { water: -300, ground: -200, groundProp: -150, footprint: -120, shadow: -100 }

const LERP = { pointer: 0.1, touch: 0.15 }
const FOLLOW_OFFSET_Y = { pointer: 0, touch: 40 }
// extra slop around a building for taps/clicks - a finger is imprecise, a mouse isn't
const ZONE_HIT_PAD = { pointer: 4, touch: 20 }
const FOOTPRINT_THROTTLE_MS = 180
const LABEL_THROTTLE_MS = 66
const LABEL_MARGIN = 10
const WATER_FRAME_MS = 420

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

// ground overlays in public/world/map/island.json, bottom to top
// (see scripts/world/terrain-spec.mjs)
const SURFACES = ['sand', 'grass', 'path', 'stone']
const FOOTPRINT_SURFACES = new Set(['sand', 'path'])

// Collision for props and scatter: [width, height] of a box along the drawn
// base - the trunk, the crate's footprint. Anything not listed (flowers) is
// walk-through.
const SOLID_BY_FRAME = {
  workbench: [40, 10],
  barrel: [18, 8],
  crates_three: [28, 12],
  crates_two: [20, 10],
  crate_open: [28, 10],
  dish: [22, 10],
  lamp_post: [6, 5],
  trophy_pedestal: [22, 10],
  stone_lantern: [14, 7],
  soil_bed: [44, 28],
  fence_post: [6, 5],
  fence_segment: [16, 5],
  bench: [36, 7],
  tree_large_a: [12, 7],
  tree_large_b: [12, 7],
  tree_small_a: [8, 6],
  tree_small_b: [8, 6],
  bush_a: [16, 7],
  bush_b: [16, 7],
  bush_c: [16, 7],
  rock_a: [16, 7],
  rock_b: [16, 8],
  rock_c: [18, 7],
}
// lying flat, so sorted under everything standing (crops in a bed draw over it)
const GROUND_FRAMES = new Set(['soil_bed'])
// flat things, and ones too thin to cast a readable shadow
const NO_SHADOW = new Set(['soil_bed', 'flowers_blue', 'flowers_red', 'flowers_white', 'fence_segment', 'fence_post'])
const SHADOW_RGBA = [43, 36, 56, 64] // deep plum, ~25%

const PROP_BY_ZONE = {
  workshop: 'prop-workbench',
  garden: 'prop-plant',
  archive: 'prop-crate',
  shrine: 'prop-trophy',
  tower: 'prop-antenna',
  terminal: 'prop-terminal',
  spawn: 'prop-signpost',
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

const toRect = (s) => ({
  left: s.x - s.width / 2,
  right: s.x + s.width / 2,
  top: s.y - s.height / 2,
  bottom: s.y + s.height / 2,
})

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
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // the island: public/world/map/island.json, built by scripts/world/build-map.mjs
    const map = this.make.tilemap({ key: 'island' })
    const terrain = map.addTilesetImage('terrain', 'terrain')
    this.water = this.add
      .tileSprite(0, 0, map.widthInPixels, map.heightInPixels, 'water', 0)
      .setOrigin(0, 0)
      .setDepth(DEPTH.water)
    this.surfaces = Object.fromEntries(
      SURFACES.map((name) => [name, map.createLayer(name, terrain).setDepth(DEPTH.ground)])
    )
    const collisionLayer = map.createLayer('collision', terrain).setVisible(false)
    collisionLayer.setCollisionByExclusion([-1])

    const spawn = map.findObject('markers', (o) => o.name === 'spawn')
    this.spawnPoint = { x: spawn.x, y: spawn.y }
    this.player = new Player(this, spawn.x, spawn.y)
    this.physics.add.collider(this.player.sprite, collisionLayer)
    this.playerShadow = this.add.image(0, 0, this.shadowTexture(18, 5)).setDepth(DEPTH.shadow)

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

    // buildings stand at the "zones" points in the map
    const placed = Object.fromEntries(map.getObjectLayer('zones').objects.map((o) => [o.name, o]))
    this.zones = ZONES.map((zone) => {
      const { x, y } = placed[zone.id]
      const tex = resolvePropTexture(this, PROP_BY_ZONE[zone.id], zone.frame)
      const image = this.add.image(x, y, tex.key, tex.frame)
      // real generated art is authored bottom-anchored (feet at sprite.y) so it
      // sorts correctly against the player; placeholder rects stay center-anchored
      if (tex.isReal) image.setOrigin(0.5, 1)
      const resolved = resolveZone({ ...zone, x, y }, artBox(image))
      // sorted by where it meets the ground, same as the player's feet
      image.setDepth(resolved.base)
      this.addShadow(resolved.art, { widthRatio: 0.95, maxHeight: 12 })
      return resolved
    })

    // Only the map border collided before, so the player walked through walls
    // and stood on roofs. Each building gets a box along its base; the roof
    // above it stays walk-behind, with depth sorting hiding the player there.
    // Props and scatter get the same treatment at their trunks and feet.
    const solids = this.zones.map(({ solid }) => solid)
    const atlas = this.textures.exists('objects') && this.textures.get('objects')
    for (const layer of ['props', 'scatter']) {
      for (const { name: frame, x, y } of map.getObjectLayer(layer).objects) {
        if (!atlas || !atlas.has(frame)) continue
        const image = this.add.image(x, y, 'objects', frame).setOrigin(0.5, 1)
        const art = artBox(image)
        image.setDepth(GROUND_FRAMES.has(frame) ? DEPTH.groundProp : art.bottom)
        if (!NO_SHADOW.has(frame)) this.addShadow(art)
        const size = SOLID_BY_FRAME[frame]
        if (size) {
          const [width, height] = size
          solids.push({ x: (art.left + art.right) / 2, y: art.bottom - height / 2, width, height })
        }
      }
    }
    const blocks = solids.map((s) => {
      const block = this.add.zone(s.x, s.y, s.width, s.height)
      this.physics.add.existing(block, true)
      return block
    })
    this.physics.add.collider(this.player.sprite, blocks)

    // Click/tap routing around the same things the colliders stop: the tiles
    // at the water's edge plus every solid box. Without it a tap on a building
    // from behind walked straight into its back wall and gave up there.
    const blockedTiles = new Uint8Array(map.width * map.height)
    collisionLayer.forEachTile((t) => {
      if (t.index > 0) blockedTiles[t.y * map.width + t.x] = 1
    })
    const { sprite } = this.player
    const bodyLeft = sprite.body.offset.x - sprite.displayOriginX
    const bodyTop = sprite.body.offset.y - sprite.displayOriginY
    this.findPath = createPathfinder({
      cols: map.width,
      rows: map.height,
      tile: map.tileWidth,
      blockedTiles,
      obstacles: solids.map(toRect),
      body: {
        left: bodyLeft,
        right: bodyLeft + sprite.body.width,
        top: bodyTop,
        bottom: bodyTop + sprite.body.height,
      },
    })

    this.zoneManager = new ZoneManager(this, this.player, this.zones)

    if (!this.reducedMotion) {
      let frame = 0
      this.time.addEvent({
        delay: WATER_FRAME_MS,
        loop: true,
        callback: () => {
          frame = (frame + 1) % this.textures.get('water').frameTotal
          this.water.setFrame(frame)
        },
      })
    }

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
      const target = id === 'spawn' ? this.spawnPoint : this.zones.find((z) => z.id === id)?.walkTo
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
    const { sprite } = this.player
    this.playerShadow.setPosition(sprite.x, sprite.body.bottom - 1)
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

  // A flat pixel ellipse (no antialiasing, to match the art), one texture per
  // size, cached. Canvas-drawn rather than a Graphics ellipse, which would come
  // out smoothed.
  shadowTexture(width, height) {
    const key = `shadow-${width}x${height}`
    if (this.textures.exists(key)) return key
    const texture = this.textures.createCanvas(key, width, height)
    const ctx = texture.getContext()
    const pixels = ctx.createImageData(width, height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x + 0.5 - width / 2) / (width / 2)
        const ny = (y + 0.5 - height / 2) / (height / 2)
        if (nx * nx + ny * ny <= 1) pixels.data.set(SHADOW_RGBA, (y * width + x) * 4)
      }
    }
    ctx.putImageData(pixels, 0, 0)
    texture.refresh()
    return key
  }

  // soft ellipse under something standing, centred on its drawn base
  addShadow(art, { widthRatio = 0.8, maxHeight = 8 } = {}) {
    const width = Math.max(6, Math.round((art.right - art.left) * widthRatio))
    const height = Math.max(3, Math.min(maxHeight, Math.round(width * 0.3)))
    return this.add
      .image((art.left + art.right) / 2, art.bottom - 1, this.shadowTexture(width, height))
      .setDepth(DEPTH.shadow)
  }

  // topmost ground overlay with a tile under a point
  surfaceAt(x, y) {
    for (let i = SURFACES.length - 1; i >= 0; i--) {
      if (this.surfaces[SURFACES[i]].hasTileAtWorldXY(x, y)) return SURFACES[i]
    }
    return 'water'
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

    const { x } = this.player.sprite
    const feet = this.player.sprite.body.bottom
    if (!FOOTPRINT_SURFACES.has(this.surfaceAt(x, feet))) return

    this.lastFootprintAt = time
    const print = this.add.image(x, feet - 2, 'footprint').setDepth(DEPTH.footprint).setAlpha(0.5)
    this.tweens.add({
      targets: print,
      alpha: 0,
      duration: 1500,
      onComplete: () => print.destroy(),
    })
  }
}

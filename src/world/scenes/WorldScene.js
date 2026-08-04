import Phaser from 'phaser'
import { bus, EVENTS } from '../bus'
import { buildMap, TILE_PATH, TILE_SAND } from '../data/mapLayout'
import { SPAWN_POINT, ZONES, TILE } from '../data/zones'
import Player from '../entities/Player'
import ZoneManager from '../entities/Zone'

const ZOOM = { pointer: 1.5, touch: 1 }
const LERP = { pointer: 0.1, touch: 0.15 }
const FOLLOW_OFFSET_Y = { pointer: 0, touch: 40 }
const TOUCH_ZONE_PAD = 20
const FOOTPRINT_THROTTLE_MS = 180

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
// frame within it) hasn't been generated yet — see BootScene.js
function resolvePropTexture(scene, placeholderKey, atlasFrame) {
  const atlas = scene.textures.exists('objects') && scene.textures.get('objects')
  if (atlas && atlasFrame && atlas.has(atlasFrame)) {
    return { key: 'objects', frame: atlasFrame, isReal: true }
  }
  return { key: placeholderKey, frame: undefined, isReal: false }
}

export default class WorldScene extends Phaser.Scene {
  constructor() {
    super('World')
    this.pauseInput = false
  }

  create() {
    if (import.meta.env.DEV) window.__worldScene = this

    // read once here — camera/input config doesn't react to mode changing
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

    this.player = new Player(this, SPAWN_POINT.x, SPAWN_POINT.y)
    this.physics.add.collider(this.player.sprite, collisionLayer)

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    const cam = this.cameras.main
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    cam.setZoom(ZOOM[this.mode])
    const lerp = this.reducedMotion ? 1 : LERP[this.mode]
    cam.startFollow(this.player.sprite, true, lerp, lerp)
    cam.setFollowOffset(0, FOLLOW_OFFSET_Y[this.mode])

    this.zoneManager = new ZoneManager(this, this.player, ZONES)

    ZONES.forEach((zone) => {
      const propKey = PROP_BY_ZONE[zone.id]
      if (!propKey) return
      const tex = resolvePropTexture(this, propKey, ATLAS_FRAME_BY_ZONE[zone.id])
      const prop = this.add.image(zone.x, zone.y, tex.key, tex.frame)
      // real generated art is authored bottom-anchored (feet at sprite.y) so it
      // sorts correctly against the player; placeholder rects stay center-anchored
      if (tex.isReal) prop.setOrigin(0.5, 1)
      prop.setDepth(zone.y)
    })

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
      const hitZone = this.mode === 'touch' ? this.zoneAt(pointer.worldX, pointer.worldY) : null

      this.player.moveTo(pointer.worldX, pointer.worldY, {
        onArrive: hitZone ? () => bus.emit(EVENTS.INTERACT, { id: hitZone.id }) : null,
      })
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
    // registered via addKeys/createCursorKeys — independent of pauseInput — which
    // silently blocks typing (e.g. Enter submitting the terminal's <form>) in any
    // React input rendered on top while a panel is open. Release capture whenever
    // input is paused, re-capture when back in the world.
    const handlePauseInput = (paused) => {
      this.pauseInput = paused
      if (paused) this.input.keyboard.removeCapture(capturedKeys)
      else this.input.keyboard.addCapture(capturedKeys)
    }
    bus.on(EVENTS.PAUSE_INPUT, handlePauseInput)

    const handleTeleport = ({ id }) => {
      const target = id === 'spawn' ? SPAWN_POINT : ZONES.find((z) => z.id === id)
      if (!target) return
      this.player.stop()
      this.player.sprite.body.reset(target.x, target.y)
    }
    bus.on(EVENTS.TELEPORT, handleTeleport)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.off(EVENTS.PAUSE_INPUT, handlePauseInput)
      bus.off(EVENTS.TELEPORT, handleTeleport)
    })

    bus.emit(EVENTS.ZONE_EXIT, { id: null })
  }

  update(time, delta) {
    this.player.update(delta, this.cursors, this.wasd, this.pauseInput)
    this.zoneManager.update()
    this.updateFootprints(time)

    if (!this.pauseInput && this.zoneManager.activeZone) {
      const { e, space, enter } = this.interactKeys
      if (
        Phaser.Input.Keyboard.JustDown(e) ||
        Phaser.Input.Keyboard.JustDown(space) ||
        Phaser.Input.Keyboard.JustDown(enter)
      ) {
        bus.emit(EVENTS.INTERACT, { id: this.zoneManager.activeZone })
      }

      if (!this.lastPromptEmit || time - this.lastPromptEmit > 66) {
        this.lastPromptEmit = time
        const zone = this.zoneManager.getZone(this.zoneManager.activeZone)
        const cam = this.cameras.main
        // cam.worldView (not scrollX/scrollY — this Phaser version's scrollX/Y
        // don't mean "world coord at viewport's top-left" while a camera is
        // actively following with lerp; worldView.x/y verified empirically to
        // be the correct reference for that) gives the visible world rectangle
        const screenX = (zone.x - cam.worldView.x) * cam.zoom
        const screenY = (zone.y - 40 - cam.worldView.y) * cam.zoom
        bus.emit(EVENTS.PROMPT_POS, { id: zone.id, x: screenX, y: screenY })
      }
    }
  }

  // Tap target, not player proximity — a finger is imprecise, so touch gets
  // extra hit-area radius (a near-miss that walks past the building is the
  // most annoying possible failure). Independent of ZoneManager's activeZone,
  // which drives the desktop E-prompt off the player's own position.
  zoneAt(x, y) {
    const pad = this.mode === 'touch' ? TOUCH_ZONE_PAD : 0
    return ZONES.find(
      (z) => Math.abs(x - z.x) <= z.width / 2 + pad && Math.abs(y - z.y) <= z.height / 2 + pad
    )
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

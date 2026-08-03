import Phaser from 'phaser'
import { bus, EVENTS } from '../bus'
import { buildMap, TILE_PATH, TILE_SAND } from '../data/mapLayout'
import { SPAWN_POINT, ZONES, TILE } from '../data/zones'
import Player from '../entities/Player'
import ZoneManager from '../entities/Zone'

const ZOOM = 3

const PROP_BY_ZONE = {
  workshop: 'prop-workbench',
  garden: 'prop-plant',
  archive: 'prop-crate',
  shrine: 'prop-trophy',
  tower: 'prop-antenna',
  terminal: 'prop-terminal',
  spawn: 'prop-signpost',
}

export default class WorldScene extends Phaser.Scene {
  constructor() {
    super('World')
    this.pauseInput = false
  }

  create() {
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
    cam.setZoom(ZOOM)
    const lerp = this.reducedMotion ? 1 : 0.1
    cam.startFollow(this.player.sprite, true, lerp, lerp)

    this.zoneManager = new ZoneManager(this, this.player, ZONES)

    ZONES.forEach((zone) => {
      const propKey = PROP_BY_ZONE[zone.id]
      if (!propKey) return
      const prop = this.add.image(zone.x, zone.y, propKey)
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
      this.player.moveTo(pointer.worldX, pointer.worldY)
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
        const screenX = (zone.x - cam.scrollX) * cam.zoom
        const screenY = (zone.y - 40 - cam.scrollY) * cam.zoom
        bus.emit(EVENTS.PROMPT_POS, { id: zone.id, x: screenX, y: screenY })
      }
    }
  }

  updateFootprints(time) {
    if (this.reducedMotion || !this.player.moving) return
    if (this.lastFootprintAt && time - this.lastFootprintAt < 180) return

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

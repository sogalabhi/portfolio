import Phaser from 'phaser'
import { bus, EVENTS } from '../bus'
import { TILE } from '../data/zones'

// game-only palette per the spec, hardcoded, independent of the site's tokens
const COLORS = {
  grass: 0x5fa65a,
  path: 0xe8d5a8,
  sand: 0xf2d9a0,
  block: 0x3e7a44,
  player: 0xc4552e,
  workbench: 0x8a5a3a,
  plant: 0x4a9c4e,
  crate: 0xb08968,
  trophy: 0xf2a65a,
  antenna: 0x9aa0a6,
  terminal: 0x2b2438,
}

const TILE_ORDER = [COLORS.grass, COLORS.path, COLORS.sand, COLORS.block]

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload() {
    bus.emit(EVENTS.BOOT_PROGRESS, 0.15)
    this.generateTileset()
    bus.emit(EVENTS.BOOT_PROGRESS, 0.5)
    this.generatePlayerTexture()
    bus.emit(EVENTS.BOOT_PROGRESS, 0.8)
    this.generatePropTextures()
    bus.emit(EVENTS.BOOT_PROGRESS, 1)

    // real art, once generated per scripts/assets/README.md - these 404 today,
    // which Phaser handles gracefully (fires 'loaderror', doesn't throw). Scenes
    // check `this.textures.exists('objects')` / `'char'` and fall back to the
    // placeholder textures above whenever these haven't been produced yet.
    this.load.atlas('objects', 'world/atlas/atlas.png', 'world/atlas/atlas.json')
    this.load.spritesheet('char', 'world/char.png', { frameWidth: 32, frameHeight: 32 })
  }

  create() {
    bus.emit(EVENTS.READY)
    this.scene.start('World')
  }

  generateTileset() {
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    TILE_ORDER.forEach((color, i) => {
      g.fillStyle(color, 1)
      g.fillRect(i * TILE, 0, TILE, TILE)
    })
    // outline the collision-marker tile (last index) so it reads as "solid" even as a placeholder
    g.lineStyle(2, 0x000000, 0.35)
    g.strokeRect((TILE_ORDER.length - 1) * TILE + 1, 1, TILE - 2, TILE - 2)
    g.generateTexture('tileset', TILE * TILE_ORDER.length, TILE)
    g.destroy()
  }

  generatePlayerTexture() {
    const w = 12
    const h = 16
    const dirs = ['down', 'left', 'right', 'up']
    const framesPerDir = 4
    const g = this.make.graphics({ x: 0, y: 0, add: false })

    dirs.forEach((dir, dirIndex) => {
      for (let f = 0; f < framesPerDir; f++) {
        const ox = (dirIndex * framesPerDir + f) * w
        g.fillStyle(COLORS.player, 1)
        g.fillRect(ox, 0, w, h)

        const bob = f % 2 === 0 ? 0 : 1
        g.fillStyle(0xfaf7f0, 1)
        const marker = 3
        let mx = ox + w / 2 - marker / 2
        let my = 2 + bob
        if (dir === 'down') my = h - 5 + bob
        if (dir === 'left') mx = ox + 1
        if (dir === 'right') mx = ox + w - 1 - marker
        g.fillRect(mx, my, marker, marker)
      }
    })

    g.generateTexture('player', w * dirs.length * framesPerDir, h)
    g.destroy()

    const texture = this.textures.get('player')
    dirs.forEach((dir, dirIndex) => {
      for (let f = 0; f < framesPerDir; f++) {
        const frameIndex = dirIndex * framesPerDir + f
        texture.add(`${dir}-${f}`, 0, frameIndex * w, 0, w, h)
      }
    })
  }

  generatePropTextures() {
    const props = [
      ['prop-workbench', COLORS.workbench, 28, 20],
      ['prop-plant', COLORS.plant, 14, 16],
      ['prop-crate', COLORS.crate, 16, 16],
      ['prop-trophy', COLORS.trophy, 14, 18],
      ['prop-antenna', COLORS.antenna, 10, 26],
      ['prop-terminal', COLORS.terminal, 18, 20],
      ['prop-signpost', COLORS.workbench, 6, 22],
      ['footprint', 0x00000, 4, 4],
    ]

    props.forEach(([key, color, w, h]) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false })
      g.fillStyle(color, key === 'footprint' ? 0.35 : 1)
      g.fillRect(0, 0, w, h)
      if (key !== 'footprint') {
        g.lineStyle(1, 0x000000, 0.25)
        g.strokeRect(0, 0, w, h)
      }
      g.generateTexture(key, w, h)
      g.destroy()
    })
  }
}

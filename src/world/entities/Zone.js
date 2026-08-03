import Phaser from 'phaser'
import { bus, EVENTS } from '../bus'

export default class ZoneManager {
  constructor(scene, player, zones) {
    this.scene = scene
    this.player = player
    this.activeZone = null
    this.touchedThisFrame = new Set()

    this.zones = zones.map((z) => {
      const gameObject = scene.add.zone(z.x, z.y, z.width, z.height)
      scene.physics.world.enable(gameObject, Phaser.Physics.Arcade.STATIC_BODY)

      scene.physics.add.overlap(player.sprite, gameObject, () => {
        this.touchedThisFrame.add(z.id)
        if (this.activeZone !== z.id) {
          this.activeZone = z.id
          bus.emit(EVENTS.ZONE_ENTER, { id: z.id })
        }
      })

      return { ...z, gameObject }
    })
  }

  getZone(id) {
    return this.zones.find((z) => z.id === id)
  }

  update() {
    if (this.activeZone && !this.touchedThisFrame.has(this.activeZone)) {
      bus.emit(EVENTS.ZONE_EXIT, { id: this.activeZone })
      this.activeZone = null
    }
    this.touchedThisFrame.clear()
  }
}

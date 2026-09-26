import { bus, EVENTS } from '../bus'

// Checked directly against player position once per render frame (not via
// physics.add.overlap) - Phaser 4's Arcade physics runs a decoupled fixed-step
// accumulator, so an overlap callback can fire 0 or 2+ times within a single
// render frame. Bookkeeping "touched this frame" off that callback caused a
// render frame with zero substeps to see no touch and fire a spurious
// ZONE_EXIT, immediately followed by ZONE_ENTER on the next frame - the E
// prompt flickering in every zone, even standing still at the center.
export default class ZoneManager {
  constructor(scene, player, zones) {
    this.scene = scene
    this.player = player
    this.activeZone = null
    this.zones = zones
  }

  getZone(id) {
    return this.zones.find((z) => z.id === id)
  }

  update() {
    const { x, y } = this.player.sprite
    // the trigger strip in front of each door (see WorldScene.resolveZone),
    // not the building itself - that's solid now
    const zone = this.zones.find(
      ({ trigger: t }) => Math.abs(x - t.x) <= t.width / 2 && Math.abs(y - t.y) <= t.height / 2
    )
    const id = zone ? zone.id : null

    if (id !== this.activeZone) {
      if (this.activeZone) bus.emit(EVENTS.ZONE_EXIT, { id: this.activeZone })
      this.activeZone = id
      if (id) bus.emit(EVENTS.ZONE_ENTER, { id })
    }
  }
}

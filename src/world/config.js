import Phaser from 'phaser'
import BootScene from './scenes/BootScene'
import WorldScene from './scenes/WorldScene'

export const TILE = 16

// visualViewport, not innerWidth/innerHeight - iOS Safari's innerHeight can
// lag or jump during toolbar expand/collapse; visualViewport tracks the true
// visible area.
export function getViewportSize() {
  const vv = window.visualViewport
  return vv ? { width: vv.width, height: vv.height } : { width: window.innerWidth, height: window.innerHeight }
}

export function makeConfig(parent) {
  const { width, height } = getViewportSize()

  return {
    type: Phaser.AUTO,
    parent,
    width,
    height,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#87C5C2',
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scale: {
      // NONE, not RESIZE - Phaser's own RESIZE listener reacts to every
      // 'resize' event immediately, which stutters through the whole
      // animation while the iOS toolbar collapses on scroll. We drive
      // scale.resize() ourselves instead, debounced (see WorldPage.jsx).
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, WorldScene],
  }
}

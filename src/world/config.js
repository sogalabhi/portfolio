import Phaser from 'phaser'
import BootScene from './scenes/BootScene'
import WorldScene from './scenes/WorldScene'

export const TILE = 16
export const ZOOM = 1.5

export function makeConfig(parent) {
  return {
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#87C5C2',
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, WorldScene],
  }
}

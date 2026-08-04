import Phaser from 'phaser'

export const bus = new Phaser.Events.EventEmitter()

export const EVENTS = {
  READY: 'world:ready',
  BOOT_PROGRESS: 'boot:progress',
  ZONE_ENTER: 'zone:enter',
  ZONE_EXIT: 'zone:exit',
  INTERACT: 'zone:interact',
  TELEPORT: 'world:teleport',
  PAUSE_INPUT: 'world:pauseInput',
  PROMPT_POS: 'world:promptPos',
  SHEET_FULL: 'world:sheetFull',
  ZONE_LABELS: 'world:zoneLabels',
}

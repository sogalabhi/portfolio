import Phaser from 'phaser'

// 'char' is a single static 32x32 sprite (a "32x32 Battlers" pack frame — front-
// facing only, no walk cycle), loaded by BootScene from world/char.png. It's a
// quick real-art swap-in, not the deliberate LimeZu/Kenney walk-cycle pack call —
// see scripts/assets/README.md for that. With no frames to animate, we just flip
// the sprite horizontally for left/right and hold the single pose otherwise.
// Falls back to the placeholder 'player' texture/anim rig when 'char' isn't loaded.

const SPEED = 130
const ARRIVE_DIST = 4
const STUCK_MS = 300

export default class Player {
  constructor(scene, x, y) {
    this.scene = scene
    this.usingCharArt = scene.textures.exists('char')

    if (this.usingCharArt) {
      this.sprite = scene.physics.add.sprite(x, y, 'char', 0)
      this.sprite.body.setSize(20, 14)
      this.sprite.body.setOffset(6, 16)
    } else {
      this.sprite = scene.physics.add.sprite(x, y, 'player', 'down-0')
      this.sprite.body.setSize(8, 6)
      this.sprite.body.setOffset(2, 10)
    }
    this.sprite.setDepth(y)

    this.facing = 'down'
    this.moveTarget = null
    this.moveArriveCallback = null
    this.moving = false
    this.stuckSince = null
    this.lastPos = { x, y }

    if (!this.usingCharArt) {
      this.createAnimations()
      this.sprite.play('idle-down')
    }
  }

  createAnimations() {
    const anims = this.scene.anims
    ;['down', 'left', 'right', 'up'].forEach((dir) => {
      if (!anims.exists(`walk-${dir}`)) {
        anims.create({
          key: `walk-${dir}`,
          frames: [0, 1, 2, 3].map((f) => ({ key: 'player', frame: `${dir}-${f}` })),
          frameRate: 8,
          repeat: -1,
        })
      }
      if (!anims.exists(`idle-${dir}`)) {
        anims.create({
          key: `idle-${dir}`,
          frames: [{ key: 'player', frame: `${dir}-0` }],
          frameRate: 1,
        })
      }
    })
  }

  moveTo(x, y, { onArrive } = {}) {
    this.moveTarget = { x, y }
    this.moveArriveCallback = onArrive || null
    this.stuckSince = null
  }

  stop() {
    this.moveTarget = null
    this.moveArriveCallback = null
    this.sprite.body.setVelocity(0, 0)
  }

  update(delta, cursors, wasd, pauseInput) {
    if (pauseInput) {
      this.sprite.body.setVelocity(0, 0)
      if (!this.usingCharArt) this.sprite.anims.play(`idle-${this.facing}`, true)
      this.sprite.setDepth(this.sprite.y)
      return
    }

    let vx = 0
    let vy = 0

    const left = cursors.left.isDown || wasd.left.isDown
    const right = cursors.right.isDown || wasd.right.isDown
    const up = cursors.up.isDown || wasd.up.isDown
    const down = cursors.down.isDown || wasd.down.isDown

    if (left) vx -= 1
    if (right) vx += 1
    if (up) vy -= 1
    if (down) vy += 1

    const usingKeyboard = vx !== 0 || vy !== 0
    if (usingKeyboard) {
      this.moveTarget = null
      this.moveArriveCallback = null
    }

    if (!usingKeyboard && this.moveTarget) {
      const dx = this.moveTarget.x - this.sprite.x
      const dy = this.moveTarget.y - this.sprite.y
      const dist = Math.hypot(dx, dy)

      if (dist < ARRIVE_DIST) {
        this.moveTarget = null
        const onArrive = this.moveArriveCallback
        this.moveArriveCallback = null
        if (onArrive) onArrive()
      } else {
        vx = dx / dist
        vy = dy / dist

        const moved = Math.hypot(this.sprite.x - this.lastPos.x, this.sprite.y - this.lastPos.y)
        if (moved < 0.5) {
          this.stuckSince = this.stuckSince ?? performance.now()
          if (performance.now() - this.stuckSince > STUCK_MS) {
            // gave up short of the target — not a real arrival, don't fire onArrive
            this.moveTarget = null
            this.moveArriveCallback = null
            vx = 0
            vy = 0
          }
        } else {
          this.stuckSince = null
        }
      }
    }

    this.lastPos = { x: this.sprite.x, y: this.sprite.y }

    const vec = new Phaser.Math.Vector2(vx, vy)
    if (vec.length() > 0) vec.normalize()
    this.sprite.body.setVelocity(vec.x * SPEED, vec.y * SPEED)

    if (vec.length() > 0) {
      this.facing =
        Math.abs(vec.x) > Math.abs(vec.y) ? (vec.x > 0 ? 'right' : 'left') : vec.y > 0 ? 'down' : 'up'
      if (this.usingCharArt) this.sprite.setFlipX(this.facing === 'left')
      else this.sprite.anims.play(`walk-${this.facing}`, true)
      this.moving = true
    } else {
      if (this.usingCharArt) this.sprite.setFlipX(this.facing === 'left')
      else this.sprite.anims.play(`idle-${this.facing}`, true)
      this.moving = false
    }

    this.sprite.setDepth(this.sprite.y)
  }
}

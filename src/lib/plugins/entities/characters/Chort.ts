import BaseEntity, { IBaseEntityParams } from "./BaseEntity";
import { Hittable } from "../interfaces/Hittable";

export default class Chort extends BaseEntity implements Hittable {
    target?: Hittable
    collider?: Phaser.Physics.Arcade.Collider
    chasing = false
    lastHit = 0
    hitCooldown = 300
    knockbackCooldown = 1000
    timeOfDeath = 0

    constructor(params: IBaseEntityParams, target?: Hittable ) {
        super(params)

        if (target) this.setTarget(target)

        this.setDrag(50)
        this.setSize(10, 16)

        this.scene.add.existing(this)
        this.scene.physics.world.enable(this)
    }

    update() {
        if (this.alive) super.update()
        if (!this.target) {
            return
        }
        if (!this.chasing) {
            this.chasing = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) < 100
        } else {
            const time = this.scene.time.now
            const inTintPeriod = time < this.lastHit + 50
            const isKnockbacked = time < this.lastHit + this.knockbackCooldown
            const isDying = time < this.timeOfDeath + 1000

            //set flasing during hit cooldown
            if (this.isOnHitCooldown() && !inTintPeriod) {
                this.setAlpha(time % 200 < 100 ? 0.1 : 1)
            } else {
                this.setAlpha(1)
            }
            
            //clear tint after tint window
            if (!inTintPeriod && this.isTinted && this.alive) this.clearTint()

            //disable body after dead
            if (!isDying && !this.alive) {
                this.disableBody(true, true)
                return
            }

            //move if not knockbacked
            if (!isKnockbacked) this.scene.physics.moveToObject(this, this.target, this.movementSpeed)
        }
    }

    setTarget(target: Hittable) {
        this.collider?.destroy()
        this.target = target
        this.collider = this.scene.physics.add.overlap(this, this.target, () => this.overlapHandler())
    }

    overlapHandler() {
        if (this.alive) this.target?.hit(10, 0.5, this)
    }

    hit(damage: number, knockback: number, hitter: Phaser.GameObjects.Sprite): boolean {
        const time = this.scene.time.now
        if (this.isOnHitCooldown()) return false
        if (!this.alive) return false

        const newHealth = this.getData('hp') - damage
        this.setData('hp', newHealth)
        this.lastHit = time

        const angle = Phaser.Math.Angle.Between(this.x, this.y, hitter.x, hitter.y)
        const oppoVelocity = this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle) + 180, this.movementSpeed * knockback)
        this.setVelocity(oppoVelocity.x, oppoVelocity.y)

        if (newHealth < 0) {
            this.die()
            return true
        }

        this.setTintFill(0xDDDDDD)

        return true
    }

    isOnHitCooldown(): boolean {
        return this.scene.time.now < this.lastHit + this.hitCooldown
    }

    die() {
        this.setTint(0xEE0000)
        this.timeOfDeath = this.scene.time.now
        this.alive = false
        this.anims.stop()
    }
}
import BaseEntity, { IBaseEntityParams } from "./BaseEntity";
import { Hittable } from "../interfaces/Hittable";

export default class Chort extends BaseEntity implements Hittable {
    target?: Hittable
    collider?: Phaser.Physics.Arcade.Collider
    chasing = false
    lastHit = 0
    hitCooldown = 200
    knockbackCooldown = 1000

    constructor(params: IBaseEntityParams, target?: Hittable ) {
        super(params)

        if (target) this.setTarget(target)

        this.setDrag(50)
        this.setSize(10, 16)

        this.scene.add.existing(this)
        this.scene.physics.world.enable(this)
    }

    update() {
        super.update()
        if (!this.target) {
            return
        }
        if (!this.chasing) {
            this.chasing = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) < 100
        } else {
            const time = this.scene.time.now
            if (time > this.lastHit + this.hitCooldown) this.clearTint()
            if (time < this.lastHit + this.knockbackCooldown) return
            this.scene.physics.moveToObject(this, this.target, this.movementSpeed)
        }
    }

    setTarget(target: Hittable) {
        this.collider?.destroy()
        this.target = target
        this.collider = this.scene.physics.add.overlap(this, this.target, () => this.overlapHandler())
    }

    overlapHandler() {
        this.target?.hit(10, 0.5, this)
    }

    hit(damage: number, knockback: number, hitter: Phaser.GameObjects.Sprite): boolean {
        const time = this.scene.time.now
        if (time < this.lastHit + this.hitCooldown ) return false

        this.setData('hp', this.getData('hp') - damage)
        this.lastHit = time
        this.setTint(0xff0000)

        const angle = Phaser.Math.Angle.Between(this.x, this.y, hitter.x, hitter.y)
        const oppoVelocity = this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle) + 180, this.movementSpeed * knockback)
        this.setVelocity(oppoVelocity.x, oppoVelocity.y)

        return true
    }
}
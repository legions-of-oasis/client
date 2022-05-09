import { Hittable } from '../interfaces/Hittable';
import { Weapon } from '../interfaces/Weapon';
import BaseEntity, { IBaseEntityParams } from './BaseEntity';

interface IPlayerParams extends IBaseEntityParams {
    equippedWeapon?: Weapon
}

export default class Player extends BaseEntity implements Hittable {
    equippedWeapon?: Weapon
    lastHit = 0
    hitCooldown = 1000
    knockbackCooldown = 200
    bubble = true
    
    constructor(params: IPlayerParams) {
        super(params)

        this.equippedWeapon = params.equippedWeapon
        this.setSize(10, 16)
        this.setDrag(10)
    }

    update(movement: boolean[]): void {
        //update equipped weapon
        if (this.equippedWeapon) this.equippedWeapon.update()

        //update hit display
        const time = this.scene.time.now
        const inTintPeriod = time < this.lastHit + 50
        const isKnockbacked = time < this.lastHit + this.knockbackCooldown

        if (!isKnockbacked) super.update(movement)
        if (!inTintPeriod && this.isTinted) this.clearTint()
        if (this.isOnHitCooldown() && !inTintPeriod) {
            this.setAlpha(time % 200 < 100 ? 0.1 : 1)
        } else {
            this.setAlpha(1)
        }
    }

    setEquippedWeapon(weapon: Weapon) {
        this.equippedWeapon = weapon
    }

    hit(damage: number, knockback: number, hitter: Phaser.GameObjects.Sprite) {
        const time = this.scene.time.now
        if (this.isOnHitCooldown()) return false

        this.setTintFill(0xDDDDDD)

        this.lastHit = time

        const angle = Phaser.Math.Angle.Between(this.x, this.y, hitter.x, hitter.y)
        const oppoVelocity = this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle) + 180, this.movementSpeed * knockback)
        this.setVelocity(oppoVelocity.x, oppoVelocity.y)

        const newHealth = this.getData('hp') - damage

        this.setData('hp', newHealth)

        return true
    }

    isOnHitCooldown() {
        return this.scene.time.now < this.lastHit + this.hitCooldown
    }
}
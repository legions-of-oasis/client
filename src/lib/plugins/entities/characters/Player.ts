import { Hittable } from '../interfaces/Hittable';
import { Weapon } from '../interfaces/Weapon';
import BaseEntity, { IBaseEntityParams } from './BaseEntity';

interface IPlayerParams extends IBaseEntityParams {
    equippedWeapon?: Weapon
}

export default class Player extends BaseEntity implements Hittable {
    equippedWeapon?: Weapon
    lastHit = 0
    hitCooldown = 500
    knockbackCooldown = 200
    
    constructor(params: IPlayerParams) {
        super(params)

        this.equippedWeapon = params.equippedWeapon
        this.setSize(10, 16)
        this.setDrag(10)
    }

    update(movement: boolean[]): void {
        const time = this.scene.time.now
        if (time > this.lastHit + this.knockbackCooldown) {
            super.update(movement)
        }

        //update equipped weapon
        if (this.equippedWeapon) this.equippedWeapon.update()
        if (time > this.lastHit + this.hitCooldown) this.clearTint()
    }

    setEquippedWeapon(weapon: Weapon) {
        this.equippedWeapon = weapon
    }

    hit(damage: number, knockback: number, hitter: Phaser.GameObjects.Sprite) {
        const time = this.scene.time.now
        if (time < this.lastHit + this.hitCooldown) return false

        this.setTint(0xff0000)

        this.lastHit = time

        const angle = Phaser.Math.Angle.Between(this.x, this.y, hitter.x, hitter.y)
        const oppoVelocity = this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle) + 180, this.movementSpeed * knockback)
        this.setVelocity(oppoVelocity.x, oppoVelocity.y)

        const newHealth = this.getData('hp') - damage
        this.setData('hp', newHealth)

        return true
    }
}
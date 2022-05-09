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
    
    constructor(params: IPlayerParams) {
        super(params)

        this.equippedWeapon = params.equippedWeapon
        

        //add event listeners
        this.scene.input.on('pointerdown', () => {
            if (!this.scene.input.mousePointer.locked || !this.equippedWeapon) return

            this.equippedWeapon.attack()
        })
    }

    update(movement: boolean[]): void {
        super.update(movement)

        //update equipped weapon
        if (this.equippedWeapon) this.equippedWeapon.update()
        const time = this.scene.time.now
        if (time > this.lastHit + 300) this.clearTint()
    }

    setEquippedWeapon(weapon: Weapon) {
        this.equippedWeapon = weapon
    }

    hit(damage: number) {
        const time = this.scene.time.now
        if (time < this.lastHit + this.hitCooldown) return false

        this.setTint(0xff0000)
        this.lastHit = time
        this.currentHp -= damage
        this.emit('hit', damage)
        return true
    }
}
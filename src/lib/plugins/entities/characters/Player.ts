// import { Weapon } from '../interfaces/Weapon';
// import BaseEntity, { IBaseEntityParams } from './BaseEntity';

import { ClientChannel } from "@geckos.io/client";
import { states } from "../../../../commons/states";
import { Weapon } from "../interfaces/Weapon";
import BaseEntity, { IBaseEntityParams } from "./BaseEntity";

// interface IPlayerParams extends IBaseEntityParams {
//     equippedWeapon?: Weapon
// }

// export default class Player extends BaseEntity {
//     equippedWeapon?: Weapon
//     lastHit = 0
//     hitCooldown = 1000
//     knockbackCooldown = 200
    
//     constructor(params: IPlayerParams) {
//         super(params)

//         this.equippedWeapon = params.equippedWeapon
//         this.setSize(10, 16)
//         this.setDrag(10)
//     }

//     update(movement: boolean[]): void {
//         //update equipped weapon
//         if (this.equippedWeapon) this.equippedWeapon.update()

//         //get current time
//         const time = this.scene.time.now

//         //small period where sprite flashes white after being hit
//         const inTintPeriod = time < this.lastHit + 50

//         //is knockbacked (staggered)
//         const isKnockbacked = time < this.lastHit + this.knockbackCooldown

//         //if not staggered, update movement with input
//         if (!isKnockbacked) super.update(movement)

//         //if not in tint period and is tinted and is not dashing, clear all tint
//         if (!inTintPeriod && this.isTinted && !this.isDashing()) this.clearTint()

//         //if on hit cooldown and not in tint period, alternate flash the player to show invulnerability
//         if (this.isOnHitCooldown() && !inTintPeriod) {
//             this.setAlpha(time % 200 < 100 ? 0.1 : 1)
//         } else {
//             this.setAlpha(1)
//         }
//     }

//     setEquippedWeapon(weapon: Weapon) {
//         this.equippedWeapon = weapon
//     }

//     hit(damage: number, knockback: number, hitter: Phaser.GameObjects.Sprite) {
//         //get current time
//         const time = this.scene.time.now
        
//         //if on hit cooldown do nothing and return false
//         if (this.isOnHitCooldown()) return false

//         //if is dashing do nothing and return false
//         if (this.isDashing()) return false

//         //set white tint
//         this.setTintFill(0xDDDDDD)

//         //set last hit time
//         this.lastHit = time

//         //get angle between hitter and player
//         const angle = Phaser.Math.Angle.Between(this.x, this.y, hitter.x, hitter.y)

//         //get knockback velocity
//         const oppoVelocity = this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle) + 180, this.movementSpeed * knockback)

//         //set knockback velocity
//         this.setVelocity(oppoVelocity.x, oppoVelocity.y)

//         //get new health after damage
//         const newHealth = this.getData('hp') - damage

//         //set new health after damage
//         this.setData('hp', newHealth)

//         //return true to indicate hit successful
//         return true
//     }

//     dash() {
//         //get current time
//         const time = this.scene.time.now

//         //check if on cooldown
//         const isOnDashCooldown = time < this.lastDash + this.dashDuration + this.dashCooldown
//         if (isOnDashCooldown) return
//         if (this.body.velocity.length() === 0) return

//         this.lastDash = time
//         this.setTintFill(0xDDDDDD)
//         const dashSpeed = this.body.velocity.normalize().scale(this.movementSpeed * 6)
//         this.setVelocity(dashSpeed.x, dashSpeed.y)
//     }

//     isOnHitCooldown() {
//         return this.scene.time.now < this.lastHit + this.hitCooldown
//     }

//     isDashing() {
//         return this.scene.time.now < this.lastDash + this.dashDuration
//     }
// }

export default class Player extends BaseEntity {
    dashDuration: number
    dashCooldown: 200
    lastDash = 0
    hitCooldown: number
    lastHit = 0
    staggerDuration: number
    hitTintDuration: number
    equippedWeapon?: Weapon

    constructor(params: IBaseEntityParams, equippedWeapon?: Weapon) {
        super(params)

        this.setSize(10,16)
        this.setDrag(10)
        this.setName(params.id)

        this.dashDuration = 150
        this.dashCooldown = 200
        this.hitCooldown = 1000
        this.staggerDuration = 200
        this.hitTintDuration = 50
        this.equippedWeapon = equippedWeapon
    }

    update(movement?: boolean[]) {
        if (!this.isStaggered() && !this.isDashing()) this.moveWithInput(movement!)
        this.equippedWeapon?.update()
        this.updateState()
        super.update()
    }

    updateState() {
        const time = this.scene.time.now

        if (this.state === states.HIT) {
            if (time > this.hitTintDuration && time < this.hitCooldown) this.setState(states.HITCOOLDOWN)
        }
    }

    moveWithInput(movement: boolean[]) {
        const velocity = this.body.velocity
        const [up, down, left, right] = movement
        const time = this.scene.time.now
        let isDashing = time < this.lastDash + this.dashDuration

        if (isDashing) return
        
        if (up || down || left || right) {
            //up and down
            if (up && down) {
                this.setVelocityY(0)
            } else if (up) {
                this.setVelocityY(-this.movementSpeed)
            } else if (down) {
                this.setVelocityY(this.movementSpeed)
            } else {
                this.setVelocityY(0)
            }

            //left and right
            if (left && right) {
                this.setVelocityX(0)
            } else if (left) {
                this.setVelocityX(-this.movementSpeed)
                // this.lastDirectionIsLeft = true
            } else if (right) {
                this.setVelocityX(this.movementSpeed)
                // this.lastDirectionIsLeft = false
            } else {
                this.setVelocityX(0)
            }

            //diagonals
            if (velocity?.x != 0 && velocity?.y != 0) {
                const diagonalVelocity = velocity.normalize().scale(this.movementSpeed)
                this.setVelocity(diagonalVelocity.x, diagonalVelocity.y)
            }

            this.setState(states.MOVING)
        } else {
            //idle
            this.setVelocity(0)

            this.setState(states.IDLE)
        }
    }

    dash() {
        //get current time
        const time = this.scene.time.now

        //check if on cooldown
        const isOnDashCooldown = time < this.lastDash + this.dashDuration + this.dashCooldown
        if (isOnDashCooldown || this.body.velocity.length() === 0 || this.isStaggered()) return

        this.lastDash = time
        
        const dashSpeed = this.body.velocity.normalize().scale(this.movementSpeed * 6)
        this.setVelocity(dashSpeed.x, dashSpeed.y)

        this.setState(states.DASHING)
    }

    hit(hitter: Phaser.Physics.Arcade.Sprite, knockback: number) {
        //if on hit cooldown or dashing return early
        if (this.isOnHitCooldown() || this.isDashing()) return

        //set white tint
        this.setState(states.HIT)

        //get current time
        const time = this.scene.time.now

        //set last hit time
        this.lastHit = time

        //get angle between hitter and player
        const angle = Phaser.Math.Angle.Between(this.x, this.y, hitter.x, hitter.y)

        //get knockback velocity
        const oppoVelocity = this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle) + 180, this.movementSpeed * knockback)

        //set knockback velocity
        this.setVelocity(oppoVelocity.x, oppoVelocity.y)
    }
    
    attack(channel: ClientChannel, serverTime: number) {
        if (this.isStaggered() || this.isDashing() || !this.equippedWeapon) return

        this.equippedWeapon.renderAttacking()

        channel.emit('attack', { time: serverTime, x: this.equippedWeapon.x, y: this.equippedWeapon.y }, { reliable: true })
    }

    isOnHitCooldown() {
        return this.scene.time.now < this.lastHit + this.hitCooldown
    }

    isDashing() {
        return this.scene.time.now < this.lastDash + this.dashDuration
    }

    isStaggered() {
        return this.scene.time.now < this.lastHit + this.staggerDuration
    }
}
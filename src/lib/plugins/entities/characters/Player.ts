// import { Weapon } from '../interfaces/Weapon';
// import BaseEntity, { IBaseEntityParams } from './BaseEntity';

import { ClientChannel } from "@geckos.io/client";
import { states } from "../../../../commons/states";
import { Weapon } from "../interfaces/Weapon";
import BaseEntity, { IBaseEntityParams } from "./BaseEntity";

export default class Player extends BaseEntity {
    dashDuration: number
    dashCooldown: 200
    lastDash = 0
    hitCooldown: number
    lastHit = 0
    staggerDuration: number
    hitTintDuration: number
    equippedWeapon?: Weapon
    aimAngle?: number

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
        if (!this.isStaggered() && !this.isDashing() && movement && this.scene.input.activePointer.locked) this.moveWithInput(movement)
        this.equippedWeapon?.update(this.aimAngle)
        super.update()
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

            if (!this.isOnHitCooldown()) this.setState(states.MOVING)
        } else {
            //idle
            this.setVelocity(0)

            if (!this.isOnHitCooldown()) this.setState(states.IDLE)
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

        //set hitcooldown state after tint state
        this.scene.time.delayedCall(this.hitTintDuration, () => this.setState(states.HITCOOLDOWN))

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

        channel.emit('attack', { time: serverTime, x: this.x, y: this.y, angle: this.aimAngle }, { reliable: true })
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
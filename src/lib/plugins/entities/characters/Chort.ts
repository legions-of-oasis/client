import { states } from "../../../../commons/states";
import BaseEntity, { IBaseEntityParams } from "./BaseEntity";
import Player from "./Player";

export default class Chort extends BaseEntity {
    // target?: Hittable
    // collider?: Phaser.Physics.Arcade.Collider
    // chasing = false
    // lastHit = 0
    // hitCooldown = 300
    // knockbackCooldown = 1000
    // timeOfDeath = 0
    // pendingHit = 0
    player: Player
    knockback = 0.5

    constructor(params: IBaseEntityParams, player: Player) {
        super(params)

        this.setSize(10, 16)
        this.setName(params.id)

        this.player = player

        this.scene.physics.add.overlap(this, this.player, (_, player) => {
            if (this.state === states.DYING || this.state === states.DEAD) return
            (player as Player).hit(this, this.knockback)
        })
    }

    update() {
        super.update()
    }

    // render(state: states) {
    //     const actions: { [key in states]: () => void } = {
    //         [states.IDLE]: () => {
    //             //IDLE
    //             this.renderIdle()
    //         },
    //         [states.MOVING]: () => {
    //             //MOVING
    //             this.renderMove()
    //         },
    //         [states.HIT]: () => {
    //             //HIT
    //             this.renderHit()
    //         },
    //         [states.HITCOOLDOWN]: () => {
    //             //HITCOOLDOWN
    //             this.renderHitCooldown()
    //         },
    //         [states.DYING]: () => {
    //             //DYING
    //             this.renderDying()
    //         },
    //         [states.DEAD]: () => {
    //             //DEAD
    //             this.renderDead()
    //         }
    //     }

    //     actions[state]()
    // }
    
    // renderIdle() {
    //     if (this.isTinted) this.clearTint()
    //     if (this.alpha !== 1) this.setAlpha(1)
    //     super.update()
    // }

    // renderMove() {
    //     if (this.isTinted) this.clearTint()
    //     if (this.alpha !== 1) this.setAlpha(1)
    //     super.update()
    // }

    // renderHit() {
    //     this.setTintFill(0xDDDDDD)
    // }

    // renderHitCooldown() {
    //     if (this.isTinted) this.clearTint()
    //     this.setAlpha(this.scene.time.now % 200 < 100 ? 0.1 : 1)
    // }

    // renderDying() {
    //     if (this.alpha !== 1) this.setAlpha(1)
    //     this.setTint(0xEE0000)
    // }

    // renderDead() {
    //     this.disableBody(true, true)
    // }

    // setTarget(target: Hittable) {
    //     this.collider?.destroy()
    //     this.target = target
    //     this.collider = this.scene.physics.add.overlap(this, this.target, () => this.overlapHandler())
    // }

    // overlapHandler() {
    //     if (this.alive) this.target?.hit(10, 0.5, this)
    // }

    // hit(damage: number, knockback: number, hitter: Phaser.GameObjects.Sprite) {
    //     // const time = this.scene.time.now
    //     if (this.isOnHitCooldown() || !this.alive) return false

    //     // const newHealth = this.getData('hp') - damage
    //     // this.setData('hp', newHealth)
    //     // this.lastHit = time
    //     this.pendingHit = damage

    //     // const angle = Phaser.Math.Angle.Between(this.x, this.y, hitter.x, hitter.y)
    //     // const oppoVelocity = this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle) + 180, this.movementSpeed * knockback)
    //     // this.setVelocity(oppoVelocity.x, oppoVelocity.y)

    //     // if (newHealth < 0) {
    //         // this.die()
    //         // return true
    //     // }

    //     // this.setTintFill(0xDDDDDD)
    // }

    // isOnHitCooldown(): boolean {
    //     return this.scene.time.now < this.lastHit + this.hitCooldown
    // }

    // die() {
    //     this.setTint(0xEE0000)
    //     this.timeOfDeath = this.scene.time.now
    //     this.alive = false
    //     this.anims.stop()
    // }
}
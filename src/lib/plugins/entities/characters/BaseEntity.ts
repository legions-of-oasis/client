import Phaser from "phaser";
import { states } from "../../../../commons/states";
import { anims } from "../../../utils/keys";
import { Weapon } from "../interfaces/Weapon";

export interface IBaseEntityParams {
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    speed: number,
    id: string,
    equippedWeapon?: Weapon,
    hp: number
}

export default abstract class BaseEntity extends Phaser.Physics.Arcade.Sprite {
    movementSpeed: number
    lastDirectionIsLeft = true
    maxHp: number
    alive = true

    constructor(params: IBaseEntityParams) {
        super(params.scene, params.x, params.y, params.key)

        params.scene.add.existing(this)
        params.scene.physics.world.enable(this, 0)
        
        this.movementSpeed = params.speed
        this.maxHp = params.hp
        this.setData('hp', params.hp)
    }

    update() {
        this.render(this.state as states)
        this.animateMovement()
    }

    animateMovement() {
        //animations
        const velocity = this.body.velocity
        if (velocity.x !== 0) this.lastDirectionIsLeft = velocity.x < 0
        if (velocity?.x != 0 || velocity.y != 0 || this.state === states.MOVING) {
            this.setFlipX(this.lastDirectionIsLeft)
            this.anims.play(this.texture.key + '-' + anims.MOVE, true)
        } else {
            this.anims.play(this.texture.key + '-' + anims.IDLE, true)
        }
    }

    render(state: states) {
        const actions: { [key in states]: () => void } = {
            [states.IDLE]: () => {
                //IDLE
                this.renderIdle()
            },
            [states.MOVING]: () => {
                //MOVING
                this.renderMove()
            },
            [states.HIT]: () => {
                //HIT
                this.renderHit()
            },
            [states.HITCOOLDOWN]: () => {
                //HITCOOLDOWN
                this.renderHitCooldown()
            },
            [states.DYING]: () => {
                //DYING
                this.renderDying()
            },
            [states.DEAD]: () => {
                //DEAD
                this.renderDead()
            },
            [states.DASHING]: () => {
                this.renderDashing()
            }
        }

        actions[state]()
    }
    
    renderIdle() {
        if (this.isTinted) this.clearTint()
        if (this.alpha !== 1) this.setAlpha(1)
    }

    renderMove() {
        if (this.isTinted) this.clearTint()
        if (this.alpha !== 1) this.setAlpha(1)
    }

    renderHit() {
        this.setTintFill(0xDDDDDD)
    }

    renderHitCooldown() {
        if (this.isTinted) this.clearTint()
        this.setAlpha(this.scene.time.now % 200 < 100 ? 0.1 : 1)
    }

    renderDying() {
        if (this.alpha !== 1) this.setAlpha(1)
        this.setTint(0xEE0000)
    }

    renderDead() {
        this.disableBody(true, true)
    }

    renderDashing() {
        this.setTintFill(0xDDDDDD)
    }
}
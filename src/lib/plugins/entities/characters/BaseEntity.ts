import Phaser from "phaser";
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

    constructor(params: IBaseEntityParams) {
        super(params.scene, params.x, params.y, params.key)

        params.scene.add.existing(this)
        params.scene.physics.world.enable(this, 0)
        
        this.movementSpeed = params.speed
        this.maxHp = params.hp
        this.setData('hp', params.hp)
        this.anims.play(this.texture.key + '-' + anims.IDLE, true)
    }

    update(movement?: boolean[]) {
        if (movement) this.moveWithInput(movement)
        this.animateMovement()
    }

    moveWithInput(movement: boolean[]) {
        const velocity = this.body.velocity
        const [up, down, left, right] = movement
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
                this.setVelocityX(velocity!.x * Math.sqrt(0.5))
                this.setVelocityY(velocity!.y * Math.sqrt(0.5))
            }
        } else {
            //idle
            this.setVelocity(0)
        }

    }

    animateMovement() {
        //animations
        const velocity = this.body.velocity
        if (velocity.x !== 0) this.lastDirectionIsLeft = velocity.x < 0
        if (velocity?.x != 0 || velocity.y != 0) {
            this.setFlipX(this.lastDirectionIsLeft)
            this.anims.play(this.texture.key + '-' + anims.MOVE, true)
        } else {
            this.anims.play(this.texture.key + '-' + anims.IDLE, true)
        }
    }
}
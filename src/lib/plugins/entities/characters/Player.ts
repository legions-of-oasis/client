import Phaser from "phaser";
import { anims } from "../../../utils/keys";
import { Weapon } from "../weapons/Sword";

export interface IPlayerParams {
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    speed: number,
    id: string,
    equippedWeapon?: Weapon
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
    playerSpeed: number
    lastDirectionIsLeft = true
    equippedWeapon?: Weapon

    constructor(params: IPlayerParams) {
        super(params.scene, params.x, params.y, params.key)

        params.scene.add.existing(this)
        params.scene.physics.world.enable(this, 0)
        
        this.playerSpeed = params.speed
        this.equippedWeapon = params.equippedWeapon
        this.anims.play(this.texture.key + '-' + anims.IDLE, true)
    }

    update(movement: boolean[]) {
        //movement
        const velocity = this.body.velocity
        const [up, down, left, right] = movement
        if (up || down || left || right) {
            //up and down
            if (up && down) {
                this.setVelocityY(0)
            } else if (up) {
                this.setVelocityY(-this.playerSpeed)
            } else if (down) {
                this.setVelocityY(this.playerSpeed)
            } else {
                this.setVelocityY(0)
            }

            //left and right
            if (left && right) {
                this.setVelocityX(0)
            } else if (left) {
                this.setVelocityX(-this.playerSpeed)
                this.lastDirectionIsLeft = true
            } else if (right) {
                this.setVelocityX(this.playerSpeed)
                this.lastDirectionIsLeft = false
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

        //animations
        if (velocity?.x != 0 || velocity.y != 0) {
            this.setFlipX(this.lastDirectionIsLeft)
            this.anims.play(this.texture.key + '-' + anims.MOVE, true)
        } else {
            this.anims.play(this.texture.key + '-' + anims.IDLE, true)
        }

        //update equipped weapon
        if (this.equippedWeapon) this.equippedWeapon.update()
    }

    setEquippedWeapon(weapon: Weapon) {
        this.equippedWeapon = weapon
    }
}
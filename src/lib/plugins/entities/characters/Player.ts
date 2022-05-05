import Phaser from "phaser";
import { sprites, anims } from "../../../utils/keys";

export interface IPlayerParams {
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    speed: number,
    id: string
}

export default class Player extends Phaser.GameObjects.Sprite {
    playerSpeed: number
    lastDirectionIsLeft = true
    declare body: Phaser.Physics.Arcade.Body

    constructor(params: IPlayerParams) {
        super(params.scene, params.x, params.y, params.key)

        params.scene.add.existing(this)
        params.scene.physics.world.enable(this, 0)
        
        this.playerSpeed = params.speed
    }

    update(movement: boolean[]) {//movement
        const [up, down, left, right] = movement
        if (up || down || left || right) {
            //up and down
            if (up && down) {
                this.body.setVelocityY(0)
            } else if (up) {
                this.body.setVelocityY(-this.playerSpeed)
            } else if (down) {
                this.body.setVelocityY(this.playerSpeed)
            } else {
                this.body.setVelocityY(0)
            }

            //left and right
            if (left && right) {
                this.body.setVelocityX(0)
            } else if (left) {
                this.body.setVelocityX(-this.playerSpeed)
                this.lastDirectionIsLeft = true
            } else if (right) {
                this.body.setVelocityX(this.playerSpeed)
                this.lastDirectionIsLeft = false
            } else {
                this.body.setVelocityX(0)
            }

            //diagonals
            const velocity = this.body.velocity
            if (velocity?.x != 0 && velocity?.y != 0) {
                this.body.setVelocityX(velocity!.x * Math.sqrt(0.5))
                this.body.setVelocityY(velocity!.y * Math.sqrt(0.5))
            }

            //animations
            if (velocity?.x != 0 || velocity.y != 0) {
                this.setFlipX(this.lastDirectionIsLeft)
                this.anims.play(sprites.KNIGHT + '-' + anims.MOVE, true)
            } else {
                this.anims.play(sprites.KNIGHT + '-' + anims.IDLE, true)
            }
        } else {
            //idle
            this.body.setVelocity(0)
            this.anims.play(sprites.KNIGHT + '-' + anims.IDLE, true)
        }
    }
}
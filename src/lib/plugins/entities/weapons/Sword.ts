import Phaser from 'phaser'
import { anims, sprites } from '../../../utils/keys'
import { Weapon } from '../interfaces/Weapon'

interface ISwordParams {
    scene: Phaser.Scene,
    key: string,
    player: Phaser.Physics.Arcade.Sprite,
    reticle: Phaser.Physics.Arcade.Sprite
}

export default class Sword extends Phaser.Physics.Arcade.Sprite implements Weapon {
    player: Phaser.Physics.Arcade.Sprite
    reticle: Phaser.Physics.Arcade.Sprite
    damage = 20
    
    constructor(params: ISwordParams) {
        super(params.scene, params.player.x, params.player.y, params.key)

        //init properties
        this.player = params.player
        this.reticle = params.reticle

        //add to scene
        this.scene.add.existing(this)
        this.scene.physics.world.enable(this)

        this.setSize(20, 20)
    }

    update() {
        let angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.reticle.x, this.reticle.y)
        const newPos = Phaser.Math.RotateTo({x: this.player.x, y: this.player.y + 6}, this.player.x, this.player.y + 6, angle, 15)

        this.setPosition(newPos.x, newPos.y)

        angle = Phaser.Math.RadToDeg(angle)
        const isLeftHalf = angle < -90 || angle > 90
        this.setFlipX(isLeftHalf)
        this.setAngle(isLeftHalf ? angle + 135 : angle + 45)
    }

    attack(enemies: Phaser.Physics.Arcade.Sprite[]) {
        this.anims.play(sprites.SWORD + '-' + anims.ATTACK, true)
        this.scene.physics.overlap(enemies, this, (enemy: any) => {
            enemy.hit(this.damage, 2, this.player)
        })
    }
}
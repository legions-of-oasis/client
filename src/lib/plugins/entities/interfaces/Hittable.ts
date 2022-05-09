

export interface Hittable extends Phaser.Physics.Arcade.Sprite {
    hit: (damage: number) => boolean
}
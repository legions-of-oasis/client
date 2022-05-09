import BaseEntity, { IBaseEntityParams } from "./BaseEntity";
import { Hittable } from "../interfaces/Hittable";

export default class Chort extends BaseEntity {
    target?: Hittable
    collider?: Phaser.Physics.Arcade.Collider
    chasing = false
    lastHit = 0

    constructor(params: IBaseEntityParams, target?: Hittable ) {
        super(params)

        if (target) this.setTarget(target)
        this.setDrag(10)

        this.scene.add.existing(this)
        this.scene.physics.world.enable(this)
    }

    update() {
        super.update()
        if (!this.target) {
            return
        }
        if (!this.chasing) {
            this.chasing = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) < 100
        } else {
            this.scene.physics.moveToObject(this, this.target, this.movementSpeed)
        }
    }

    setTarget(target: Hittable) {
        this.collider?.destroy()
        this.target = target
        this.collider = this.scene.physics.add.overlap(this, this.target, () => this.overlapHandler())
    }

    overlapHandler() {
        this.target?.hit(10)
    }
}
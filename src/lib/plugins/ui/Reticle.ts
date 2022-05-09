import Phaser from 'phaser'

interface IReticleParams {
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    player: Phaser.GameObjects.Sprite,
    camera: Phaser.Cameras.Scene2D.Camera,
    maxRadius: number
}

export default class Reticle extends Phaser.Physics.Arcade.Sprite {
    pointer: Phaser.Input.Pointer
    player: Phaser.GameObjects.Sprite
    camera: Phaser.Cameras.Scene2D.Camera
    offset: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0)
    cameraOffset: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0)
    maxRadius: number

    constructor(params: IReticleParams) {
        super(params.scene, params.x, params.y, params.key)

        //init properties
        this.pointer = params.scene.input.mousePointer
        this.player = params.player
        this.camera = params.camera
        this.maxRadius = params.maxRadius

        //set invisible initially
        this.setVisible(false)

        //set scale
        this.setScale(0.4)

        //add to scene
        this.scene.add.existing(this)
        this.scene.physics.world.enable(this)

        //add event listeners
        this.scene.input.on('pointerdown', () => {
            if (!this.pointer.locked) {
                this.scene.input.mouse.requestPointerLock()
                this.setVisible(true)
            }
        })
        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => this.updateCamera(pointer))
    }

    update() {
        this.setPosition(this.player.x + this.cameraOffset.x + this.offset.x, this.player.y + this.cameraOffset.y + this.offset.y)
    }

    updateCamera(pointer: Phaser.Input.Pointer) {
        if (!this.pointer.locked) return

        this.offset.x += pointer.movementX / 2
        this.offset.y += pointer.movementY / 2

        const { width, height } = this.scene.scale

        this.offset.x = Phaser.Math.Clamp(this.offset.x, - width / 6, width / 6)
        this.offset.y = Phaser.Math.Clamp(this.offset.y, - height / 6, height / 6)

        const distance = Phaser.Math.Distance.Between(this.player.x + this.offset.x, this.player.y + this.offset.y, this.player.x, this.player.y)

        this.cameraOffset.x = this.offset.x
        this.cameraOffset.y = this.offset.y

        if (distance > this.maxRadius) {
            const ratio = distance / this.maxRadius
            this.cameraOffset.x /= ratio
            this.cameraOffset.y /= ratio
        }

        this.cameraOffset.x /= 4
        this.cameraOffset.y /= 4

        this.camera.startFollow(this.player, false, 1, 1, - this.cameraOffset.x, - this.cameraOffset.y)
    }
}
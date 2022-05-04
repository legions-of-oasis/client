import Phaser from 'phaser'
import NinePatch2 from 'phaser3-rex-plugins/plugins/ninepatch2.js'
import { fonts } from '../../utils/keys'

export class Button extends Phaser.GameObjects.Container {
    text: Phaser.GameObjects.BitmapText
    ninePatch: NinePatch2

    constructor({ scene, text, x, y, width, height, key }: { scene: Phaser.Scene, text: string, x: number, y: number, width: number, height: number, key: string }) {
        super(scene, x, y)
        this.ninePatch = new NinePatch2(scene, {
            x: 0,
            y: 0,
            width: width / 3,
            height: height / 3,
            key,
            columns: [3, undefined, 3],
            rows: [3, undefined, 5]
        }).setScale(3).setOrigin(0.5, 0.5).setInteractive()
        this.text = scene.add.bitmapText(0, 0, fonts.UPHEAVAL, text, 32).setOrigin(0.5, 0.5)
        scene.add.existing(this.ninePatch)
        this.add([this.ninePatch, this.text])
        scene.add.existing(this)
    }

    onClick(callback: () => void) {
        this.ninePatch.on('pointerup', callback)
    }
}
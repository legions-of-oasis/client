import Phaser from 'phaser'
import NinePatch2 from 'phaser3-rex-plugins/plugins/ninepatch2'
import { fonts, images } from '../../utils/keys'

export class Button extends Phaser.GameObjects.Container {
    text: Phaser.GameObjects.BitmapText
    ninePatch: NinePatch2
    key!: string

    constructor(
        { scene, text, x, y, width, height, key }:
            { scene: Phaser.Scene, text: string, x: number, y: number, width: number, height: number, key: string }
    ) {
        super(scene, x, y)

        this.key = key

        this.ninePatch = new NinePatch2(scene, {
            x: 0,
            y: 0,
            width: width / 3,
            height: height / 3,
            key,
            columns: [3, undefined, 3],
            rows: [3, undefined, 5]
        }).setScale(3).setOrigin(0.5, 0.5).setInteractive()
        scene.add.existing(this.ninePatch)

        this.text = scene.add.bitmapText(0, 0, fonts.UPHEAVAL, text, 32).setOrigin(0.5, 0.5)

        this.add([this.ninePatch, this.text])

        scene.add.existing(this)

        this.ninePatch.on('pointerover', () => {
            this.ninePatch.setScale(3.1)
            this.text.setScale(1.03)
        })

        this.ninePatch.on('pointerout', () => {
            this.ninePatch.setTexture(
                key,
                undefined,
                [3, undefined, 3],
                [3, undefined, 5]
            )
            this.ninePatch.setScale(3)
            this.text.setScale(1)
        })

        this.ninePatch.on('pointerdown', () => {
            this.ninePatch.setTexture(
                key + "pressed",
                undefined,
                [3, undefined, 3],
                [3, undefined, 3]
            )
            this.ninePatch.setScale(3)
            this.text.setScale(1)
        })
    }

    onClick(callback: () => void) {
        this.ninePatch.on('pointerup', () => {
            this.ninePatch.setTexture(
                this.key,
                undefined,
                [3, undefined, 3],
                [3, undefined, 5]
            )
            callback()
        })
    }

    setText(text: string) {
        this.text.setText(text)
    }

    setEnable(set: boolean) {
        if (set) {
            this.ninePatch.setInteractive()
            return
        }

        this.ninePatch.removeInteractive()
        this.text.setAlpha(0.5)
        this.ninePatch.setTexture(
            images.BTN_GREY_PRESSED,
            undefined,
            [3, undefined, 3],
            [3, undefined, 3]
        )
    }
}